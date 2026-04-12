import type { User, UserRole } from '@/types/database'
import type { RegisteredPatientRecord } from '@/lib/patient-master'
import { isPatientInPharmacyScope } from '@/lib/patient-scope'
import { getCurrentActorRole, getCurrentScope, type RoleAwareUser } from '@/lib/active-role'

export function canManagePatients(role: UserRole | null) {
  return role === 'pharmacy_admin' || role === 'pharmacy_staff'
}

export function canManagePatientsForUser(user: Pick<RoleAwareUser, 'role' | 'activeRoleContext'> | null) {
  return canManagePatients(getCurrentActorRole(user))
}

export function canEditPatientRecord(input: {
  role: UserRole | null
  user: Pick<User, 'pharmacy_id'> | null
  patient: Pick<RegisteredPatientRecord, 'pharmacyId'> | null
}) {
  if (!canManagePatients(input.role)) return false
  if (!input.user?.pharmacy_id) return false
  if (!input.patient?.pharmacyId) return false
  return isPatientInPharmacyScope(input.patient, input.user.pharmacy_id)
}

export function getScopedPharmacyId(user: Pick<RoleAwareUser, 'pharmacy_id' | 'region_id' | 'operation_unit_id' | 'activeRoleContext'> | null) {
  return getCurrentScope(user).pharmacyId ?? 'PH-01'
}
