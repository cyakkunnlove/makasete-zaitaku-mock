import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getCurrentActorRole } from '@/lib/active-role'
import { canManagePatientsForUser, getScopedPharmacyId } from '@/lib/patient-permissions'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { mapCollectionDbStatusToApp, normalizeCollectionStatusToDb, type CollectionWorkflowDbStatus } from '@/lib/status-meta'
import {
  DEFAULT_BILLING_PAID_CANCEL_WINDOW_MINUTES,
  getBillingPaidCorrectionAction,
} from '@/lib/correction-policy'
import { findBillingCollectionActionForStatusChange, type BillingPaidActionPolicy } from '@/lib/billing-collection-actions'
import { writeAuditLog } from '@/lib/audit-log'

type CollectionStatusPayload = {
  collectionStatus?: unknown
  status?: unknown
  note?: unknown
  handledBy?: unknown
  handledById?: unknown
  handledAt?: unknown
  correctionRequestId?: unknown
  expectedUpdatedAt?: unknown
}

function isSameTimestamp(left: unknown, right: unknown) {
  if (typeof left !== 'string' || typeof right !== 'string') return false
  const leftTime = new Date(left).getTime()
  const rightTime = new Date(right).getTime()
  return Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime === rightTime
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
    .select('id, organization_id, pharmacy_id, patient_id, flow_date, status, billable, collection_status, note, amount, handled_by_id, handled_at, updated_at')
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

  const expectedUpdatedAt = typeof body.expectedUpdatedAt === 'string' ? body.expectedUpdatedAt : null
  const previousUpdatedAt = String(existingTask.updated_at ?? '') || null
  if (expectedUpdatedAt && previousUpdatedAt && !isSameTimestamp(expectedUpdatedAt, previousUpdatedAt)) {
    return NextResponse.json({
      ok: false,
      error: 'billing_collection_update_conflict',
      details: '他スタッフの更新が先に反映されています。最新の回収状況を読み込み直してください',
      currentUpdatedAt: previousUpdatedAt,
    }, { status: 409 })
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
  const collectionStatus = normalizeCollectionStatusToDb(rawStatus) as CollectionWorkflowDbStatus
  const actorRole = getCurrentActorRole(user)
  const correctionRequestId = typeof body.correctionRequestId === 'string' ? body.correctionRequestId.trim() : ''
  let hasValidCorrectionRequest = false

  if (correctionRequestId) {
    if (actorRole !== 'pharmacy_admin') {
      return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
    }

    const correctionRequestResponse = await supabase
      .from('correction_requests')
      .select('id, pharmacy_id, target_type, target_id, patient_day_task_id, status')
      .eq('organization_id', user.organization_id)
      .eq('pharmacy_id', scopedPharmacyId)
      .eq('id', correctionRequestId)
      .maybeSingle()

    if (correctionRequestResponse.error) {
      return NextResponse.json({ ok: false, error: 'correction_request_lookup_failed', details: correctionRequestResponse.error.message }, { status: 500 })
    }

    const correctionRequest = correctionRequestResponse.data as {
      target_type?: string | null
      target_id?: string | null
      patient_day_task_id?: string | null
      status?: string | null
    } | null
    const requestMatchesTask = correctionRequest?.target_id === params.taskId || correctionRequest?.patient_day_task_id === params.taskId
    const requestIsOpen = correctionRequest?.status === 'pending' || correctionRequest?.status === 'approved'
    const requestTargetsBilling = correctionRequest?.target_type === 'billing_collection' || correctionRequest?.target_type === 'patient_day_task'

    if (!correctionRequest || !requestMatchesTask || !requestTargetsBilling || !requestIsOpen) {
      return NextResponse.json({ ok: false, error: 'invalid_correction_request' }, { status: 400 })
    }

    hasValidCorrectionRequest = true
  }

  let paidActionPolicy: BillingPaidActionPolicy = 'none'
  let billingPaidCancelWindowMinutes = DEFAULT_BILLING_PAID_CANCEL_WINDOW_MINUTES

  if (previousCollectionStatus === 'paid') {
    const settingsResponse = await supabase
      .from('pharmacy_operation_settings')
      .select('billing_paid_cancel_window_minutes')
      .eq('pharmacy_id', scopedPharmacyId)
      .maybeSingle()

    if (settingsResponse.error) {
      return NextResponse.json({ ok: false, error: 'operation_settings_fetch_failed', details: settingsResponse.error.message }, { status: 500 })
    }

    const settings = settingsResponse.data as { billing_paid_cancel_window_minutes?: number | null } | null
    billingPaidCancelWindowMinutes = settings?.billing_paid_cancel_window_minutes ?? DEFAULT_BILLING_PAID_CANCEL_WINDOW_MINUTES
    paidActionPolicy = getBillingPaidCorrectionAction({
      status: 'paid',
      handledAt: previousHandledAt,
      windowMinutes: billingPaidCancelWindowMinutes,
      isPharmacyAdmin: actorRole === 'pharmacy_admin',
      isPharmacyStaff: actorRole === 'pharmacy_staff',
      hasCorrectionRequest: hasValidCorrectionRequest,
    })
  }

  const currentAppStatus = mapCollectionDbStatusToApp(previousCollectionStatus)
  const nextAppStatus = mapCollectionDbStatusToApp(collectionStatus)
  const transitionAction = findBillingCollectionActionForStatusChange({
    currentStatus: currentAppStatus,
    nextStatus: nextAppStatus,
    billable: true,
    paidAction: paidActionPolicy,
  })

  if (!transitionAction && currentAppStatus !== nextAppStatus) {
    if (previousCollectionStatus === 'paid' && paidActionPolicy === 'request') {
      return NextResponse.json({
        ok: false,
        error: 'correction_request_required',
        reason: 'billing_paid_locked',
        billingPaidCancelWindowMinutes,
      }, { status: 423 })
    }

    if (previousCollectionStatus === 'paid' && paidActionPolicy === 'none') {
      return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      ok: false,
      error: 'invalid_collection_status_transition',
      currentStatus: currentAppStatus,
      nextStatus: nextAppStatus,
    }, { status: 409 })
  }

  const auditAction = previousCollectionStatus !== collectionStatus ? 'billing_collection_status_changed' : 'billing_collection_record_updated'
  const auditDetails = {
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
    correction_request_id: correctionRequestId || null,
  }

  let updateQuery = supabase
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

  if (expectedUpdatedAt && previousUpdatedAt) {
    updateQuery = updateQuery.eq('updated_at', previousUpdatedAt)
  }

  const updateResponse = await updateQuery.select('*').maybeSingle()

  if (updateResponse.error) {
    return NextResponse.json({ ok: false, error: 'billing_collection_update_failed', details: updateResponse.error.message }, { status: 500 })
  }

  if (!updateResponse.data) {
    return NextResponse.json({
      ok: false,
      error: 'billing_collection_update_conflict',
      details: '他スタッフの更新が先に反映されています。最新の回収状況を読み込み直してください',
    }, { status: 409 })
  }

  await writeAuditLog({
    user,
    action: auditAction,
    targetType: 'patient_day_task',
    targetId: params.taskId,
    details: auditDetails,
  })

  return NextResponse.json({ ok: true, task: updateResponse.data })
}
