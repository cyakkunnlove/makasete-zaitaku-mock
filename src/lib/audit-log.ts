import type { CurrentUser } from '@/lib/auth'
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
  const payload = {
    organization_id: input.user.organization_id,
    pharmacy_id: input.user.pharmacy_id,
    region_id: input.user.region_id,
    operation_unit_id: input.user.operation_unit_id,
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
