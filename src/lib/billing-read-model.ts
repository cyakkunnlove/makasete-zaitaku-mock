import type { BillingStatus } from '@/types/database'
import type { BillingRecord, DayTaskItem } from '@/lib/mock-data'
import type { RegisteredPatientRecord } from '@/lib/patient-master'
import { mapCollectionDbStatusToApp, type CollectionWorkflowStatus } from '@/lib/status-meta'

export const COLLECTION_HANDOFF_NOTE_PREFIX = '請求処理へ回した訪問'

export type BillingCollectionRecord = {
  id: string
  patientName: string
  month: string
  amount: number
  status: CollectionWorkflowStatus
  dueDate: string
  note: string
  linkedTaskId: string
  handledBy: string | null
  handledAt: string | null
  billable: boolean
  updatedAt: string | null
}

export type BillingPatientVisitHistory = {
  patientId: string
  patientName: string
  lastVisitAt: string
  visits: Array<{
    visitId: string
    prescriptionDate: string
    visitDate: string
    amount: number
    workflowStatus: CollectionWorkflowStatus
    collectionRecordId: string | null
    note: string
    handledBy: string | null
    handledAt: string | null
  }>
}

export type BillingDateCollectionSummary = {
  date: string
  patientCount: number
  paidCount: number
  billedCount: number
  attentionCount: number
  items: Array<{
    patientId: string
    patientName: string
    visitDate: string
    amount: number
    status: CollectionWorkflowStatus
    note: string
    recordId: string | null
    handledBy: string | null
    handledAt: string | null
  }>
}

export type BillingUnbilledVisitRecord = {
  id: string
  linkedTaskId: string
  patientId: string
  patientName: string
  visitDate: string
  prescriptionDate: string
  visitType: string
  staffName: string
  amount: number
  status: 'ready' | 'review'
  note: string
}

export function buildAdminBillingRecords({
  collectionRecords,
  fallbackRecords,
  pharmacyId,
  pharmacyName,
}: {
  collectionRecords: BillingCollectionRecord[]
  fallbackRecords: BillingRecord[]
  pharmacyId: string
  pharmacyName: string
}): BillingRecord[] {
  const source = collectionRecords.filter((record) => record.billable)
  if (source.length === 0) return fallbackRecords

  const monthMap = new Map<string, BillingRecord>()
  for (const record of source) {
    const month = record.month
    const key = `${pharmacyId}-${month}`
    const totalAmountForMonth = source
      .filter((item) => item.month === month)
      .reduce((sum, item) => sum + item.amount, 0)
    const nextStatus: BillingStatus = record.status === 'paid'
      ? 'paid'
      : record.status === 'on_hold'
        ? 'overdue'
        : 'unpaid'

    const current = monthMap.get(key)
    if (!current) {
      monthMap.set(key, {
        id: `BL-${key}`,
        invoiceNumber: `INV-${month.replace('-', '')}-${pharmacyId}`,
        pharmacyId,
        pharmacyName,
        month,
        saasFee: 0,
        nightFee: totalAmountForMonth,
        tax: 0,
        total: totalAmountForMonth,
        status: nextStatus,
      })
      continue
    }

    if (current.status !== 'overdue') {
      current.status = nextStatus === 'overdue' ? 'overdue' : current.status === 'paid' && nextStatus === 'paid' ? 'paid' : 'unpaid'
    }
  }

  return Array.from(monthMap.values()).sort((a, b) => b.month.localeCompare(a.month))
}

