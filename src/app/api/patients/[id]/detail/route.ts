import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getCurrentActorRole, getCurrentScope } from '@/lib/active-role'
import { getPatientById, getPatientRegionId, listPatientVisitRules } from '@/lib/repositories/patients'
import { mapDatabasePatientToPatientRecord } from '@/lib/patient-read-model'
import { canManagePatientsForUser, getScopedPharmacyId } from '@/lib/patient-permissions'
import { writeAuditLog } from '@/lib/audit-log'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const patient = await getPatientById(params.id)
  if (!patient) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  }

  const actorRole = getCurrentActorRole(user)
  const actorScope = getCurrentScope(user)
  const scopedPharmacyId = getScopedPharmacyId(user)
  const samePharmacy = Boolean(scopedPharmacyId && patient.pharmacy_id === scopedPharmacyId)
  const patientRegionId = actorRole === 'regional_admin' ? await getPatientRegionId(patient.id) : null
  const canView = canManagePatientsForUser(user)
    ? samePharmacy
    : actorRole === 'night_pharmacist'
      ? true
      : actorRole === 'regional_admin' && Boolean(actorScope.regionId && patientRegionId && actorScope.regionId === patientRegionId)

  if (!canView) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const visitRules = await listPatientVisitRules(params.id)
  let pharmacyName: string | null = null
  if (patient.pharmacy_id) {
    const supabase = createServerSupabaseClient()
    const pharmacyResponse = await supabase.from('pharmacies').select('name').eq('id', patient.pharmacy_id).maybeSingle()
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
      patient_name: patient.full_name,
      view_role: actorRole,
    },
  })

  return NextResponse.json({ ok: true, patient: mapDatabasePatientToPatientRecord(patient, visitRules, { pharmacyName }) })
}
