import type { CollectionWorkflowStatus } from '@/lib/status-meta'

export const DEFAULT_PATIENT_EDIT_WINDOW_MINUTES = 15
export const DEFAULT_BILLING_PAID_CANCEL_WINDOW_MINUTES = 15

export const correctionReasonCategories = [
  '入力ミス',
  '押し間違い',
  '入金確認の誤り',
  '患者情報の訂正',
  '請求対象設定の訂正',
  'その他',
] as const

export type CorrectionReasonCategory = (typeof correctionReasonCategories)[number]

export function minutesSince(value: string | null | undefined, now = new Date()) {
  if (!value) return Number.POSITIVE_INFINITY
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60000))
}

export function isWithinCorrectionWindow(value: string | null | undefined, windowMinutes: number, now = new Date()) {
  return minutesSince(value, now) <= windowMinutes
}

export function getBillingPaidCorrectionAction(input: {
  status: CollectionWorkflowStatus
  handledAt: string | null | undefined
  windowMinutes?: number
  isPharmacyAdmin: boolean
  isPharmacyStaff: boolean
  hasCorrectionRequest?: boolean
  now?: Date
}) {
  if (input.status !== 'paid') return 'none' as const
  if (input.hasCorrectionRequest && input.isPharmacyAdmin) return 'edit_from_request' as const

  const windowMinutes = input.windowMinutes ?? DEFAULT_BILLING_PAID_CANCEL_WINDOW_MINUTES
  const withinWindow = isWithinCorrectionWindow(input.handledAt, windowMinutes, input.now)
  if (withinWindow && (input.isPharmacyAdmin || input.isPharmacyStaff)) return 'cancel' as const
  if (input.isPharmacyAdmin || input.isPharmacyStaff) return 'request' as const
  return 'none' as const
}

export function getPatientEditCorrectionAction(input: {
  updatedAt: string | null | undefined
  windowMinutes?: number
  hasCorrectionRequest?: boolean
  isPharmacyAdmin?: boolean
  adminOverrideConfirmed?: boolean
  now?: Date
}) {
  if (input.hasCorrectionRequest && input.isPharmacyAdmin) return 'edit_from_request' as const
  if (input.isPharmacyAdmin && input.adminOverrideConfirmed) return 'admin_override' as const

  const windowMinutes = input.windowMinutes ?? DEFAULT_PATIENT_EDIT_WINDOW_MINUTES
  if (isWithinCorrectionWindow(input.updatedAt, windowMinutes, input.now)) return 'edit' as const

  return 'request' as const
}