export function buildDayTaskCollectionRecords({
  sharedDayTasks,
  ownPharmacyId,
  ownPatientNames,
  patientMap,
  patientBillingSettings,
  collectionRecords,
}: {
  sharedDayTasks: DayTaskItem[]
  ownPharmacyId: string
  ownPatientNames: Set<string>
  patientMap: Map<string, RegisteredPatientRecord>
  patientBillingSettings: Map<string, { isBillable: boolean; reason: string | null }>
  collectionRecords: BillingCollectionRecord[]
}): BillingCollectionRecord[] {
  return sharedDayTasks
    .filter((task) => {
      if (task.pharmacyId !== ownPharmacyId || task.status !== 'completed' || !task.billable) return false
      return true
    })
    .map((task) => {
      const patient = patientMap.get(task.patientId)
      const existing = collectionRecords.find((record) => record.linkedTaskId === task.id)
      const patientBilling = patientBillingSettings.get(task.patientId)
      const status = existing?.status ?? mapCollectionDbStatusToApp(task.collectionStatus)
      return {
        id: existing?.id ?? `COL-${task.id}`,
        patientName: patient?.name ?? task.patientId,
        month: task.flowDate.slice(0, 7),
        amount: task.amount,
        status,
        dueDate: existing?.dueDate ?? `${task.flowDate.slice(0, 7)}-25`,
        note: existing?.note ?? (patientBilling?.isBillable === false ? (patientBilling.reason ?? '請求対象外') : 'day task 由来の請求候補'),
        linkedTaskId: task.id,
        handledBy: existing?.handledBy ?? task.handledBy,
        handledAt: existing?.handledAt ?? task.handledAt ?? task.completedAt,
        billable: task.billable && patientBilling?.isBillable !== false,
        updatedAt: task.updatedAt,
      }
    })
    .filter((record) => ownPatientNames.has(record.patientName))
}

export function buildPatientVisitHistory({
  ownPatients,
  sharedDayTasks,
  mergedCollectionRecords,
}: {
  ownPatients: RegisteredPatientRecord[]
  sharedDayTasks: DayTaskItem[]
  mergedCollectionRecords: BillingCollectionRecord[]
}): BillingPatientVisitHistory[] {
  return ownPatients.map((patient) => {
    const tasks = sharedDayTasks.filter((task) => task.patientId === patient.id)
    const patientRecords = mergedCollectionRecords.filter((record) => record.patientName === patient.name)
    const completedTaskVisits = tasks
      .filter((task) => task.status === 'completed' && !!task.completedAt)
      .map((task) => {
        const visitDate = task.flowDate
        const linkedCollection = patientRecords.find((record) => record.linkedTaskId === task.id)
          ?? patientRecords.find((record) => record.handledAt?.slice(0, 10) === visitDate)
          ?? null
        return {
          visitId: `VISIT-${task.id}`,
          prescriptionDate: visitDate,
          visitDate,
          amount: linkedCollection?.amount ?? task.amount,
          workflowStatus: linkedCollection?.status ?? (task.billable ? 'ready' : 'on_hold'),
          collectionRecordId: linkedCollection?.id ?? null,
          note: linkedCollection?.note ?? task.note ?? '',
          handledBy: linkedCollection?.handledBy ?? null,
          handledAt: linkedCollection?.handledAt ?? null,
        }
      })

    const recordOnlyVisits = patientRecords
      .filter((record) => !completedTaskVisits.some((visit) => visit.collectionRecordId === record.id))
      .map((record) => ({
        visitId: `COLLECT-${record.id}`,
        prescriptionDate: record.handledAt?.slice(0, 10) ?? `${record.month}-01`,
        visitDate: record.handledAt?.slice(0, 10) ?? `${record.month}-01`,
        amount: record.amount,
        workflowStatus: record.status,
        collectionRecordId: record.id,
        note: record.note ?? '',
        handledBy: record.handledBy ?? null,
        handledAt: record.handledAt ?? null,
      }))

    const visits = [...completedTaskVisits, ...recordOnlyVisits].sort((a, b) => b.visitDate.localeCompare(a.visitDate))
    const lastVisit = tasks.filter((task) => task.completedAt || task.status === 'completed').sort((a, b) => b.flowDate.localeCompare(a.flowDate))[0]

    return {
      patientId: patient.id,
      patientName: patient.name,
      lastVisitAt: lastVisit?.flowDate ?? '—',
      visits,
    }
  })
}

