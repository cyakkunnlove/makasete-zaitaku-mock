import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getCurrentActorRole } from '@/lib/active-role'
import { writeAuditLog } from '@/lib/audit-log'
import { canManagePatientsForUser, getScopedPharmacyId } from '@/lib/patient-permissions'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const actorRole = getCurrentActorRole(user)
  const scopedPharmacyId = getScopedPharmacyId(user)

  if (!actorRole || !['system_admin', 'regional_admin', 'pharmacy_admin', 'pharmacy_staff'].includes(actorRole)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const supabase = createServerSupabaseClient()
  let query = supabase
    .from('correction_requests')
    .select('*')
    .eq('organization_id', user.organization_id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (actorRole === 'pharmacy_admin' || actorRole === 'pharmacy_staff') {
    if (!scopedPharmacyId) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
    query = query.eq('pharmacy_id', scopedPharmacyId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ ok: false, error: 'correction_requests_fetch_failed', details: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, correctionRequests: data ?? [] })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const scopedPharmacyId = getScopedPharmacyId(user)
  if (!canManagePatientsForUser(user) || !scopedPharmacyId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })
  }

  const input = body as Record<string, unknown>
  const targetType = typeof input.targetType === 'string' ? input.targetType : ''
  const targetId = typeof input.targetId === 'string' ? input.targetId : ''
  const patientId = typeof input.patientId === 'string' ? input.patientId : null
  const patientDayTaskId = typeof input.patientDayTaskId === 'string' ? input.patientDayTaskId : null
  const reasonCategory = typeof input.reasonCategory === 'string' ? input.reasonCategory.trim() || null : null
  const reasonText = typeof input.reasonText === 'string' ? input.reasonText.trim() || null : null
  const requestedChanges = input.requestedChanges && typeof input.requestedChanges === 'object'
    ? input.requestedChanges
    : {}

  if (!targetType || !targetId) {
    return NextResponse.json({ ok: false, error: 'target_required' }, { status: 400 })
  }

  const allowedTargetTypes = new Set(['patient', 'patient_day_task', 'billing_collection', 'medical_institution', 'doctor_master'])
  if (!allowedTargetTypes.has(targetType)) {
    return NextResponse.json({ ok: false, error: 'invalid_target_type' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('correction_requests')
    .insert({
      organization_id: user.organization_id,
      pharmacy_id: scopedPharmacyId,
      patient_id: patientId,
      patient_day_task_id: patientDayTaskId,
      target_type: targetType,
      target_id: targetId,
      requested_by: user.id,
      requested_by_role: getCurrentActorRole(user),
      reason_category: reasonCategory,
      reason_text: reasonText,
      requested_changes: requestedChanges,
      status: 'pending',
    } as never)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ ok: false, error: 'correction_request_create_failed', details: error.message }, { status: 500 })
  }

  await writeAuditLog({
    user,
    action: 'correction_request_created',
    targetType,
    targetId,
    details: {
      patient_id: patientId,
      patient_day_task_id: patientDayTaskId,
      reason_category: reasonCategory,
      reason_text: reasonText,
      requested_changes: requestedChanges,
    },
  })

  return NextResponse.json({ ok: true, correctionRequest: data })
}
