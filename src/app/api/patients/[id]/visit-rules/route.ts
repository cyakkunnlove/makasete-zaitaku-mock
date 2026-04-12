import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { ensureRecentReverification } from '@/lib/api-reauth'
import { getCurrentActorRole } from '@/lib/active-role'
import { canEditPatientRecord, getScopedPharmacyId } from '@/lib/patient-permissions'
import { getPatientById } from '@/lib/repositories/patients'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit-log'
import type { PatientVisitRule } from '@/lib/patient-master'

function normalizeRule(rule: PatientVisitRule) {
  return {
    pattern: rule.pattern,
    weekday: typeof rule.weekday === 'number' ? rule.weekday : null,
    interval_weeks: Number(rule.intervalWeeks ?? 1),
    anchor_week: rule.anchorWeek === 1 || rule.anchorWeek === 2 ? rule.anchorWeek : null,
    preferred_time: rule.preferredTime ?? null,
    monthly_visit_limit: Number(rule.monthlyVisitLimit ?? 4),
    active: Boolean(rule.active),
    custom_dates: Array.isArray(rule.customDates) ? rule.customDates : [],
    excluded_dates: Array.isArray(rule.excludedDates) ? rule.excludedDates : [],
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const reauthResponse = await ensureRecentReverification(user, {
    reason: 'patient_visit_rules_update',
    nextPath: `/dashboard/patients/${params.id}`,
  })
  if (reauthResponse) return reauthResponse

  const patient = await getPatientById(params.id)
  if (!patient) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  }

  const scopedPharmacyId = getScopedPharmacyId(user)
  if (!patient.pharmacy_id || !scopedPharmacyId || patient.pharmacy_id !== scopedPharmacyId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const canEdit = canEditPatientRecord({ role: getCurrentActorRole(user), user: { pharmacy_id: scopedPharmacyId }, patient: { pharmacyId: patient.pharmacy_id } })
  if (!canEdit) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const visitRules = body && typeof body === 'object' && Array.isArray((body as Record<string, unknown>).visitRules)
    ? ((body as Record<string, unknown>).visitRules as PatientVisitRule[])
    : null

  if (!visitRules) {
    return NextResponse.json({ ok: false, error: 'visit_rules_required' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  const { error: deleteError } = await supabase
    .from('patient_visit_rules')
    .delete()
    .eq('patient_id', params.id)

  if (deleteError) {
    return NextResponse.json({ ok: false, error: 'visit_rule_delete_failed', details: deleteError.message }, { status: 500 })
  }

  if (visitRules.length > 0) {
    const insertPayload = visitRules.map((rule) => ({
      patient_id: params.id,
      ...normalizeRule(rule),
    }))

    const { error: insertError } = await supabase
      .from('patient_visit_rules')
      .insert(insertPayload as never)

    if (insertError) {
      return NextResponse.json({ ok: false, error: 'visit_rule_insert_failed', details: insertError.message }, { status: 500 })
    }
  }

  await writeAuditLog({
    user,
    action: 'patient_visit_rules_updated',
    targetType: 'patient',
    targetId: params.id,
    details: {
      visit_rule_count: visitRules.length,
      active_rule_count: visitRules.filter((rule) => rule.active).length,
    },
  })

  return NextResponse.json({ ok: true, visitRules })
}
