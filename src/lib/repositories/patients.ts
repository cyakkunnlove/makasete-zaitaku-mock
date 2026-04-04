import type { Patient } from '@/types/database'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { getRepositoryMode } from '@/lib/repositories'

export async function listPatientsByPharmacy(pharmacyId: string): Promise<Patient[]> {
  const mode = getRepositoryMode()

  if (mode.provider === 'supabase') {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .order('full_name', { ascending: true })

    if (error) throw error
    return data ?? []
  }

  return []
}

export async function getPatientById(patientId: string): Promise<Patient | null> {
  const mode = getRepositoryMode()

  if (mode.provider === 'supabase') {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .maybeSingle()

    if (error) throw error
    return data
  }

  return null
}
