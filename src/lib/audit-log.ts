import type { CurrentUser } from '@/lib/auth'
import { getCurrentScope } from '@/lib/active-role'
import { getRepositoryMode } from '@/lib/repositories'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

export type AuditLogWriteResult =
  | { ok: true; skipped?: false }
  | { ok: true; skipped: true; reason: 'repository_not_supabase' }
  | { ok: false; error: string }

export async function writeAuditLog(input: {
  user: CurrentUser
  action: string
  targetType: string
  targetId?: string | null
  details?: Record<string, unknown> | null
}): Promise<AuditLogWriteResult> {
  const mode = getRepositoryMode()
  if (mode.provider !== 'supabase') return { ok: true, skipped: true, reason: 'repository_not_supabase' }

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
    return { ok: false, error: error.message }
  }

  return { ok: true }
}

export async function writeRequiredAuditLog(input: Parameters<typeof writeAuditLog>[0]) {
  const result = await writeAuditLog(input)
  if (!result.ok) {
    throw new Error(`audit_log_write_failed: ${result.error}`)
  }
  return result
}
