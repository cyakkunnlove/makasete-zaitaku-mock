import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getCurrentActorRole, getCurrentScope } from '@/lib/active-role'
import { ensureRecentReverification } from '@/lib/api-reauth'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { canManagePatientsForUser } from '@/lib/patient-permissions'
import { writeAuditLog } from '@/lib/audit-log'

function toDoctorMasterView(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    medicalInstitutionId: typeof row.medical_institution_id === 'string' ? row.medical_institution_id : null,
    fullName: typeof row.full_name === 'string' ? row.full_name : '',
    kana: typeof row.kana === 'string' ? row.kana : '',
    department: typeof row.department === 'string' ? row.department : '',
    phone: typeof row.phone === 'string' ? row.phone : '',
    notes: typeof row.notes === 'string' ? row.notes : '',
    isActive: Boolean(row.is_active ?? true),
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
  }
}

async function getInstitutionScopeCheck(supabase: ReturnType<typeof createServerSupabaseClient>, institutionId: string) {
  const response = await supabase
    .from('medical_institutions')
    .select('id, organization_id, pharmacy_id')
    .eq('id', institutionId)
    .maybeSingle()

  return {
    data: response.data as Record<string, unknown> | null,
    error: response.error,
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  if (!canManagePatientsForUser(user)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })

  const actorRole = getCurrentActorRole(user)
  const actorScope = getCurrentScope(user)
  const supabase = createServerSupabaseClient()
  const institutionLookup = await getInstitutionScopeCheck(supabase, params.id)
  if (institutionLookup.error) {
    return NextResponse.json({ ok: false, error: 'medical_institution_lookup_failed', details: institutionLookup.error.message }, { status: 500 })
  }
  if (!institutionLookup.data || institutionLookup.data.organization_id !== user.organization_id) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  }
  if ((actorRole === 'pharmacy_admin' || actorRole === 'pharmacy_staff') && institutionLookup.data.pharmacy_id && institutionLookup.data.pharmacy_id !== actorScope.pharmacyId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const includeInactive = searchParams.get('includeInactive') === '1'

  let query = supabase
    .from('doctor_masters')
    .select('id, medical_institution_id, full_name, kana, department, phone, notes, is_active, updated_at')
    .eq('organization_id', user.organization_id)
    .eq('medical_institution_id', params.id)
    .order('full_name', { ascending: true })
    .limit(20)

  if (!includeInactive) {
    query = query.eq('is_active', true)
  }
  if (q) {
    query = query.or(`full_name.ilike.%${q}%,department.ilike.%${q}%`)
  }

  const response = await query
  if (response.error) {
    return NextResponse.json({ ok: false, error: 'doctor_masters_fetch_failed', details: response.error.message }, { status: 500 })
  }

  const rows = (response.data ?? []) as Array<Record<string, unknown>>
  return NextResponse.json({ ok: true, doctors: rows.map(toDoctorMasterView) })
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  if (!canManagePatientsForUser(user)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })

  const actorRole = getCurrentActorRole(user)
  const actorScope = getCurrentScope(user)
  if (!actorScope.pharmacyId || !['pharmacy_admin', 'pharmacy_staff'].includes(actorRole ?? '')) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const reauthResponse = await ensureRecentReverification(user, {
    reason: 'doctor_master_create',
    nextPath: '/dashboard/patients/new',
  })
  if (reauthResponse) return reauthResponse

  const supabase = createServerSupabaseClient()
  const institutionLookup = await getInstitutionScopeCheck(supabase, params.id)
  if (institutionLookup.error) {
    return NextResponse.json({ ok: false, error: 'medical_institution_lookup_failed', details: institutionLookup.error.message }, { status: 500 })
  }
  if (!institutionLookup.data || institutionLookup.data.organization_id !== user.organization_id) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  }
  if (institutionLookup.data.pharmacy_id && institutionLookup.data.pharmacy_id !== actorScope.pharmacyId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })

  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''
  const department = typeof body.department === 'string' ? body.department.trim() || null : null
  const phone = typeof body.phone === 'string' ? body.phone.trim() || null : null
  const notes = typeof body.notes === 'string' ? body.notes.trim() || null : null

  if (!fullName) {
    return NextResponse.json({ ok: false, error: 'full_name_required' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const insertResponse = await supabase
    .from('doctor_masters')
    .insert({
      organization_id: user.organization_id,
      medical_institution_id: params.id,
      full_name: fullName,
      department,
      phone,
      notes,
      is_active: true,
      created_by: user.id,
      updated_by: user.id,
      created_at: now,
      updated_at: now,
    } as never)
    .select('id, medical_institution_id, full_name, kana, department, phone, notes, is_active, updated_at')
    .single()

  const data = insertResponse.data as Record<string, unknown> | null
  if (insertResponse.error || !data) {
    return NextResponse.json({ ok: false, error: 'doctor_master_create_failed', details: insertResponse.error?.message ?? null }, { status: 500 })
  }

  await writeAuditLog({
    user,
    action: 'doctor_master_created',
    targetType: 'doctor_master',
    targetId: String(data.id),
    details: {
      actor_role: actorRole,
      target_name: fullName,
      target_medical_institution_id: params.id,
    },
  })

  return NextResponse.json({ ok: true, doctor: toDoctorMasterView(data) })
}
