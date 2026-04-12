import type { UserRole } from '@/types/database'

export type PermissionKey =
  | 'dashboard'
  | 'requests'
  | 'requestDetail'
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
  | 'onboarding'
  | 'settings'
  | 'more'

export const permissionMatrix: Record<PermissionKey, UserRole[]> = {
  dashboard: ['system_admin', 'regional_admin', 'pharmacy_admin', 'night_pharmacist', 'pharmacy_staff'],
  requests: ['regional_admin', 'pharmacy_admin', 'night_pharmacist'],
  requestDetail: ['regional_admin', 'pharmacy_admin', 'night_pharmacist'],
  assign: ['regional_admin'],
  handovers: ['regional_admin', 'pharmacy_admin', 'night_pharmacist', 'pharmacy_staff'],
  pharmacies: ['regional_admin'],
  staff: ['system_admin', 'regional_admin', 'pharmacy_admin'],
  patients: ['regional_admin', 'pharmacy_admin', 'night_pharmacist', 'pharmacy_staff'],
  billing: ['system_admin', 'pharmacy_admin', 'pharmacy_staff'],
  reports: ['regional_admin'],
  audit: ['system_admin', 'regional_admin'],
  shifts: ['regional_admin'],
  notifications: ['system_admin', 'regional_admin'],
  onboarding: ['system_admin', 'regional_admin', 'pharmacy_admin'],
  settings: ['system_admin', 'regional_admin', 'pharmacy_admin'],
  more: ['system_admin', 'regional_admin', 'pharmacy_admin', 'night_pharmacist', 'pharmacy_staff'],
}

export function canAccess(role: UserRole | null | undefined, permission: PermissionKey) {
  if (!role) return false
  return permissionMatrix[permission].includes(role)
}
