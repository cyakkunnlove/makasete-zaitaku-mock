import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getCurrentActorRole, getCurrentScope } from '@/lib/active-role'
import { ensureRecentReverification } from '@/lib/api-reauth'
import { writeAuditLog } from '@/lib/audit-log'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import type { PharmacyStatus } from '@/types/database'

function toPharmacyView(row: Record<string, unknown>, extras?: { patientCount?: number; pharmacyAdminStatus?: string }) {
  return {
    id: String(row.id),
    name: typeof row.name === 'string' ? row.name : '',
    area: typeof row.area === 'string' ? row.area : '',
    address: typeof row.address === 'string' ? row.address : '',
    phone: typeof row.phone === 'string' ? row.phone : '',
    fax: typeof row.fax === 'string' ? row.fax : '',
    forwardingPhone: typeof row.forwarding_phone === 'string' ? row.forwarding_phone : '',
    patientCount: extras?.patientCount ?? (typeof row.patient_count === 'number' ? row.patient_count : 0),
    status: typeof row.status === 'string' ? row.status : 'pending',
    contractDate: typeof row.contract_date === 'string' ? row.contract_date : '',
    saasFee: typeof row.saas_monthly_fee === 'number' ? row.saas_monthly_fee : Number(row.saas_monthly_fee ?? 0),
    nightFee: typeof row.night_monthly_fee === 'number' ? row.night_monthly_fee : Number(row.night_monthly_fee ?? 0),
    forwarding: row.forwarding_status === 'on',
    forwardingStatus: row.forwarding_status === 'on' ? 'on' : 'off',
    regionId: typeof row.region_id === 'string' ? row.region_id : null,
    regionName: typeof (row.region as { name?: unknown } | null)?.name === 'string' ? (row.region as { name: string }).name : null,
    pharmacyAdminStatus: extras?.pharmacyAdminStatus ?? 'uninvited',
    createdAt: typeof row.created_at === 'string' ? row.created_at : null,
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
  }
}

