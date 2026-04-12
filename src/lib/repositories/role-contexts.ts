import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { getRepositoryMode } from '@/lib/repositories'
import { toRoleContextViews, type MockRoleContextView, type UserRoleAssignmentWithNames } from '@/lib/mock-role-contexts'

function isMissingRelationError(error: unknown) {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string' &&
      (((error as { message: string }).message.includes('relation') && (error as { message: string }).message.includes('does not exist')) ||
        (error as { message: string }).message.includes('user_role_assignments')),
  )
}

export async function listRoleContextsForUser(userId: string): Promise<MockRoleContextView[]> {
  const mode = getRepositoryMode()
  if (mode.provider !== 'supabase') return []

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('user_role_assignments')
    .select(`
      id,
      user_id,
      organization_id,
      role,
      region_id,
      pharmacy_id,
      operation_unit_id,
      is_default,
      is_active,
      granted_by,
      granted_at,
      revoked_at,
      created_at,
      updated_at,
      region:regions(name),
      pharmacy:pharmacies(name),
      operation_unit:operation_units(name)
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .is('revoked_at', null)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    if (isMissingRelationError(error)) return []
    throw error
  }

  const rows = ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    user_id: String(row.user_id),
    organization_id: String(row.organization_id),
    role: row.role,
    region_id: typeof row.region_id === 'string' ? row.region_id : null,
    pharmacy_id: typeof row.pharmacy_id === 'string' ? row.pharmacy_id : null,
    operation_unit_id: typeof row.operation_unit_id === 'string' ? row.operation_unit_id : null,
    is_default: Boolean(row.is_default),
    is_active: Boolean(row.is_active),
    granted_by: typeof row.granted_by === 'string' ? row.granted_by : null,
    granted_at: String(row.granted_at),
    revoked_at: typeof row.revoked_at === 'string' ? row.revoked_at : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    region_name: typeof (row.region as { name?: unknown } | null)?.name === 'string' ? (row.region as { name: string }).name : null,
    pharmacy_name: typeof (row.pharmacy as { name?: unknown } | null)?.name === 'string' ? (row.pharmacy as { name: string }).name : null,
    operation_unit_name: typeof (row.operation_unit as { name?: unknown } | null)?.name === 'string' ? (row.operation_unit as { name: string }).name : null,
  })) as UserRoleAssignmentWithNames[]

  return toRoleContextViews(rows)
}

export async function getRoleContextForUser(userId: string, assignmentId: string): Promise<MockRoleContextView | null> {
  const contexts = await listRoleContextsForUser(userId)
  return contexts.find((item) => item.assignmentId === assignmentId) ?? null
}
