import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { writeAuditLog } from '@/lib/audit-log'
import { canManagePatientsForUser, getScopedPharmacyId } from '@/lib/patient-permissions'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { normalizeCollectionStatusToDb } from '@/lib/status-meta'

export async function PATCH(request: Request) {
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

  const tasks = (body as Record<string, unknown>).tasks
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return NextResponse.json({ ok: false, error: 'tasks_required' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const normalizedTasks = tasks.map((task, index) => {
    const current = task as Record<string, unknown>
    const patientId = typeof current.patientId === 'string' ? current.patientId : null
    const flowDate = typeof current.flowDate === 'string' ? current.flowDate : null

    if (!patientId || !flowDate) {
      throw new Error(`task_invalid_at_${index}`)
    }

    return {
      id: typeof current.id === 'string' ? current.id : null,
      organization_id: user.organization_id,
      pharmacy_id: scopedPharmacyId,
      patient_id: patientId,
      flow_date: flowDate,
      sort_order: typeof current.sortOrder === 'number' ? current.sortOrder : index + 1,
      scheduled_time: typeof current.scheduledTime === 'string' ? current.scheduledTime : '10:00',
      visit_type: typeof current.visitType === 'string' ? current.visitType : '定期',
      source: typeof current.source === 'string' ? current.source : '自動生成',
      status: typeof current.status === 'string' ? current.status : 'scheduled',
      planning_status: typeof current.planningStatus === 'string' ? current.planningStatus : 'unplanned',
      planned_by: typeof current.plannedBy === 'string' ? current.plannedBy : null,
      planned_by_id: typeof current.plannedById === 'string' ? current.plannedById : null,
      planned_at: typeof current.plannedAt === 'string' ? current.plannedAt : null,
      handled_by: typeof current.handledBy === 'string' ? current.handledBy : null,
      handled_by_id: typeof current.handledById === 'string' ? current.handledById : null,
      handled_at: typeof current.handledAt === 'string' ? current.handledAt : null,
      completed_at: typeof current.completedAt === 'string' ? current.completedAt : null,
      billable: Boolean(current.billable),
      collection_status: normalizeCollectionStatusToDb(current.collectionStatus as string | null | undefined),
      amount: typeof current.amount === 'number' ? current.amount : 0,
      note: typeof current.note === 'string' ? current.note : '',
      updated_by_id: user.id,
      updated_at: new Date().toISOString(),
    }
  })

  if (normalizedTasks.some((task) => !task.id)) {
    return NextResponse.json({ ok: false, error: 'task_id_required' }, { status: 400 })
  }

  const duplicateKeySet = new Set<string>()
  for (const task of normalizedTasks) {
    const key = `${task.pharmacy_id}:${task.patient_id}:${task.flow_date}`
    if (duplicateKeySet.has(key)) {
      return NextResponse.json({ ok: false, error: 'duplicate_patient_day_task', details: '同じ患者は同じ日に1件だけ登録できます' }, { status: 409 })
    }
    duplicateKeySet.add(key)
  }

  const flowDates = Array.from(new Set(normalizedTasks.map((task) => task.flow_date)))
  const patientIds = Array.from(new Set(normalizedTasks.map((task) => task.patient_id)))
  const taskIds = normalizedTasks.map((task) => task.id as string)

  const existingDuplicateResult = await supabase
    .from('patient_day_tasks')
    .select('id, pharmacy_id, patient_id, flow_date')
    .eq('pharmacy_id', scopedPharmacyId)
    .in('flow_date', flowDates)
    .in('patient_id', patientIds)

  if (existingDuplicateResult.error) {
    return NextResponse.json({ ok: false, error: 'day_flow_duplicate_check_failed', details: existingDuplicateResult.error.message }, { status: 500 })
  }

  const conflictingRow = (existingDuplicateResult.data ?? []).find((row) => {
    const current = row as Record<string, unknown>
    const rowId = String(current.id)
    if (taskIds.includes(rowId)) return false
    const key = `${String(current.pharmacy_id)}:${String(current.patient_id)}:${String(current.flow_date)}`
    return duplicateKeySet.has(key)
  })

  if (conflictingRow) {
    return NextResponse.json({ ok: false, error: 'duplicate_patient_day_task', details: '同じ患者は同じ日に1件だけ登録できます' }, { status: 409 })
  }

  const previousRowsResult = await supabase
    .from('patient_day_tasks')
    .select('id, patient_id, flow_date, sort_order, collection_status, note, amount')
    .in('id', taskIds)

  if (previousRowsResult.error) {
    return NextResponse.json({ ok: false, error: 'day_flow_previous_fetch_failed', details: previousRowsResult.error.message }, { status: 500 })
  }

  const sortWindowResult = await supabase
    .from('patient_day_tasks')
    .select('id, flow_date, sort_order')
    .eq('pharmacy_id', scopedPharmacyId)
    .in('flow_date', flowDates)

  if (sortWindowResult.error) {
    return NextResponse.json({ ok: false, error: 'day_flow_sort_window_failed', details: sortWindowResult.error.message }, { status: 500 })
  }

  const maxSortOrderByDate = new Map<string, number>()
  for (const row of (sortWindowResult.data ?? []) as Array<Record<string, unknown>>) {
    const flowDate = String(row.flow_date)
    const sortOrder = Number(row.sort_order ?? 0)
    maxSortOrderByDate.set(flowDate, Math.max(maxSortOrderByDate.get(flowDate) ?? 0, sortOrder))
  }

  const tempTasks = normalizedTasks.map((task, index) => ({
    ...task,
    sort_order: (maxSortOrderByDate.get(task.flow_date) ?? 0) + index + 1,
  }))

  const { error: tempError } = await supabase
    .from('patient_day_tasks')
    .upsert(tempTasks as never, { onConflict: 'id' })

  if (tempError) {
    return NextResponse.json({ ok: false, error: 'day_flow_bulk_temp_shift_failed', details: tempError.message }, { status: 500 })
  }

  const { data, error } = await supabase
    .from('patient_day_tasks')
    .upsert(normalizedTasks as never, { onConflict: 'id' })
    .select('*')

  if (error) {
    return NextResponse.json({ ok: false, error: 'day_flow_bulk_upsert_failed', details: error.message }, { status: 500 })
  }

  const previousRows = new Map(
    ((previousRowsResult.data ?? []) as Array<Record<string, unknown>>).map((row) => [String(row.id), row]),
  )

  await writeAuditLog({
    user,
    action: 'patient_day_tasks_bulk_updated',
    targetType: 'patient_day_task',
    targetId: null,
    details: {
      flow_dates: flowDates,
      task_count: normalizedTasks.length,
      tasks: normalizedTasks.map((task) => {
        const previous = previousRows.get(String(task.id))
        return {
          id: task.id,
          patient_id: task.patient_id,
          flow_date: task.flow_date,
          sort_order: task.sort_order,
          previous_sort_order: previous ? Number(previous.sort_order ?? 0) : null,
          collection_status: task.collection_status,
          previous_collection_status: previous ? String(previous.collection_status ?? '') || null : null,
          amount: task.amount,
          previous_amount: previous ? Number(previous.amount ?? 0) : null,
          note: task.note,
          previous_note: previous ? String(previous.note ?? '') : null,
        }
      }),
    },
  })

  return NextResponse.json({ ok: true, tasks: data ?? [] })
}
