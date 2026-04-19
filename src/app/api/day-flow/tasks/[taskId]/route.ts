import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { canManagePatientsForUser, getScopedPharmacyId } from '@/lib/patient-permissions'
import { writeAuditLog } from '@/lib/audit-log'

function normalizeCollectionStatus(status: unknown) {
  switch (status) {
    case '未着手':
    case '請求準備OK':
    case 'needs_billing':
      return 'needs_billing'
    case '回収中':
    case 'billed':
      return 'billed'
    case '入金済':
    case 'paid':
      return 'paid'
    case '要確認':
    case 'needs_attention':
      return 'needs_attention'
    default:
      return 'needs_billing'
  }
}

export async function PATCH(request: Request, { params }: { params: { taskId: string } }) {
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

  const task = (body as Record<string, unknown>).task as Record<string, unknown> | undefined
  if (!task) return NextResponse.json({ ok: false, error: 'task_required' }, { status: 400 })

  const supabase = createServerSupabaseClient()
  const existingResult = await supabase
    .from('patient_day_tasks')
    .select('collection_status, note, amount, patient_id, flow_date')
    .eq('id', params.taskId)
    .maybeSingle()

  const previousCollectionStatus = existingResult.error ? null : String((existingResult.data as Record<string, unknown> | null)?.collection_status ?? '') || null
  const previousNote = existingResult.error ? null : String((existingResult.data as Record<string, unknown> | null)?.note ?? '') || null
  const previousAmount = existingResult.error ? null : Number((existingResult.data as Record<string, unknown> | null)?.amount ?? 0)

  const patientId = typeof task.patientId === 'string' ? task.patientId : null
  const flowDate = typeof task.flowDate === 'string' ? task.flowDate : null

  if (!patientId || !flowDate) {
    return NextResponse.json({ ok: false, error: 'patient_and_flow_date_required' }, { status: 400 })
  }

  const duplicateResult = await supabase
    .from('patient_day_tasks')
    .select('id, source, status, planning_status')
    .eq('pharmacy_id', scopedPharmacyId)
    .eq('patient_id', patientId)
    .eq('flow_date', flowDate)
    .neq('id', params.taskId)
    .limit(5)

  if (duplicateResult.error) {
    return NextResponse.json({ ok: false, error: 'day_flow_duplicate_check_failed', details: duplicateResult.error.message }, { status: 500 })
  }

  if ((duplicateResult.data ?? []).length > 0) {
    return NextResponse.json({ ok: false, error: 'duplicate_patient_day_task', details: '同じ患者は同じ日に1件だけ登録できます' }, { status: 409 })
  }

  const payload = {
    id: params.taskId,
    organization_id: user.organization_id,
    pharmacy_id: scopedPharmacyId,
    patient_id: patientId,
    flow_date: flowDate,
    sort_order: typeof task.sortOrder === 'number' ? task.sortOrder : 1,
    scheduled_time: typeof task.scheduledTime === 'string' ? task.scheduledTime : '10:00',
    visit_type: typeof task.visitType === 'string' ? task.visitType : '定期',
    source: typeof task.source === 'string' ? task.source : '自動生成',
    status: typeof task.status === 'string' ? task.status : 'scheduled',
    planning_status: typeof task.planningStatus === 'string' ? task.planningStatus : 'unplanned',
    planned_by: typeof task.plannedBy === 'string' ? task.plannedBy : null,
    planned_by_id: typeof task.plannedById === 'string' ? task.plannedById : null,
    planned_at: typeof task.plannedAt === 'string' ? task.plannedAt : null,
    handled_by: typeof task.handledBy === 'string' ? task.handledBy : null,
    handled_by_id: typeof task.handledById === 'string' ? task.handledById : null,
    handled_at: typeof task.handledAt === 'string' ? task.handledAt : null,
    completed_at: typeof task.completedAt === 'string' ? task.completedAt : null,
    billable: Boolean(task.billable),
    collection_status: normalizeCollectionStatus(task.collectionStatus),
    amount: typeof task.amount === 'number' ? task.amount : 0,
    note: typeof task.note === 'string' ? task.note : '',
    updated_by_id: user.id,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('patient_day_tasks')
    .upsert(payload as never, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ ok: false, error: 'day_flow_upsert_failed', details: error.message }, { status: 500 })
  }

  await writeAuditLog({
    user,
    action: previousCollectionStatus !== payload.collection_status ? 'billing_collection_status_changed' : 'patient_day_task_updated',
    targetType: 'patient_day_task',
    targetId: params.taskId,
    details: {
      patient_id: payload.patient_id,
      flow_date: payload.flow_date,
      status: payload.status,
      planning_status: payload.planning_status,
      collection_status: payload.collection_status,
      previous_collection_status: previousCollectionStatus,
      amount: payload.amount,
      previous_amount: previousAmount,
      note: payload.note,
      previous_note: previousNote,
    },
  })

  return NextResponse.json({ ok: true, task: data })
}
