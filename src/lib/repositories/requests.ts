import type { Request } from '@/types/database'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { getRepositoryMode } from '@/lib/repositories'

export async function listRequestsByPharmacy(pharmacyId: string): Promise<Request[]> {
  const mode = getRepositoryMode()

  if (mode.provider === 'supabase') {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .order('received_at', { ascending: false })

    if (error) throw error
    return data ?? []
  }

  return []
}

export async function listRequestsByRegion(regionId: string): Promise<Request[]> {
  const mode = getRepositoryMode()

  if (mode.provider === 'supabase') {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('region_id', regionId)
      .order('received_at', { ascending: false })

    if (error) throw error
    return data ?? []
  }

  return []
}
