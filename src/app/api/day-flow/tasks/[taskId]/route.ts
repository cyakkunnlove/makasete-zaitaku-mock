import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { canManagePatients } from '@/lib/patient-permissions'
import { writeAuditLog } from '@/lib/audit-log'

export async function PATCH(request: Request, { params }: { params: { taskId: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  if (!canManagePatients(user.role) || !user.pharmacy_id) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })
  }

  const task = (body as Record<string, unknown>).task as Record<string, unknown> | undefined
  if (!task) return NextResponse.json({ ok: false, error: 'task_required' }, { status: 400 })

  const supabase = createServerSupabaseClient()
  const payload = {
    id: params.taskId,
    organization_id: user.organization_id,
    pharmacy_id: user.pharmacy_id,
    patient_id: typeof task.patientId === 'string' ? task.patientId : null,
    flow_date: typeof task.flowDate === 'string' ? task.flowDate : null,
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
    collection_status: typeof task.collectionStatus === 'string' ? task.collectionStatus : '未着手',
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
    action: 'patient_day_task_updated',
    targetType: 'patient_day_task',
    targetId: params.taskId,
    details: {
      patient_id: payload.patient_id,
      flow_date: payload.flow_date,
      status: payload.status,
      planning_status: payload.planning_status,
    },
  })

  return NextResponse.json({ ok: true, task: data })
}
