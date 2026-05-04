import { NextResponse } from 'next/server'

import type { PatientDayTask } from '@/types/database'
import { getCurrentUser } from '@/lib/auth'
import { getCurrentActorRole } from '@/lib/active-role'
import { canManagePatientsForUser, getScopedPharmacyId } from '@/lib/patient-permissions'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { buildCalendarDayDetail } from '@/lib/calendar-read-model'
import { generateAutoDayTasksFromVisitRules } from '@/lib/day-flow'
import { mapDatabasePatientToPatientRecord } from '@/lib/patient-read-model'
import { listPatientVisitRulesByPatientIds } from '@/lib/repositories/patients'
import { normalizeCollectionStatusToDb } from '@/lib/status-meta'

const PATIENT_LIST_SELECT = '*'

function isDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function mapPersistedTask(task: PatientDayTask) {
  return {
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
  }
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

export async function GET(_request: Request, { params }: { params: { date: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  const scopedPharmacyId = getScopedPharmacyId(user)
  const actorRole = getCurrentActorRole(user)
  if (!canManagePatientsForUser(user) || !scopedPharmacyId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  if (!isDateKey(params.date)) {
    return NextResponse.json({ ok: false, error: 'invalid_date' }, { status: 400 })
  }

  const monthStart = `${params.date.slice(0, 7)}-01`
  const supabase = createServerSupabaseClient()

  const [taskResult, patientResult] = await Promise.all([
    supabase
      .from('patient_day_tasks')
      .select('*')
      .eq('organization_id', user.organization_id)
      .eq('pharmacy_id', scopedPharmacyId)
      .gte('flow_date', monthStart)
      .lte('flow_date', params.date)
      .order('flow_date', { ascending: true })
      .order('sort_order', { ascending: true }),
    supabase
      .from('patients')
      .select(PATIENT_LIST_SELECT)
      .eq('organization_id', user.organization_id)
      .eq('pharmacy_id', scopedPharmacyId),
  ])

  if (taskResult.error) {
    return NextResponse.json({ ok: false, error: 'calendar_day_fetch_failed', details: taskResult.error.message }, { status: 500 })
  }

  if (patientResult.error) {
    return NextResponse.json({ ok: false, error: 'calendar_patient_fetch_failed', details: patientResult.error.message }, { status: 500 })
  }

  const patients = (patientResult.data ?? []) as Array<{ id: string; full_name: string; pharmacy_id?: string | null; organization_id?: string | null; date_of_birth?: string | null; address?: string; phone?: string | null; emergency_contact_name?: string; emergency_contact_phone?: string; emergency_contact_relation?: string | null; doctor_name?: string | null; doctor_clinic?: string | null; doctor_night_phone?: string | null; medical_history?: string | null; allergies?: string | null; current_medications?: string | null; visit_notes?: string | null; insurance_info?: string | null; disease_name?: string | null; risk_score?: number; requires_multi_visit?: boolean; status?: 'active' | 'inactive' | 'incomplete' }>
  const persistedTasks = (taskResult.data ?? []) as PatientDayTask[]
  const visitRulesByPatientId = await listPatientVisitRulesByPatientIds({ patientIds: patients.map((patient) => patient.id) })
  const detailedPatients = patients.map((patient) => mapDatabasePatientToPatientRecord({
    id: patient.id,
    organization_id: patient.organization_id ?? null,
    pharmacy_id: patient.pharmacy_id ?? scopedPharmacyId,
    full_name: patient.full_name,
    date_of_birth: patient.date_of_birth ?? null,
    address: patient.address ?? '',
    phone: patient.phone ?? null,
    emergency_contact_name: patient.emergency_contact_name ?? '',
    emergency_contact_phone: patient.emergency_contact_phone ?? '',
    emergency_contact_relation: patient.emergency_contact_relation ?? null,
    doctor_name: patient.doctor_name ?? null,
    doctor_clinic: patient.doctor_clinic ?? null,
    doctor_night_phone: patient.doctor_night_phone ?? null,
    medical_history: patient.medical_history ?? null,
    allergies: patient.allergies ?? null,
    current_medications: patient.current_medications ?? null,
    visit_notes: patient.visit_notes ?? null,
    insurance_info: patient.insurance_info ?? null,
    disease_name: patient.disease_name ?? null,
    risk_score: patient.risk_score ?? 0,
    requires_multi_visit: patient.requires_multi_visit ?? false,
    status: patient.status ?? 'active',
    created_at: '',
    updated_at: '',
  }, visitRulesByPatientId.get(patient.id) ?? []))
  const generatedTasks = generateAutoDayTasksFromVisitRules(detailedPatients, params.date, persistedTasks.map(mapPersistedTask))
  const persistedIds = new Set(persistedTasks.map((task) => task.id))
  const mergedTasks = [
    ...persistedTasks.map((task) => ({ ...task, isGeneratedCandidate: false })),
    ...generatedTasks
      .filter((task) => !persistedIds.has(task.id))
      .map((task) => ({ ...mapGeneratedTaskToCalendarTask(task, persistedTasks), isGeneratedCandidate: true })),
  ]
  const patientsById = new Map(patients.map((patient) => [patient.id, patient]))
  const detail = buildCalendarDayDetail({
    tasks: mergedTasks,
    date: params.date,
    canEditPast: actorRole === 'pharmacy_admin',
    patientsById,
  })

  return NextResponse.json({ ok: true, detail })
}
