import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { listPatientsByPharmacy, listPatientVisitRules } from '@/lib/repositories/patients'
import { mapDatabasePatientToPatientRecord } from '@/lib/patient-read-model'
import { canManagePatients } from '@/lib/patient-permissions'

export async function GET(_request: Request, { params }: { params: { pharmacyId: string } }) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  if (!canManagePatients(user.role)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  if (!user.pharmacy_id || user.pharmacy_id !== params.pharmacyId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const patients = await listPatientsByPharmacy(params.pharmacyId)
  const patientsWithVisitRules = await Promise.all(
    patients.map(async (patient) => {
      const visitRules = await listPatientVisitRules(patient.id)
      return mapDatabasePatientToPatientRecord(patient, visitRules)
    }),
  )
  return NextResponse.json({ ok: true, patients: patientsWithVisitRules })
}
