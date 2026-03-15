import type { UserRole } from '@/types/database'

export type PermissionKey =
  | 'dashboard'
  | 'requests'
  | 'assign'
  | 'handovers'
  | 'pharmacies'
  | 'staff'
  | 'patients'
  | 'billing'
  | 'reports'
  | 'audit'
  | 'shifts'
  | 'notifications'
  | 'settings'
  | 'more'

export const permissionMatrix: Record<PermissionKey, UserRole[]> = {
  dashboard: ['admin', 'pharmacy_admin', 'pharmacy_staff', 'pharmacist'],
  requests: ['admin', 'pharmacy_admin', 'pharmacy_staff'],
  assign: ['admin'],
  handovers: ['admin', 'pharmacy_admin'],
  pharmacies: ['admin'],
  staff: ['admin'],
  patients: ['admin', 'pharmacy_admin', 'pharmacy_staff'],
  billing: ['admin', 'pharmacy_admin'],
  reports: ['admin'],
  audit: ['admin'],
  shifts: ['admin'],
  notifications: ['admin'],
  settings: ['admin'],
  more: ['admin', 'pharmacy_admin', 'pharmacy_staff', 'pharmacist'],
}

export function canAccess(role: UserRole | null | undefined, permission: PermissionKey) {
  if (!role) return false
  return permissionMatrix[permission].includes(role)
}
