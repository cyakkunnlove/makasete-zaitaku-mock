import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { buildAdminBillingRecords, buildDateCollectionSummaries, buildDayTaskCollectionRecords, buildPatientVisitHistory, buildUnbilledVisitRecords, type BillingCollectionRecord } from '@/lib/billing-read-model'
import type { RegisteredPatientRecord } from '@/lib/patient-master'
import { mapPatientDayTaskRowToDayTaskItem } from '@/lib/day-flow'
import { mapDatabasePatientToPatientRecord } from '@/lib/patient-read-model'
import { canManagePatientsForUser, getScopedPharmacyId } from '@/lib/patient-permissions'
import { listPatientsByPharmacy, listPatientVisitRules } from '@/lib/repositories/patients'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

function getTodayJstDateKey() {
  const now = new Date()
  const jst = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))
  const year = jst.getFullYear()
  const month = String(jst.getMonth() + 1).padStart(2, '0')
  const day = String(jst.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const flowDate = body && typeof body === 'object' && typeof (body as Record<string, unknown>).flowDate === 'string'
    ? String((body as Record<string, unknown>).flowDate)
    : getTodayJstDateKey()
  const patientSearch = body && typeof body === 'object' && typeof (body as Record<string, unknown>).patientSearch === 'string'
    ? String((body as Record<string, unknown>).patientSearch)
    : ''
  const statusFilter = body && typeof body === 'object' && typeof (body as Record<string, unknown>).statusFilter === 'string'
    ? ((body as Record<string, unknown>).statusFilter as 'all' | 'ready' | 'pending' | 'paid' | 'on_hold')
    : 'all'
  const processedUnbilledIds = body && typeof body === 'object' && Array.isArray((body as Record<string, unknown>).processedUnbilledIds)
    ? new Set(((body as Record<string, unknown>).processedUnbilledIds as unknown[]).filter((item): item is string => typeof item === 'string'))
    : new Set<string>()
  const collectionRecords: BillingCollectionRecord[] = []

  const scopedPharmacyId = getScopedPharmacyId(user)
  if (!canManagePatientsForUser(user) || !scopedPharmacyId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const supabase = createServerSupabaseClient()
  const [tasksResult, pharmacyResult] = await Promise.all([
    supabase
      .from('patient_day_tasks')
      .select('*')
      .eq('organization_id', user.organization_id)
      .eq('pharmacy_id', scopedPharmacyId)
      .eq('flow_date', flowDate)
      .order('sort_order', { ascending: true }),
    supabase
      .from('pharmacies')
      .select('name')
      .eq('organization_id', user.organization_id)
      .eq('id', scopedPharmacyId)
      .maybeSingle(),
  ])

  if (tasksResult.error) {
    return NextResponse.json({ ok: false, error: 'billing_read_model_tasks_failed', details: tasksResult.error.message }, { status: 500 })
  }

  const pharmacyName = String((pharmacyResult.data as Record<string, unknown> | null)?.name ?? '') || 'マカセテ在宅テスト薬局'

  let ownPatients: RegisteredPatientRecord[] = []
  if (canManagePatientsForUser(user)) {
    const patients = await listPatientsByPharmacy({ organizationId: user.organization_id, pharmacyId: scopedPharmacyId })
    ownPatients = await Promise.all(
      patients.map(async (patient) => {
        const visitRules = await listPatientVisitRules({
          organizationId: user.organization_id,
          pharmacyId: scopedPharmacyId,
          patientId: patient.id,
        })
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

  const sharedDayTasks = ((tasksResult.data ?? []) as Array<Record<string, unknown>>).map((task) => mapPatientDayTaskRowToDayTaskItem(task, flowDate))

  const dayTaskCollectionRecords = buildDayTaskCollectionRecords({
    sharedDayTasks,
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
    sharedDayTasks,
    mergedCollectionRecords,
  })

  const dateCollectionSummaries = buildDateCollectionSummaries({
    patientVisitHistory,
    patientSearch,
    statusFilter,
  })

  const unbilledVisitRecords = buildUnbilledVisitRecords({
    sharedDayTasks,
    ownPharmacyId: scopedPharmacyId,
    patientMap,
    patientBillingSettings,
    mergedCollectionRecords,
    processedUnbilledIds,
  })

  const adminBillingRecords = buildAdminBillingRecords({
    collectionRecords: mergedCollectionRecords,
    fallbackRecords: [],
    pharmacyId: scopedPharmacyId,
    pharmacyName,
  })

  return NextResponse.json({ ok: true, adminBillingRecords, pharmacyName, dateCollectionSummaries, unbilledVisitRecords })
}
