import type { AuditLog } from '@/types/database'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { getRepositoryMode } from '@/lib/repositories'

export async function listAuditLogsByRegion(regionId: string): Promise<AuditLog[]> {
  const mode = getRepositoryMode()

  if (mode.provider === 'supabase') {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('region_id', regionId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  }

  return []
}

export async function listAuditLogsByPharmacy(pharmacyId: string): Promise<AuditLog[]> {
  const mode = getRepositoryMode()

  if (mode.provider === 'supabase') {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  }

  return []
}
