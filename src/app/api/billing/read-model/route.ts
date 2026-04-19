import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { buildAdminBillingRecords, buildDateCollectionSummaries, buildDayTaskCollectionRecords, buildPatientVisitHistory, type BillingCollectionRecord } from '@/lib/billing-read-model'
import { billingData } from '@/lib/mock-data'
import type { RegisteredPatientRecord } from '@/lib/patient-master'
import { mapDatabasePatientToPatientRecord } from '@/lib/patient-read-model'
import { canManagePatientsForUser, getScopedPharmacyId } from '@/lib/patient-permissions'
import { listPatientsByPharmacy, listPatientVisitRules } from '@/lib/repositories/patients'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

const BILLING_FLOW_DATE = '2026-03-28'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const collectionRecords = body && typeof body === 'object' && Array.isArray((body as Record<string, unknown>).collectionRecords)
    ? (body as Record<string, unknown>).collectionRecords as BillingCollectionRecord[]
    : []
  const flowDate = body && typeof body === 'object' && typeof (body as Record<string, unknown>).flowDate === 'string'
    ? String((body as Record<string, unknown>).flowDate)
    : BILLING_FLOW_DATE
  const patientSearch = body && typeof body === 'object' && typeof (body as Record<string, unknown>).patientSearch === 'string'
    ? String((body as Record<string, unknown>).patientSearch)
    : ''
  const statusFilter = body && typeof body === 'object' && typeof (body as Record<string, unknown>).statusFilter === 'string'
    ? ((body as Record<string, unknown>).statusFilter as 'all' | 'needs_billing' | 'billed' | 'paid' | 'needs_attention')
    : 'all'

  const scopedPharmacyId = getScopedPharmacyId(user)
  if (!scopedPharmacyId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const supabase = createServerSupabaseClient()
  const [tasksResult, pharmacyResult] = await Promise.all([
    supabase
      .from('patient_day_tasks')
      .select('*')
      .eq('pharmacy_id', scopedPharmacyId)
      .eq('flow_date', flowDate)
      .order('sort_order', { ascending: true }),
    supabase.from('pharmacies').select('name').eq('id', scopedPharmacyId).maybeSingle(),
  ])

  if (tasksResult.error) {
    return NextResponse.json({ ok: false, error: 'billing_read_model_tasks_failed', details: tasksResult.error.message }, { status: 500 })
  }

  const pharmacyName = String((pharmacyResult.data as Record<string, unknown> | null)?.name ?? '') || 'マカセテ在宅テスト薬局'

  let ownPatients: RegisteredPatientRecord[] = []
  if (canManagePatientsForUser(user)) {
    const patients = await listPatientsByPharmacy(scopedPharmacyId)
    ownPatients = await Promise.all(
      patients.map(async (patient) => {
        const visitRules = await listPatientVisitRules(patient.id)
        return mapDatabasePatientToPatientRecord(patient, visitRules, { pharmacyName })
      }),
    )
  }

  const ownPatientNames = new Set(ownPatients.map((patient) => patient.name))
  const patientMap = new Map(ownPatients.map((patient) => [patient.id, patient]))
  const patientBillingSettings = new Map(
    ownPatients.map((patient) => [
      patient.id,
      {
        isBillable: patient.isBillable ?? true,
        reason: patient.billingExclusionReason ?? null,
      },
    ]),
  )

  const dayTaskCollectionRecords = buildDayTaskCollectionRecords({
    sharedDayTasks: ((tasksResult.data ?? []) as Array<Record<string, unknown>>).map((task) => ({
      id: String(task.id),
      patientId: String(task.patient_id ?? ''),
      pharmacyId: String(task.pharmacy_id ?? ''),
      flowDate: String(task.flow_date ?? flowDate),
      sortOrder: Number(task.sort_order ?? 1),
      scheduledTime: String(task.scheduled_time ?? '10:00'),
      visitType: (task.visit_type as '定期' | '臨時' | '要確認') ?? '定期',
      source: (task.source as '自動生成' | '手動追加') ?? '自動生成',
      status: (task.status as 'scheduled' | 'in_progress' | 'completed') ?? 'scheduled',
      planningStatus: (task.planning_status as 'unplanned' | 'planned') ?? 'unplanned',
      plannedBy: (task.planned_by as string | null) ?? null,
      plannedById: (task.planned_by_id as string | null) ?? null,
      plannedAt: (task.planned_at as string | null) ?? null,
      handledBy: (task.handled_by as string | null) ?? null,
      handledById: (task.handled_by_id as string | null) ?? null,
      handledAt: (task.handled_at as string | null) ?? null,
      completedAt: (task.completed_at as string | null) ?? null,
      billable: Boolean(task.billable),
      collectionStatus: (task.collection_status as '未着手' | '請求準備OK' | '回収中' | '入金済') ?? '未着手',
      amount: Number(task.amount ?? 0),
      note: String(task.note ?? ''),
      updatedAt: (task.updated_at as string | null) ?? null,
      updatedById: (task.updated_by_id as string | null) ?? null,
    })),
    ownPharmacyId: scopedPharmacyId,
    ownPatientNames,
    patientMap,
    patientBillingSettings,
    collectionRecords,
  })

  const mergedCollectionRecords = [
    ...dayTaskCollectionRecords,
    ...collectionRecords.filter((record) => !dayTaskCollectionRecords.some((taskRecord) => taskRecord.linkedTaskId === record.linkedTaskId)),
  ]

  const patientVisitHistory = buildPatientVisitHistory({
    ownPatients,
    sharedDayTasks: ((tasksResult.data ?? []) as Array<Record<string, unknown>>).map((task) => ({
      id: String(task.id),
      patientId: String(task.patient_id ?? ''),
      pharmacyId: String(task.pharmacy_id ?? ''),
      flowDate: String(task.flow_date ?? flowDate),
      sortOrder: Number(task.sort_order ?? 1),
      scheduledTime: String(task.scheduled_time ?? '10:00'),
      visitType: (task.visit_type as '定期' | '臨時' | '要確認') ?? '定期',
      source: (task.source as '自動生成' | '手動追加') ?? '自動生成',
      status: (task.status as 'scheduled' | 'in_progress' | 'completed') ?? 'scheduled',
      planningStatus: (task.planning_status as 'unplanned' | 'planned') ?? 'unplanned',
      plannedBy: (task.planned_by as string | null) ?? null,
      plannedById: (task.planned_by_id as string | null) ?? null,
      plannedAt: (task.planned_at as string | null) ?? null,
      handledBy: (task.handled_by as string | null) ?? null,
      handledById: (task.handled_by_id as string | null) ?? null,
      handledAt: (task.handled_at as string | null) ?? null,
      completedAt: (task.completed_at as string | null) ?? null,
      billable: Boolean(task.billable),
      collectionStatus: (task.collection_status as '未着手' | '請求準備OK' | '回収中' | '入金済') ?? '未着手',
      amount: Number(task.amount ?? 0),
      note: String(task.note ?? ''),
      updatedAt: (task.updated_at as string | null) ?? null,
      updatedById: (task.updated_by_id as string | null) ?? null,
    })),
    mergedCollectionRecords,
  })

  const dateCollectionSummaries = buildDateCollectionSummaries({
    patientVisitHistory,
    patientSearch,
    statusFilter,
  })

  const adminBillingRecords = buildAdminBillingRecords({
    collectionRecords: mergedCollectionRecords,
    fallbackRecords: billingData,
    pharmacyId: scopedPharmacyId,
    pharmacyName,
  })

  return NextResponse.json({ ok: true, adminBillingRecords, pharmacyName, dateCollectionSummaries })
}
