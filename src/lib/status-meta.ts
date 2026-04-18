import type { BillingStatus } from '@/types/database'
import type { PharmacyStatus } from '@/lib/mock-data'

export type CollectionWorkflowStatus = 'needs_billing' | 'billed' | 'paid' | 'needs_attention'

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
  needs_billing: { label: '請求必要', className: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
  billed: { label: '請求済み', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  paid: { label: '入金済み', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  needs_attention: { label: '要確認', className: 'border-rose-200 bg-rose-50 text-rose-700' },
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