async function buildPharmacyDerivedMaps(supabase: ReturnType<typeof createServerSupabaseClient>, pharmacyIds: string[]) {
  const patientMap = new Map<string, number>()
  const adminStatusMap = new Map<string, string>()
  if (pharmacyIds.length === 0) return { patientMap, adminStatusMap }

  const patientResponse = await supabase
    .from('patients')
    .select('pharmacy_id, status')
    .in('pharmacy_id', pharmacyIds)
    .eq('status', 'active')

  if (!patientResponse.error) {
    for (const row of patientResponse.data ?? []) {
      const pharmacyId = (row as Record<string, unknown>).pharmacy_id as string | null
      if (!pharmacyId) continue
      patientMap.set(pharmacyId, (patientMap.get(pharmacyId) ?? 0) + 1)
    }
  }

  const invitationResponse = await supabase
    .from('account_invitations')
    .select('pharmacy_id, role, status, created_at')
    .in('pharmacy_id', pharmacyIds)
    .eq('role', 'pharmacy_admin')
    .order('created_at', { ascending: false })

  if (!invitationResponse.error) {
    for (const row of invitationResponse.data ?? []) {
      const pharmacyId = (row as Record<string, unknown>).pharmacy_id as string | null
      if (!pharmacyId || adminStatusMap.has(pharmacyId)) continue
      const status = (row as Record<string, unknown>).status as string | null
      adminStatusMap.set(pharmacyId, status === 'accepted' ? 'active' : status === 'pending' ? 'invited' : 'uninvited')
    }
  }

  const userResponse = await supabase
    .from('users')
    .select('pharmacy_id, role, status')
    .in('pharmacy_id', pharmacyIds)
    .eq('role', 'pharmacy_admin')

  if (!userResponse.error) {
    for (const row of userResponse.data ?? []) {
      const pharmacyId = (row as Record<string, unknown>).pharmacy_id as string | null
      if (!pharmacyId) continue
      const status = (row as Record<string, unknown>).status as string | null
      if (status === 'active') {
        adminStatusMap.set(pharmacyId, 'active')
      } else if (!adminStatusMap.has(pharmacyId) && status === 'invited') {
        adminStatusMap.set(pharmacyId, 'invited')
      }
    }
  }

  return { patientMap, adminStatusMap }
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const actorRole = getCurrentActorRole(user)
  const actorScope = getCurrentScope(user)
  if (!['system_admin', 'regional_admin', 'pharmacy_admin'].includes(actorRole ?? '')) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const supabase = createServerSupabaseClient()
  let query = supabase
    .from('pharmacies')
    .select('id, name, area, address, phone, fax, forwarding_phone, patient_count, status, contract_date, saas_monthly_fee, night_monthly_fee, forwarding_status, region_id, created_at, updated_at, region:regions(name)')
    .eq('organization_id', user.organization_id)
    .order('created_at', { ascending: false })

  if (actorRole === 'regional_admin' && actorScope.regionId) {
    query = query.eq('region_id', actorScope.regionId)
  }
  if (actorRole === 'pharmacy_admin' && actorScope.pharmacyId) {
    query = query.eq('id', actorScope.pharmacyId)
  }

  const response = await query
  if (response.error) {
    return NextResponse.json({ ok: false, error: 'pharmacies_fetch_failed', details: response.error.message }, { status: 500 })
  }

  const rows = (response.data ?? []) as Array<Record<string, unknown>>
  const pharmacyIds = rows.map((row) => String(row.id))
  const { patientMap, adminStatusMap } = await buildPharmacyDerivedMaps(supabase, pharmacyIds)

  return NextResponse.json({
    ok: true,
    pharmacies: rows.map((row) => toPharmacyView(row, {
      patientCount: patientMap.get(String(row.id)) ?? 0,
      pharmacyAdminStatus: adminStatusMap.get(String(row.id)) ?? 'uninvited',
    })),
  })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const actorRole = getCurrentActorRole(user)
  const actorScope = getCurrentScope(user)
  if (actorRole !== 'regional_admin' || !actorScope.regionId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const reauthResponse = await ensureRecentReverification(user, {
    reason: 'pharmacy_create',
    nextPath: '/dashboard/pharmacies',
  })
  if (reauthResponse) return reauthResponse

  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const address = typeof body.address === 'string' ? body.address.trim() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const fax = typeof body.fax === 'string' ? body.fax.trim() : ''
  const forwardingPhone = typeof body.forwardingPhone === 'string' ? body.forwardingPhone.trim() : ''
  const status: PharmacyStatus = 'pending'

  if (!name || !address || !phone) {
    return NextResponse.json({ ok: false, error: 'required_fields_missing' }, { status: 400 })
  }
  const supabase = createServerSupabaseClient()
  const now = new Date().toISOString()
  const code = `pharmacy-${Date.now()}`
  const insertResponse = await supabase
    .from('pharmacies')
    .insert({
      organization_id: user.organization_id,
      region_id: actorScope.regionId,
      code,
      name,
      area: null,
      address,
      phone,
      fax: fax || null,
      forwarding_phone: forwardingPhone || null,
      patient_count: 0,
      status,
      forwarding_status: 'off',
      contract_date: null,
      night_delegation_enabled: false,
      saas_monthly_fee: 0,
      night_monthly_fee: 0,
      created_at: now,
      updated_at: now,
    } as never)
    .select('id, name, area, address, phone, fax, forwarding_phone, patient_count, status, contract_date, saas_monthly_fee, night_monthly_fee, forwarding_status, region_id, created_at, updated_at, region:regions(name)')
    .single()

  const createdPharmacy = insertResponse.data as Record<string, unknown> | null
  if (insertResponse.error || !createdPharmacy) {
    return NextResponse.json({ ok: false, error: 'pharmacy_create_failed', details: insertResponse.error?.message ?? null }, { status: 500 })
  }

  await writeAuditLog({
    user,
    action: 'pharmacy_created',
    targetType: 'pharmacy',
    targetId: String(createdPharmacy.id),
    details: {
      actor_role: actorRole,
      target_name: name,
      target_region_id: actorScope.regionId,
    },
  })

  return NextResponse.json({ ok: true, pharmacy: toPharmacyView(createdPharmacy) })
}
