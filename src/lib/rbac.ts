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
  | 'settings'
  | 'more'

export const permissionMatrix: Record<PermissionKey, UserRole[]> = {
  dashboard: ['system_admin', 'regional_admin', 'pharmacy_admin', 'day_pharmacist', 'night_pharmacist', 'pharmacy_staff'],
  requests: ['regional_admin', 'pharmacy_admin', 'day_pharmacist', 'pharmacy_staff'],
  requestDetail: ['regional_admin', 'pharmacy_admin', 'day_pharmacist', 'pharmacy_staff'],
  assign: ['regional_admin'],
  handovers: ['pharmacy_admin', 'day_pharmacist'],
  pharmacies: ['regional_admin', 'pharmacy_admin'],
  staff: ['regional_admin', 'pharmacy_admin'],
  patients: ['pharmacy_admin', 'day_pharmacist', 'pharmacy_staff'],
  billing: ['regional_admin', 'pharmacy_admin'],
  reports: ['regional_admin'],
  audit: ['system_admin'],
  shifts: ['regional_admin'],
  notifications: ['system_admin', 'regional_admin'],
  settings: ['system_admin', 'regional_admin', 'pharmacy_admin'],
  more: ['system_admin', 'regional_admin', 'pharmacy_admin', 'day_pharmacist', 'night_pharmacist', 'pharmacy_staff'],
}

export function canAccess(role: UserRole | null | undefined, permission: PermissionKey) {
  if (!role) return false
  return permissionMatrix[permission].includes(role)
}
