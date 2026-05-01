import { NextResponse } from 'next/server'

import type { Patient } from '@/types/database'
import { getCurrentUser } from '@/lib/auth'
import { getCurrentActorRole } from '@/lib/active-role'
import { listPatientVisitRules } from '@/lib/repositories/patients'
import { mapDatabasePatientToPatientRecord } from '@/lib/patient-read-model'
import { canManagePatientsForUser, getScopedPharmacyId } from '@/lib/patient-permissions'
import { writeAuditLog } from '@/lib/audit-log'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const actorRole = getCurrentActorRole(user)
  const scopedPharmacyId = getScopedPharmacyId(user)
  if (!canManagePatientsForUser(user) || !scopedPharmacyId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const supabase = createServerSupabaseClient()
  const patientResponse = await supabase
    .from('patients')
    .select('*')
    .eq('organization_id', user.organization_id)
    .eq('pharmacy_id', scopedPharmacyId)
    .eq('id', params.id)
    .maybeSingle()

  if (patientResponse.error) {
    return NextResponse.json({ ok: false, error: 'patient_lookup_failed', details: patientResponse.error.message }, { status: 500 })
  }

  const patient = patientResponse.data as Patient | null
  if (!patient) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  }

  const visitRules = await listPatientVisitRules({
    organizationId: user.organization_id,
    pharmacyId: scopedPharmacyId,
    patientId: params.id,
  })
  let pharmacyName: string | null = null
  if (patient.pharmacy_id) {
    const pharmacyResponse = await supabase
      .from('pharmacies')
      .select('name')
      .eq('organization_id', user.organization_id)
      .eq('id', patient.pharmacy_id)
      .maybeSingle()
    if (!pharmacyResponse.error) {
      pharmacyName = String((pharmacyResponse.data as Record<string, unknown> | null)?.name ?? '') || null
    }
  }

  await writeAuditLog({
    user,
    action: 'patient_viewed',
    targetType: 'patient',
    targetId: patient.id,
    details: {
      view_role: actorRole,
    },
  })

  return NextResponse.json({ ok: true, patient: mapDatabasePatientToPatientRecord(patient, visitRules, { pharmacyName }) })
}
