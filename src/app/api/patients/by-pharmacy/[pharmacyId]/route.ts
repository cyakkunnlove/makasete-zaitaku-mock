import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { listPatientsByIdsForPharmacy, listPatientsByPharmacy, listPatientVisitRulesByPatientIds } from '@/lib/repositories/patients'
import { mapDatabasePatientToPatientRecord } from '@/lib/patient-read-model'
import { canManagePatientsForUser, getScopedPharmacyId } from '@/lib/patient-permissions'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request, { params }: { params: { pharmacyId: string } }) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  if (!canManagePatientsForUser(user)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const scopedPharmacyId = getScopedPharmacyId(user)
  if (!scopedPharmacyId || scopedPharmacyId !== params.pharmacyId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const patientIds = (url.searchParams.get('ids') ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)

  const patients = patientIds.length > 0
    ? await listPatientsByIdsForPharmacy({ organizationId: user.organization_id, pharmacyId: scopedPharmacyId, patientIds })
    : await listPatientsByPharmacy({ organizationId: user.organization_id, pharmacyId: scopedPharmacyId })
  let pharmacyName: string | null = null
  const supabase = createServerSupabaseClient()
  const pharmacyResponse = await supabase
    .from('pharmacies')
    .select('name')
    .eq('organization_id', user.organization_id)
    .eq('id', scopedPharmacyId)
    .maybeSingle()
  if (!pharmacyResponse.error) {
    pharmacyName = String((pharmacyResponse.data as Record<string, unknown> | null)?.name ?? '') || null
  }

  const visitRulesByPatientId = await listPatientVisitRulesByPatientIds({ patientIds: patients.map((patient) => patient.id) })
  const patientsWithVisitRules = patients.map((patient) => mapDatabasePatientToPatientRecord(patient, visitRulesByPatientId.get(patient.id) ?? [], { pharmacyName }))
  return NextResponse.json({ ok: true, patients: patientsWithVisitRules })
}
