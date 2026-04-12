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
    fullName: typeof row.full_name === 'string' ? row.full_name : '',
    department: typeof row.department === 'string' ? row.department : '',
    phone: typeof row.phone === 'string' ? row.phone : '',
    isActive: Boolean(row.is_active ?? true),
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  if (!canManagePatientsForUser(user)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })

  const actorRole = getCurrentActorRole(user)
  const actorScope = getCurrentScope(user)
  if (!actorScope.pharmacyId || !['pharmacy_admin', 'pharmacy_staff'].includes(actorRole ?? '')) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const reauthResponse = await ensureRecentReverification(user, {
    reason: 'doctor_master_update',
    nextPath: '/dashboard/patients/new',
  })
  if (reauthResponse) return reauthResponse

  const supabase = createServerSupabaseClient()
  const existingResponse = await supabase
    .from('doctor_masters')
    .select('id, organization_id, medical_institution:medical_institutions(pharmacy_id)')
    .eq('id', params.id)
    .maybeSingle()

  const existing = existingResponse.data as Record<string, unknown> | null
  const institution = existing?.medical_institution as { pharmacy_id?: string | null } | null | undefined
  if (existingResponse.error) {
    return NextResponse.json({ ok: false, error: 'doctor_master_lookup_failed', details: existingResponse.error.message }, { status: 500 })
  }
  if (!existing || existing.organization_id !== user.organization_id) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  }
  if (institution?.pharmacy_id && institution.pharmacy_id !== actorScope.pharmacyId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })

  const payload: Record<string, unknown> = { updated_by: user.id, updated_at: new Date().toISOString() }
  if (typeof body.fullName === 'string') payload.full_name = body.fullName.trim() || null
  if (typeof body.department === 'string' || body.department === null) payload.department = typeof body.department === 'string' ? body.department.trim() || null : null
  if (typeof body.phone === 'string' || body.phone === null) payload.phone = typeof body.phone === 'string' ? body.phone.trim() || null : null
  if (typeof body.isActive === 'boolean') payload.is_active = body.isActive

  const updateResponse = await supabase
    .from('doctor_masters')
    .update(payload as never)
    .eq('id', params.id)
    .select('id, full_name, department, phone, is_active, updated_at')
    .single()

  const data = updateResponse.data as Record<string, unknown> | null
  if (updateResponse.error || !data) {
    return NextResponse.json({ ok: false, error: 'doctor_master_update_failed', details: updateResponse.error?.message ?? null }, { status: 500 })
  }

  await writeAuditLog({
    user,
    action: 'doctor_master_updated',
    targetType: 'doctor_master',
    targetId: params.id,
    details: {
      actor_role: actorRole,
      changes: Object.keys(payload).filter((key) => !['updated_by', 'updated_at'].includes(key)),
    },
  })

  return NextResponse.json({ ok: true, doctor: toDoctorMasterView(data) })
}
