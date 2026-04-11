import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getPatientById, listPatientVisitRules } from '@/lib/repositories/patients'
import { mapDatabasePatientToPatientRecord } from '@/lib/patient-read-model'
import { canManagePatients } from '@/lib/patient-permissions'
import { writeAuditLog } from '@/lib/audit-log'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const patient = await getPatientById(params.id)
  if (!patient) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  }

  const samePharmacy = Boolean(user.pharmacy_id && patient.pharmacy_id === user.pharmacy_id)
  const canView = canManagePatients(user.role) ? samePharmacy : user.role === 'night_pharmacist' || user.role === 'regional_admin'

  if (!canView) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const visitRules = await listPatientVisitRules(params.id)

  await writeAuditLog({
    user,
    action: 'patient_viewed',
    targetType: 'patient',
    targetId: patient.id,
    details: {
      patient_name: patient.full_name,
      view_role: user.role,
    },
  })

  return NextResponse.json({ ok: true, patient: mapDatabasePatientToPatientRecord(patient, visitRules) })
}