export function buildDateCollectionSummaries({
  patientVisitHistory,
  patientSearch,
  statusFilter,
}: {
  patientVisitHistory: BillingPatientVisitHistory[]
  patientSearch: string
  statusFilter: 'all' | CollectionWorkflowStatus
}): BillingDateCollectionSummary[] {
  const filteredPatientVisitHistory = patientVisitHistory.filter((item) => {
    const matchesSearch = patientSearch.trim().length === 0 || item.patientName.toLowerCase().includes(patientSearch.trim().toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.visits.some((visit) => visit.workflowStatus === statusFilter)
    return matchesSearch && matchesStatus
  })

  const map = new Map<string, BillingDateCollectionSummary>()
  filteredPatientVisitHistory.forEach((patient) => {
    patient.visits.forEach((visit) => {
      const matchesStatus = statusFilter === 'all' || visit.workflowStatus === statusFilter
      if (!matchesStatus) return
      const existing = map.get(visit.visitDate) ?? {
        date: visit.visitDate,
        patientCount: 0,
        paidCount: 0,
        billedCount: 0,
        attentionCount: 0,
        items: [],
      }
      existing.patientCount += 1
      if (visit.workflowStatus === 'paid') existing.paidCount += 1
      if (visit.workflowStatus === 'pending' || visit.workflowStatus === 'ready') existing.billedCount += 1
      if (visit.workflowStatus === 'on_hold') existing.attentionCount += 1
      existing.items.push({
        patientId: patient.patientId,
        patientName: patient.patientName,
        visitDate: visit.visitDate,
        amount: visit.amount,
        status: visit.workflowStatus,
        note: visit.note,
        recordId: visit.collectionRecordId ?? null,
        handledBy: visit.handledBy,
        handledAt: visit.handledAt,
      })
      map.set(visit.visitDate, existing)
    })
  })

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
}

export function buildUnbilledVisitRecords({
  sharedDayTasks,
  ownPharmacyId,
  patientMap,
  patientBillingSettings,
  mergedCollectionRecords,
  processedUnbilledIds,
}: {
  sharedDayTasks: DayTaskItem[]
  ownPharmacyId: string
  patientMap: Map<string, RegisteredPatientRecord>
  patientBillingSettings: Map<string, { isBillable: boolean; reason: string | null }>
  mergedCollectionRecords: BillingCollectionRecord[]
  processedUnbilledIds: Set<string>
}): BillingUnbilledVisitRecord[] {
  return sharedDayTasks
    .filter((task) => {
      if (task.pharmacyId !== ownPharmacyId || task.status !== 'completed' || !task.billable) return false
      if (patientBillingSettings.get(task.patientId)?.isBillable === false) return false
      const appStatus = mapCollectionDbStatusToApp(task.collectionStatus)
      return appStatus === 'ready' && !task.note.startsWith(COLLECTION_HANDOFF_NOTE_PREFIX)
    })
    .map((task) => {
      const patient = patientMap.get(task.patientId)
      return {
        id: `UNB-${task.id}`,
        linkedTaskId: task.id,
        patientId: task.patientId,
        patientName: patient?.name ?? task.patientId,
        visitDate: task.flowDate,
        prescriptionDate: task.flowDate,
        visitType: task.visitType,
        staffName: task.handledBy ?? '未設定',
        amount: task.amount,
        status: (mapCollectionDbStatusToApp(task.collectionStatus) === 'ready' ? 'ready' : 'review') as 'ready' | 'review',
        note: task.note,
      }
    })
    .filter((record) => !mergedCollectionRecords.some((item) => item.linkedTaskId === record.linkedTaskId && item.billable))
    .filter((record) => !processedUnbilledIds.has(record.id))
}
