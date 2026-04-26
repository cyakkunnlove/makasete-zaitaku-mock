import { NextResponse } from 'next/server'

import { getCurrentActorRole } from '@/lib/active-role'
import { getCurrentUser, requireRecentReverification } from '@/lib/auth'
import {
  DEFAULT_BILLING_PAID_CANCEL_WINDOW_MINUTES,
  DEFAULT_PATIENT_EDIT_WINDOW_MINUTES,
} from '@/lib/correction-policy'
import { getScopedPharmacyId } from '@/lib/patient-permissions'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

type OperationSettingsRow = {
  patient_edit_window_minutes: number | null
  billing_paid_cancel_window_minutes: number | null
  correction_reason_required: boolean | null
}

function normalizeWindowMinutes(value: unknown, fallback: number) {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.max(1, Math.min(1440, Math.round(numeric)))
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const actorRole = getCurrentActorRole(user)
  const scopedPharmacyId = getScopedPharmacyId(user)
  if (!actorRole || !['pharmacy_admin', 'pharmacy_staff', 'regional_admin'].includes(actorRole) || !scopedPharmacyId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('pharmacy_operation_settings')
    .select('*')
    .eq('pharmacy_id', scopedPharmacyId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ ok: false, error: 'operation_settings_fetch_failed', details: error.message }, { status: 500 })
  }

  const settingsRow = data as OperationSettingsRow | null

  return NextResponse.json({
    ok: true,
    settings: {
      pharmacy_id: scopedPharmacyId,
      patient_edit_window_minutes: settingsRow?.patient_edit_window_minutes ?? DEFAULT_PATIENT_EDIT_WINDOW_MINUTES,
      billing_paid_cancel_window_minutes: settingsRow?.billing_paid_cancel_window_minutes ?? DEFAULT_BILLING_PAID_CANCEL_WINDOW_MINUTES,
      correction_reason_required: settingsRow?.correction_reason_required ?? true,
    },
  })
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const actorRole = getCurrentActorRole(user)
  const scopedPharmacyId = getScopedPharmacyId(user)
  if (actorRole !== 'pharmacy_admin' || !scopedPharmacyId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }
  if (!(await requireRecentReverification(user))) {
    return NextResponse.json({ ok: false, error: 'reauth_required' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const input = body && typeof body === 'object' ? body as Record<string, unknown> : {}

  const payload = {
    organization_id: user.organization_id,
    pharmacy_id: scopedPharmacyId,
    patient_edit_window_minutes: normalizeWindowMinutes(input.patientEditWindowMinutes, DEFAULT_PATIENT_EDIT_WINDOW_MINUTES),
    billing_paid_cancel_window_minutes: normalizeWindowMinutes(input.billingPaidCancelWindowMinutes, DEFAULT_BILLING_PAID_CANCEL_WINDOW_MINUTES),
    correction_reason_required: input.correctionReasonRequired !== false,
    updated_by: user.id,
  }

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('pharmacy_operation_settings')
    .upsert(payload as never, { onConflict: 'pharmacy_id' })
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ ok: false, error: 'operation_settings_save_failed', details: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, settings: data })
}
