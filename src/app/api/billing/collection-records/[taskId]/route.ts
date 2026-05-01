import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { writeAuditLog } from '@/lib/audit-log'
import { canManagePatientsForUser, getScopedPharmacyId } from '@/lib/patient-permissions'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { normalizeCollectionStatusToDb } from '@/lib/status-meta'

type CollectionStatusPayload = {
  collectionStatus?: unknown
  status?: unknown
  note?: unknown
  handledBy?: unknown
  handledById?: unknown
  handledAt?: unknown
}

export async function PATCH(request: Request, { params }: { params: { taskId: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const scopedPharmacyId = getScopedPharmacyId(user)
  if (!canManagePatientsForUser(user) || !scopedPharmacyId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null) as CollectionStatusPayload | null
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })
  }

  const rawStatus = typeof body.collectionStatus === 'string'
    ? body.collectionStatus
    : typeof body.status === 'string'
      ? body.status
      : null
  if (!rawStatus) {
    return NextResponse.json({ ok: false, error: 'collection_status_required' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const existingResult = await supabase
    .from('patient_day_tasks')
    .select('id, organization_id, pharmacy_id, patient_id, flow_date, status, billable, collection_status, note, amount, handled_by_id, handled_at')
    .eq('organization_id', user.organization_id)
    .eq('id', params.taskId)
    .maybeSingle()

  if (existingResult.error) {
    return NextResponse.json({ ok: false, error: 'billing_collection_lookup_failed', details: existingResult.error.message }, { status: 500 })
  }

  const existingTask = existingResult.data as Record<string, unknown> | null
  if (!existingTask) {
    return NextResponse.json({ ok: false, error: 'billing_collection_not_found' }, { status: 404 })
  }
  if (existingTask.pharmacy_id !== scopedPharmacyId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }
  if (existingTask.status !== 'completed' || existingTask.billable !== true) {
    return NextResponse.json({ ok: false, error: 'billing_collection_not_eligible' }, { status: 409 })
  }

  const previousCollectionStatus = String(existingTask.collection_status ?? '') || null
  const previousNote = String(existingTask.note ?? '') || null
  const previousAmount = Number(existingTask.amount ?? 0)
  const previousHandledById = String(existingTask.handled_by_id ?? '') || null
  const previousHandledAt = String(existingTask.handled_at ?? '') || null

  const handledAt = typeof body.handledAt === 'string' && body.handledAt.trim().length > 0
    ? body.handledAt
    : new Date().toISOString()
  const handledBy = typeof body.handledBy === 'string' && body.handledBy.trim().length > 0
    ? body.handledBy.trim()
    : user.full_name
  const handledById = typeof body.handledById === 'string' && body.handledById.trim().length > 0
    ? body.handledById
    : user.id
  const note = typeof body.note === 'string' ? body.note : previousNote ?? ''
  const collectionStatus = normalizeCollectionStatusToDb(rawStatus)

  const { data, error } = await supabase
    .from('patient_day_tasks')
    .update({
      collection_status: collectionStatus,
      note,
      handled_by: handledBy,
      handled_by_id: handledById,
      handled_at: handledAt,
      updated_by_id: user.id,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('organization_id', user.organization_id)
    .eq('pharmacy_id', scopedPharmacyId)
    .eq('id', params.taskId)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ ok: false, error: 'billing_collection_update_failed', details: error.message }, { status: 500 })
  }

  await writeAuditLog({
    user,
    action: previousCollectionStatus !== collectionStatus ? 'billing_collection_status_changed' : 'billing_collection_record_updated',
    targetType: 'patient_day_task',
    targetId: params.taskId,
    details: {
      patient_id: existingTask.patient_id,
      flow_date: existingTask.flow_date,
      previous_collection_status: previousCollectionStatus,
      current_collection_status: collectionStatus,
      previous_amount: previousAmount,
      current_amount: previousAmount,
      previous_note: previousNote,
      current_note: note,
      previous_handled_by_id: previousHandledById,
      current_handled_by_id: handledById,
      previous_handled_at: previousHandledAt,
      current_handled_at: handledAt,
      amount_changed: false,
      note_changed: note !== previousNote,
    },
  })

  return NextResponse.json({ ok: true, task: data })
}
