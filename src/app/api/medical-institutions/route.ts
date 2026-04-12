import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getCurrentActorRole, getCurrentScope } from '@/lib/active-role'
import { ensureRecentReverification } from '@/lib/api-reauth'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { canManagePatientsForUser } from '@/lib/patient-permissions'
import { writeAuditLog } from '@/lib/audit-log'

function toMedicalInstitutionView(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: typeof row.name === 'string' ? row.name : '',
    kana: typeof row.kana === 'string' ? row.kana : '',
    phone: typeof row.phone === 'string' ? row.phone : '',
    fax: typeof row.fax === 'string' ? row.fax : '',
    postalCode: typeof row.postal_code === 'string' ? row.postal_code : '',
    address: typeof row.address === 'string' ? row.address : '',
    notes: typeof row.notes === 'string' ? row.notes : '',
    isActive: Boolean(row.is_active ?? true),
    pharmacyId: typeof row.pharmacy_id === 'string' ? row.pharmacy_id : null,
    regionId: typeof row.region_id === 'string' ? row.region_id : null,
    doctorCount: typeof row.doctor_count === 'number' ? row.doctor_count : Number(row.doctor_count ?? 0),
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
  }
}

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  if (!canManagePatientsForUser(user)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })

  const actorRole = getCurrentActorRole(user)
  const actorScope = getCurrentScope(user)
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const includeInactive = searchParams.get('includeInactive') === '1'

  const supabase = createServerSupabaseClient()
  let query = supabase
    .from('medical_institutions')
    .select('id, name, kana, phone, fax, postal_code, address, notes, is_active, pharmacy_id, region_id, updated_at')
    .eq('organization_id', user.organization_id)
    .order('name', { ascending: true })
    .limit(20)

  if (!includeInactive) {
    query = query.eq('is_active', true)
  }

  if (actorRole === 'pharmacy_admin' || actorRole === 'pharmacy_staff') {
    if (!actorScope.pharmacyId) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
    query = query.or(`pharmacy_id.eq.${actorScope.pharmacyId},pharmacy_id.is.null`)
  }

  if (q) {
    query = query.or(`name.ilike.%${q}%,address.ilike.%${q}%`)
  }

  const response = await query
  if (response.error) {
    return NextResponse.json({ ok: false, error: 'medical_institutions_fetch_failed', details: response.error.message }, { status: 500 })
  }

  const rows = (response.data ?? []) as Array<Record<string, unknown>>
  const ids = rows.map((row) => String(row.id))
  const doctorCounts = new Map<string, number>()

  if (ids.length > 0) {
    const doctorResponse = await supabase
      .from('doctor_masters')
      .select('medical_institution_id, is_active')
      .in('medical_institution_id', ids)
      .eq('is_active', true)

    if (!doctorResponse.error) {
      for (const row of doctorResponse.data ?? []) {
        const institutionId = (row as Record<string, unknown>).medical_institution_id as string | null
        if (!institutionId) continue
        doctorCounts.set(institutionId, (doctorCounts.get(institutionId) ?? 0) + 1)
      }
    }
  }

  return NextResponse.json({
    ok: true,
    medicalInstitutions: rows.map((row) => toMedicalInstitutionView({ ...row, doctor_count: doctorCounts.get(String(row.id)) ?? 0 })),
  })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  if (!canManagePatientsForUser(user)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })

  const actorRole = getCurrentActorRole(user)
  const actorScope = getCurrentScope(user)
  if (!actorScope.pharmacyId || !['pharmacy_admin', 'pharmacy_staff'].includes(actorRole ?? '')) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const reauthResponse = await ensureRecentReverification(user, {
    reason: 'medical_institution_create',
    nextPath: '/dashboard/patients/new',
  })
  if (reauthResponse) return reauthResponse

  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() || null : null
  const fax = typeof body.fax === 'string' ? body.fax.trim() || null : null
  const postalCode = typeof body.postalCode === 'string' ? body.postalCode.trim() || null : null
  const address = typeof body.address === 'string' ? body.address.trim() || null : null
  const notes = typeof body.notes === 'string' ? body.notes.trim() || null : null

  if (!name) {
    return NextResponse.json({ ok: false, error: 'name_required' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const now = new Date().toISOString()
  const insertResponse = await supabase
    .from('medical_institutions')
    .insert({
      organization_id: user.organization_id,
      region_id: actorScope.regionId,
      pharmacy_id: actorScope.pharmacyId,
      name,
      phone,
      fax,
      postal_code: postalCode,
      address,
      notes,
      is_active: true,
      created_by: user.id,
      updated_by: user.id,
      created_at: now,
      updated_at: now,
    } as never)
    .select('id, name, kana, phone, fax, postal_code, address, notes, is_active, pharmacy_id, region_id, updated_at')
    .single()

  const data = insertResponse.data as Record<string, unknown> | null
  if (insertResponse.error || !data) {
    return NextResponse.json({ ok: false, error: 'medical_institution_create_failed', details: insertResponse.error?.message ?? null }, { status: 500 })
  }

  await writeAuditLog({
    user,
    action: 'medical_institution_created',
    targetType: 'medical_institution',
    targetId: String(data.id),
    details: {
      actor_role: actorRole,
      target_name: name,
      target_pharmacy_id: actorScope.pharmacyId,
    },
  })

  return NextResponse.json({ ok: true, medicalInstitution: toMedicalInstitutionView({ ...data, doctor_count: 0 }) })
}
