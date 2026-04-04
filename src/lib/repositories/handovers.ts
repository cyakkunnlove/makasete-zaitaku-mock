import type { Handover } from '@/types/database'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { getRepositoryMode } from '@/lib/repositories'

export async function listHandoversByPharmacy(pharmacyId: string): Promise<Handover[]> {
  const mode = getRepositoryMode()

  if (mode.provider === 'supabase') {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('handovers')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  }

  return []
}

export async function getHandoverById(handoverId: string): Promise<Handover | null> {
  const mode = getRepositoryMode()

  if (mode.provider === 'supabase') {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('handovers')
      .select('*')
      .eq('id', handoverId)
      .maybeSingle()

    if (error) throw error
    return data
  }

  return null
}
