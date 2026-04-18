import type { BillingStatus } from '@/types/database'
import type { BillingRecord, DayTaskItem } from '@/lib/mock-data'
import type { RegisteredPatientRecord } from '@/lib/patient-master'
import type { CollectionWorkflowStatus } from '@/lib/status-meta'

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
      : record.status === 'needs_attention'
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
    .filter((task) => task.pharmacyId === ownPharmacyId)
    .map((task) => {
      const patient = patientMap.get(task.patientId)
      const existing = collectionRecords.find((record) => record.linkedTaskId === task.id)
      const patientBilling = patientBillingSettings.get(task.patientId)
      const status = existing?.status ?? mapLegacyCollectionStatus(task.collectionStatus)
      return {
        id: existing?.id ?? `COL-${task.id}`,
        patientName: patient?.name ?? task.patientId,
        month: task.completedAt?.slice(0, 7) ?? task.flowDate.slice(0, 7),
        amount: task.amount,
        status,
        dueDate: existing?.dueDate ?? `${task.flowDate.slice(0, 7)}-25`,
        note: existing?.note ?? (patientBilling?.isBillable === false ? (patientBilling.reason ?? '請求対象外') : 'day task 由来の請求候補'),
        linkedTaskId: task.id,
        handledBy: task.handledBy,
        handledAt: task.completedAt ?? task.handledAt,
        billable: task.billable && patientBilling?.isBillable !== false,
      }
    })
    .filter((record) => ownPatientNames.has(record.patientName))
}

function mapLegacyCollectionStatus(status: DayTaskItem['collectionStatus']): CollectionWorkflowStatus {
  switch (status) {
    case '入金済':
      return 'paid'
    case '回収中':
      return 'billed'
    case '請求準備OK':
      return 'needs_billing'
    case '未着手':
    default:
      return 'needs_billing'
  }
}
