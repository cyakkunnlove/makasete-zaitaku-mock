import type { UserRole } from '@/types/database'
import type { MockRoleContextView } from '@/lib/mock-role-contexts'

export type RoleAwareUser = {
  role: UserRole
  pharmacy_id?: string | null
  region_id?: string | null
  operation_unit_id?: string | null
  activeRoleContext?: MockRoleContextView | null
}

export function getCurrentActorRole(user: Pick<RoleAwareUser, 'role' | 'activeRoleContext'> | null | undefined): UserRole | null {
  return user?.activeRoleContext?.role ?? user?.role ?? null
}

export function getCurrentScope(user: Pick<RoleAwareUser, 'pharmacy_id' | 'region_id' | 'operation_unit_id' | 'activeRoleContext'> | null | undefined) {
  return {
    pharmacyId: user?.activeRoleContext?.pharmacyId ?? user?.pharmacy_id ?? null,
    regionId: user?.activeRoleContext?.regionId ?? user?.region_id ?? null,
    operationUnitId: user?.activeRoleContext?.operationUnitId ?? user?.operation_unit_id ?? null,
  }
}
