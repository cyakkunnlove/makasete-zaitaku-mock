import type { UserRole, UserRoleAssignment } from '@/types/database'

export type UserRoleAssignmentWithNames = UserRoleAssignment & {
  region_name?: string | null
  pharmacy_name?: string | null
  operation_unit_name?: string | null
}

export type MockRoleContextView = {
  assignmentId: string
  role: UserRole
  regionId: string | null
  pharmacyId: string | null
  operationUnitId: string | null
  regionName: string | null
  pharmacyName: string | null
  operationUnitName: string | null
  isDefault: boolean
  isActive: boolean
}

export function getMockRoleContextLabel(context: Pick<MockRoleContextView, 'role' | 'regionName' | 'pharmacyName' | 'operationUnitName'>) {
  return [context.role, context.regionName, context.pharmacyName, context.operationUnitName].filter(Boolean).join(' / ')
}

function nowIso() {
  return new Date().toISOString()
}

export function getMockRoleAssignmentsByRole(role: UserRole): UserRoleAssignment[] {
  const timestamp = nowIso()

  const records: Record<UserRole, UserRoleAssignment[]> = {
    system_admin: [
      {
        id: 'assign-system-admin-main',
        user_id: 'mock-system-admin-001',
        organization_id: 'org-001',
        role: 'system_admin',
        region_id: null,
        pharmacy_id: null,
        operation_unit_id: null,
        is_default: true,
        is_active: true,
        granted_by: null,
        granted_at: timestamp,
        revoked_at: null,
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: 'assign-regional-admin-kanto',
        user_id: 'mock-system-admin-001',
        organization_id: 'org-001',
        role: 'regional_admin',
        region_id: 'region-001',
        pharmacy_id: null,
        operation_unit_id: null,
        is_default: false,
        is_active: true,
        granted_by: null,
        granted_at: timestamp,
        revoked_at: null,
        created_at: timestamp,
        updated_at: timestamp,
      },
    ],
    regional_admin: [
      {
        id: 'assign-regional-admin-kanto',
        user_id: 'mock-regional-admin-001',
        organization_id: 'org-001',
        role: 'regional_admin',
        region_id: 'region-001',
        pharmacy_id: null,
        operation_unit_id: null,
        is_default: true,
        is_active: true,
        granted_by: 'mock-system-admin-001',
        granted_at: timestamp,
        revoked_at: null,
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: 'assign-night-pharmacist-jonan',
        user_id: 'mock-regional-admin-001',
        organization_id: 'org-001',
        role: 'night_pharmacist',
        region_id: 'region-001',
        pharmacy_id: 'PH-01',
        operation_unit_id: 'ou-night-001',
        is_default: false,
        is_active: true,
        granted_by: 'mock-system-admin-001',
        granted_at: timestamp,
        revoked_at: null,
        created_at: timestamp,
        updated_at: timestamp,
      },
    ],
    pharmacy_admin: [
      {
        id: 'assign-pharmacy-admin-jonan',
        user_id: 'mock-pharm-admin-001',
        organization_id: 'org-001',
        role: 'pharmacy_admin',
        region_id: 'region-001',
        pharmacy_id: 'PH-01',
        operation_unit_id: null,
        is_default: true,
        is_active: true,
        granted_by: 'mock-regional-admin-001',
        granted_at: timestamp,
        revoked_at: null,
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: 'assign-night-pharmacist-jonan-admin',
        user_id: 'mock-pharm-admin-001',
        organization_id: 'org-001',
        role: 'night_pharmacist',
        region_id: 'region-001',
        pharmacy_id: 'PH-01',
        operation_unit_id: 'ou-night-001',
        is_default: false,
        is_active: true,
        granted_by: 'mock-regional-admin-001',
        granted_at: timestamp,
        revoked_at: null,
        created_at: timestamp,
        updated_at: timestamp,
      },
    ],
    pharmacy_staff: [
      {
        id: 'assign-pharmacy-staff-jonan',
        user_id: 'mock-pharm-staff-001',
        organization_id: 'org-001',
        role: 'pharmacy_staff',
        region_id: 'region-001',
        pharmacy_id: 'PH-01',
        operation_unit_id: null,
        is_default: true,
        is_active: true,
        granted_by: 'mock-pharm-admin-001',
        granted_at: timestamp,
        revoked_at: null,
        created_at: timestamp,
        updated_at: timestamp,
      },
    ],
    night_pharmacist: [
      {
        id: 'assign-night-pharmacist-main',
        user_id: 'mock-night-pharmacist-001',
        organization_id: 'org-001',
        role: 'night_pharmacist',
        region_id: 'region-001',
        pharmacy_id: 'PH-01',
        operation_unit_id: 'ou-night-001',
        is_default: true,
        is_active: true,
        granted_by: 'mock-regional-admin-001',
        granted_at: timestamp,
        revoked_at: null,
        created_at: timestamp,
        updated_at: timestamp,
      },
    ],
  }

  return records[role] ?? []
}

export function toMockRoleContextViews(assignments: UserRoleAssignment[]): MockRoleContextView[] {
  return assignments.map((assignment) => ({
    assignmentId: assignment.id,
    role: assignment.role,
    regionId: assignment.region_id,
    pharmacyId: assignment.pharmacy_id,
    operationUnitId: assignment.operation_unit_id,
    regionName: assignment.region_id === 'region-001' ? '関東リージョン' : null,
    pharmacyName: assignment.pharmacy_id === 'PH-01' ? '城南みらい薬局' : null,
    operationUnitName: assignment.operation_unit_id === 'ou-night-001' ? '夜間運用ユニットA' : null,
    isDefault: assignment.is_default,
    isActive: assignment.is_active,
  }))
}

export function toRoleContextViews(assignments: UserRoleAssignmentWithNames[]): MockRoleContextView[] {
  return assignments.map((assignment) => ({
    assignmentId: assignment.id,
    role: assignment.role,
    regionId: assignment.region_id,
    pharmacyId: assignment.pharmacy_id,
    operationUnitId: assignment.operation_unit_id,
    regionName: assignment.region_name ?? null,
    pharmacyName: assignment.pharmacy_name ?? null,
    operationUnitName: assignment.operation_unit_name ?? null,
    isDefault: assignment.is_default,
    isActive: assignment.is_active,
  }))
}

export function getMockActiveRoleContext(role: UserRole, assignmentId?: string | null): MockRoleContextView | null {
  const contexts = toMockRoleContextViews(getMockRoleAssignmentsByRole(role)).filter((item) => item.isActive)
  if (contexts.length === 0) return null
  if (assignmentId) {
    const matched = contexts.find((item) => item.assignmentId === assignmentId)
    if (matched) return matched
  }
  return contexts.find((item) => item.isDefault) ?? contexts[0] ?? null
}
