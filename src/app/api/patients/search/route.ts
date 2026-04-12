import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getCurrentActorRole, getCurrentScope } from '@/lib/active-role'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { listPatientVisitRules } from '@/lib/repositories/patients'
import { mapDatabasePatientToPatientRecord } from '@/lib/patient-read-model'

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const actorRole = getCurrentActorRole(user)
  const actorScope = getCurrentScope(user)
  if (!['regional_admin', 'pharmacy_admin', 'pharmacy_staff'].includes(actorRole ?? '')) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const q = (url.searchParams.get('q') ?? '').trim()
  if (q.length < 1) return NextResponse.json({ ok: true, patients: [] })

  const supabase = createServerSupabaseClient()

  let allowedPharmacyIds: string[] | null = null
  let matchedPharmacyIds: string[] = []
  if (actorRole === 'regional_admin') {
    if (!actorScope.regionId) return NextResponse.json({ ok: true, patients: [] })
    const pharmacyResponse = await supabase
      .from('pharmacies')
      .select('id')
      .eq('organization_id', user.organization_id)
      .eq('region_id', actorScope.regionId)

    if (pharmacyResponse.error) {
      return NextResponse.json({ ok: false, error: 'pharmacy_scope_lookup_failed', details: pharmacyResponse.error.message }, { status: 500 })
    }
    allowedPharmacyIds = (pharmacyResponse.data ?? []).map((row) => String((row as Record<string, unknown>).id ?? '')).filter(Boolean)
    if (allowedPharmacyIds.length === 0) return NextResponse.json({ ok: true, patients: [] })
  }

  const pharmacyNameSearch = await supabase
    .from('pharmacies')
    .select('id')
    .eq('organization_id', user.organization_id)
    .ilike('name', `%${q}%`)
    .limit(30)

  if (!pharmacyNameSearch.error) {
    matchedPharmacyIds = (pharmacyNameSearch.data ?? []).map((row) => String((row as Record<string, unknown>).id ?? '')).filter(Boolean)
  }

  let query = supabase
    .from('patients')
    .select('*')
    .eq('organization_id', user.organization_id)
    .eq('status', 'active')
    .limit(30)
    .order('full_name', { ascending: true })

  if (allowedPharmacyIds) {
    query = query.in('pharmacy_id', allowedPharmacyIds)
  }
  if ((actorRole === 'pharmacy_admin' || actorRole === 'pharmacy_staff') && actorScope.pharmacyId) {
    query = query.eq('pharmacy_id', actorScope.pharmacyId)
  }

  const orConditions = [
    `full_name.ilike.%${q}%`,
    `address.ilike.%${q}%`,
    `phone.ilike.%${q}%`,
    `emergency_contact_name.ilike.%${q}%`,
    ...matchedPharmacyIds.map((id) => `pharmacy_id.eq.${id}`),
  ]

  const response = await query.or(orConditions.join(','))
  if (response.error) {
    return NextResponse.json({ ok: false, error: 'patient_search_failed', details: response.error.message }, { status: 500 })
  }

  const pharmacyIds = Array.from(new Set(((response.data ?? []) as Array<Record<string, unknown>>).map((row) => row.pharmacy_id).filter((value): value is string => typeof value === 'string')))
  const pharmacyMap = new Map<string, string>()
  if (pharmacyIds.length > 0) {
    const pharmacyResponse = await supabase.from('pharmacies').select('id, name').in('id', pharmacyIds)
    if (!pharmacyResponse.error) {
      for (const row of pharmacyResponse.data ?? []) {
        pharmacyMap.set(String((row as Record<string, unknown>).id), String((row as Record<string, unknown>).name ?? ''))
      }
    }
  }

  const patients = await Promise.all(
    ((response.data ?? []) as Array<Record<string, unknown>>).map(async (row) => {
      const visitRules = await listPatientVisitRules(String(row.id))
      return mapDatabasePatientToPatientRecord(row as never, visitRules, {
        pharmacyName: pharmacyMap.get(String(row.pharmacy_id ?? '')) || null,
      })
    }),
  )

  return NextResponse.json({ ok: true, patients })
}
