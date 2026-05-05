import type { BillingStatus, RequestStatus } from '@/types/database'
import type { PharmacyStatus } from '@/lib/mock-data'

export type CollectionWorkflowStatus = 'ready' | 'pending' | 'paid' | 'on_hold'
export type CollectionWorkflowDbStatus = 'needs_billing' | 'billed' | 'paid' | 'needs_attention'
export type CollectionWorkflowLegacyStatus = '未着手' | '請求準備OK' | '回収中' | '要確認' | '入金済'
export type RequestStatusRole = 'admin' | 'night_pharmacist' | 'pharmacy'

export type StatusMeta = {
  label: string
  className: string
}

export const billingStatusMeta: Record<BillingStatus, StatusMeta> = {
  paid: { label: '入金済', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  unpaid: { label: '未入金', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  overdue: { label: '期限超過', className: 'border-rose-200 bg-rose-50 text-rose-700' },
}

export const collectionWorkflowStatusMeta: Record<CollectionWorkflowStatus, StatusMeta> = {
  ready: { label: '請求必要', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  pending: { label: '請求済み', className: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
  paid: { label: '入金済み', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  on_hold: { label: '要確認', className: 'border-rose-200 bg-rose-50 text-rose-700' },
}

export function mapCollectionDbStatusToApp(status: string | null | undefined): CollectionWorkflowStatus {
  switch (status) {
    case 'needs_billing':
    case 'ready':
      return 'ready'
    case 'billed':
    case 'pending':
      return 'pending'
    case 'needs_attention':
    case 'on_hold':
      return 'on_hold'
    case 'paid':
      return 'paid'
    default:
      return 'ready'
  }
}

export function mapCollectionAppStatusToDb(status: CollectionWorkflowStatus | string | null | undefined): CollectionWorkflowDbStatus {
  switch (status) {
    case 'ready':
    case 'needs_billing':
      return 'needs_billing'
    case 'pending':
    case 'billed':
      return 'billed'
    case 'on_hold':
    case 'needs_attention':
      return 'needs_attention'
    case 'paid':
      return 'paid'
    default:
      return 'needs_billing'
  }
}

export function normalizeCollectionStatusToDb(status: CollectionWorkflowStatus | CollectionWorkflowDbStatus | CollectionWorkflowLegacyStatus | string | null | undefined): CollectionWorkflowDbStatus {
  switch (status) {
    case '未着手':
    case '請求準備OK':
    case 'ready':
    case 'needs_billing':
      return 'needs_billing'
    case '回収中':
    case 'pending':
    case 'billed':
      return 'billed'
    case '入金済':
    case 'paid':
      return 'paid'
    case '要確認':
    case 'on_hold':
    case 'needs_attention':
      return 'needs_attention'
    default:
      return 'needs_billing'
  }
}

export function mapCollectionStatusToLegacy(status: CollectionWorkflowStatus | CollectionWorkflowDbStatus | CollectionWorkflowLegacyStatus | string | null | undefined): CollectionWorkflowLegacyStatus {
  switch (normalizeCollectionStatusToDb(status)) {
    case 'billed':
      return '回収中'
    case 'paid':
      return '入金済'
    case 'needs_attention':
      return '要確認'
    case 'needs_billing':
    default:
      return '未着手'
  }
}

export const pharmacyStatusMeta: Record<PharmacyStatus, StatusMeta> = {
  active: { label: '利用中', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  pending: { label: '初期設定中', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  suspended: { label: '停止中', className: 'border-rose-200 bg-rose-50 text-rose-700' },
}

export const pharmacyDetailStatusMeta: Record<PharmacyStatus, StatusMeta> = {
  active: { label: '利用中', className: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' },
  pending: { label: '初期設定中', className: 'border-amber-500/40 bg-amber-500/20 text-amber-300' },
  suspended: { label: '停止中', className: 'border-rose-500/40 bg-rose-500/20 text-rose-300' },
}

export function getRequestDisplayStatus(status: RequestStatus, role: RequestStatusRole, patientId: string | null): StatusMeta {
  if (status === 'completed') {
    return { label: '完了', className: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' }
  }

  if (['dispatched', 'arrived', 'in_progress'].includes(status)) {
    return { label: '対応中', className: 'border-sky-500/40 bg-sky-500/20 text-sky-300' }
  }

  if (role === 'admin') {
    if (patientId) {
      return { label: '患者特定済', className: 'border-indigo-500/40 bg-indigo-500/20 text-indigo-300' }
    }
    return { label: '受付', className: 'border-amber-500/40 bg-amber-500/20 text-amber-300' }
  }

  if (role === 'night_pharmacist') {
    if (patientId) {
      return { label: '受付済み', className: 'border-indigo-500/40 bg-indigo-500/20 text-indigo-300' }
    }
    if (status === 'fax_received') {
      return { label: '患者特定待ち', className: 'border-amber-500/40 bg-amber-500/20 text-amber-300' }
    }
    if (status === 'fax_pending') {
      return { label: 'FAX受信待ち', className: 'border-purple-500/40 bg-purple-500/20 text-purple-300' }
    }
    return { label: '受電済み', className: 'border-cyan-500/40 bg-cyan-500/20 text-cyan-300' }
  }

  return { label: '対応準備中', className: 'border-amber-500/40 bg-amber-500/20 text-amber-300' }
}
