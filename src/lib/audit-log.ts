import type { CurrentUser } from '@/lib/auth'
import { getCurrentScope } from '@/lib/active-role'
import { getRepositoryMode } from '@/lib/repositories'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

export async function writeAuditLog(input: {
  user: CurrentUser
  action: string
  targetType: string
  targetId?: string | null
  details?: Record<string, unknown> | null
}) {
  const mode = getRepositoryMode()
  if (mode.provider !== 'supabase') return

  const supabase = createServerSupabaseClient()
  const scope = getCurrentScope(input.user)
  const payload = {
    organization_id: input.user.organization_id,
    pharmacy_id: scope.pharmacyId,
    region_id: scope.regionId,
    operation_unit_id: scope.operationUnitId,
    user_id: input.user.id,
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId ?? null,
    details: input.details ?? null,
    ip_address: null,
  }

  const { error } = await supabase.from('audit_logs').insert(payload as never)
  if (error) {
    console.error('Failed to write audit log:', error.message)
  }
}
