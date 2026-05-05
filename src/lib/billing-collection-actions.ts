import type { BillingCollectionRecord } from '@/lib/billing-read-model'
import type { CollectionWorkflowStatus } from '@/lib/status-meta'

export type BillingPaidActionPolicy = 'cancel' | 'request' | 'edit_from_request' | 'none'

export type BillingCollectionActionKind =
  | 'mark_paid'
  | 'mark_on_hold'
  | 'return_ready'
  | 'cancel_paid'
  | 'request_correction'

export type BillingCollectionAction = {
  kind: BillingCollectionActionKind
  label: string
  nextStatus: CollectionWorkflowStatus | null
}

export function getBillingCollectionActionsForStatus(input: {
  status: CollectionWorkflowStatus
  billable: boolean
  paidAction: BillingPaidActionPolicy
}) {
  const { status, billable, paidAction } = input
  if (!billable) return [] as BillingCollectionAction[]

  if (status === 'ready' || status === 'pending') {
    return [
      { kind: 'mark_paid', label: '入金済みにする', nextStatus: 'paid' },
      { kind: 'mark_on_hold', label: '要確認にする', nextStatus: 'on_hold' },
    ] satisfies BillingCollectionAction[]
  }

  if (status === 'on_hold') {
    return [
      { kind: 'return_ready', label: '請求必要に戻す', nextStatus: 'ready' },
      { kind: 'mark_paid', label: '入金済みにする', nextStatus: 'paid' },
    ] satisfies BillingCollectionAction[]
  }

  if (status === 'paid' && paidAction === 'cancel') {
    return [{ kind: 'cancel_paid', label: '請求済みに戻す', nextStatus: 'pending' }] satisfies BillingCollectionAction[]
  }

  if (status === 'paid' && (paidAction === 'request' || paidAction === 'edit_from_request')) {
    return [{ kind: 'request_correction', label: '修正依頼', nextStatus: null }] satisfies BillingCollectionAction[]
  }

  return [] as BillingCollectionAction[]
}

export function getBillingCollectionActions(input: {
  record: BillingCollectionRecord
  paidAction: BillingPaidActionPolicy
}) {
  return getBillingCollectionActionsForStatus({
    status: input.record.status,
    billable: input.record.billable,
    paidAction: input.paidAction,
  })
}

export function findBillingCollectionActionForStatusChange(input: {
  currentStatus: CollectionWorkflowStatus
  nextStatus: CollectionWorkflowStatus
  billable: boolean
  paidAction: BillingPaidActionPolicy
}) {
  return (
    getBillingCollectionActionsForStatus({
      status: input.currentStatus,
      billable: input.billable,
      paidAction: input.paidAction,
    }).find((action) => action.nextStatus === input.nextStatus) ?? null
  )
}
