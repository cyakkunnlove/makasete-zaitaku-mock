import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { listPatientsByPharmacy } from '@/lib/repositories/patients'
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
  return NextResponse.json({ ok: true, patients })
}
