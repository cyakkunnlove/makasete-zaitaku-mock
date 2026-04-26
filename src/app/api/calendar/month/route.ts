import { NextResponse } from 'next/server'

import type { PatientDayTask } from '@/types/database'
import { getCurrentUser } from '@/lib/auth'
import { canManagePatientsForUser, getScopedPharmacyId } from '@/lib/patient-permissions'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { buildCalendarMonthSummary } from '@/lib/calendar-read-model'
import { generateAutoDayTasksFromVisitRules } from '@/lib/day-flow'
import { mapDatabasePatientToPatientRecord } from '@/lib/patient-read-model'
import { listPatientsByPharmacy, listPatientVisitRules } from '@/lib/repositories/patients'
import { normalizeCollectionStatusToDb } from '@/lib/status-meta'

function parseYearMonth(searchParams: URLSearchParams) {
  const year = Number(searchParams.get('year'))
  const month = Number(searchParams.get('month'))

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null
  }

  return { year, month }
}

function mapGeneratedTaskToCalendarTask(task: ReturnType<typeof generateAutoDayTasksFromVisitRules>[number], existing: PatientDayTask[]): PatientDayTask {
  const now = new Date().toISOString()
  const firstExisting = existing[0]
  return {
    id: task.id,
    organization_id: firstExisting?.organization_id ?? null,
    pharmacy_id: task.pharmacyId,
    patient_id: task.patientId,
    flow_date: task.flowDate,
    sort_order: task.sortOrder,
    scheduled_time: task.scheduledTime,
    visit_type: task.visitType,
    source: task.source,
    status: task.status,
    planning_status: task.planningStatus,
    planned_by: task.plannedBy,
    planned_by_id: task.plannedById,
    planned_at: task.plannedAt,
    handled_by: task.handledBy,
    handled_by_id: task.handledById,
    handled_at: task.handledAt,
    completed_at: task.completedAt,
    billable: task.billable,
    collection_status: normalizeCollectionStatusToDb(task.collectionStatus),
    amount: task.amount,
    note: task.note,
    updated_by_id: task.updatedById,
    updated_at: task.updatedAt ?? now,
    created_at: task.updatedAt ?? now,
  }
}

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  const scopedPharmacyId = getScopedPharmacyId(user)
  if (!canManagePatientsForUser(user) || !scopedPharmacyId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const requestUrl = new URL(request.url)
  const parsed = parseYearMonth(requestUrl.searchParams)
  if (!parsed) {
    return NextResponse.json({ ok: false, error: 'invalid_year_month' }, { status: 400 })
  }

  const monthKey = `${parsed.year}-${String(parsed.month).padStart(2, '0')}`
  const monthStart = `${monthKey}-01`
  const monthEnd = new Date(parsed.year, parsed.month, 0)
  const monthEndKey = `${parsed.year}-${String(parsed.month).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}`

  const supabase = createServerSupabaseClient()
  const [{ data, error }, patients] = await Promise.all([
    supabase
      .from('patient_day_tasks')
      .select('*')
      .eq('pharmacy_id', scopedPharmacyId)
      .gte('flow_date', monthStart)
      .lte('flow_date', monthEndKey)
      .order('flow_date', { ascending: true })
      .order('sort_order', { ascending: true }),
    listPatientsByPharmacy(scopedPharmacyId),
  ])

  if (error) {
    return NextResponse.json({ ok: false, error: 'calendar_month_fetch_failed', details: error.message }, { status: 500 })
  }

  const persistedTasks = (data ?? []) as PatientDayTask[]
  const patientRecords = await Promise.all(
    patients.map(async (patient) => mapDatabasePatientToPatientRecord(patient, await listPatientVisitRules(patient.id))),
  )

  const generatedTasks = Array.from({ length: monthEnd.getDate() }, (_, index) => {
    const dateKey = `${monthKey}-${String(index + 1).padStart(2, '0')}`
    return generateAutoDayTasksFromVisitRules(patientRecords, dateKey, persistedTasks.map((task) => ({
      id: task.id,
      patientId: task.patient_id ?? '',
      pharmacyId: task.pharmacy_id ?? '',
      flowDate: task.flow_date,
      sortOrder: task.sort_order,
      scheduledTime: task.scheduled_time,
      visitType: task.visit_type,
      source: task.source,
      status: task.status,
      planningStatus: task.planning_status,
      plannedBy: task.planned_by,
      plannedById: task.planned_by_id,
      plannedAt: task.planned_at,
      handledBy: task.handled_by,
      handledById: task.handled_by_id,
      handledAt: task.handled_at,
      completedAt: task.completed_at,
      billable: task.billable,
      collectionStatus: task.collection_status,
      amount: task.amount,
      note: task.note,
      updatedAt: task.updated_at,
      updatedById: task.updated_by_id,
    })))
  }).flat()

  const persistedIds = new Set(persistedTasks.map((task) => task.id))
  const mergedTasks = [
    ...persistedTasks,
    ...generatedTasks.filter((task) => !persistedIds.has(task.id)).map((task) => mapGeneratedTaskToCalendarTask(task, persistedTasks)),
  ]

  const summaries = buildCalendarMonthSummary({
    tasks: mergedTasks,
    patients,
    year: parsed.year,
    month: parsed.month,
  })

  return NextResponse.json({
    ok: true,
    year: parsed.year,
    month: parsed.month,
    summaries,
  })
}
