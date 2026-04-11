import type { User, UserRole } from '@/types/database'
import type { RegisteredPatientRecord } from '@/lib/patient-master'

export function canManagePatients(role: UserRole | null) {
  return role === 'pharmacy_admin' || role === 'pharmacy_staff'
}

export function canEditPatientRecord(input: {
  role: UserRole | null
  user: Pick<User, 'pharmacy_id'> | null
  patient: Pick<RegisteredPatientRecord, 'pharmacyId'> | null
}) {
  if (!canManagePatients(input.role)) return false
  if (!input.user?.pharmacy_id) return false
  if (!input.patient?.pharmacyId) return false
  return input.user.pharmacy_id === input.patient.pharmacyId
}

export function getScopedPharmacyId(user: Pick<User, 'pharmacy_id'> | null) {
  return user?.pharmacy_id ?? 'PH-01'
}
