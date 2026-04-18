import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { billingData } from '@/lib/mock-data'
import { buildAdminBillingRecords } from '@/lib/billing-read-model'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })
  }

  const collectionRecords = Array.isArray((body as Record<string, unknown>).collectionRecords)
    ? (body as Record<string, unknown>).collectionRecords as Array<{
        id: string
        patientName: string
        month: string
        amount: number
        status: 'needs_billing' | 'billed' | 'paid' | 'needs_attention'
        dueDate: string
        note: string
        linkedTaskId: string
        handledBy: string | null
        handledAt: string | null
        billable: boolean
      }>
    : []

  const pharmacyId = typeof (body as Record<string, unknown>).pharmacyId === 'string' ? String((body as Record<string, unknown>).pharmacyId) : 'PH-01'
  const pharmacyName = typeof (body as Record<string, unknown>).pharmacyName === 'string' ? String((body as Record<string, unknown>).pharmacyName) : 'マカセテ在宅テスト薬局'

  const adminBillingRecords = buildAdminBillingRecords({
    collectionRecords,
    fallbackRecords: billingData,
    pharmacyId,
    pharmacyName,
  })

  return NextResponse.json({ ok: true, adminBillingRecords })
}
