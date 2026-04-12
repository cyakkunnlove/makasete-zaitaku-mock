import type { Patient, PatientVisitRuleRow } from '@/types/database'
import type { PatientVisitRule } from '@/lib/patient-master'
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

export async function getPatientRegionId(patientId: string): Promise<string | null> {
  const mode = getRepositoryMode()

  if (mode.provider === 'supabase') {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('patients')
      .select('pharmacy:pharmacies(region_id)')
      .eq('id', patientId)
      .maybeSingle()

    if (error) throw error
    const row = data as Record<string, unknown> | null
    const pharmacy = row?.pharmacy as { region_id?: unknown } | null | undefined
    return typeof pharmacy?.region_id === 'string' ? pharmacy.region_id : null
  }

  return null
}

export async function listPatientVisitRules(patientId: string): Promise<PatientVisitRule[]> {
  const mode = getRepositoryMode()

  if (mode.provider === 'supabase') {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('patient_visit_rules')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return ((data ?? []) as PatientVisitRuleRow[]).map((rule) => ({
      id: rule.id,
      pattern: rule.pattern,
      weekday: rule.weekday,
      intervalWeeks: Number(rule.interval_weeks ?? 1),
      anchorWeek: rule.anchor_week === 1 || rule.anchor_week === 2 ? rule.anchor_week : null,
      preferredTime: rule.preferred_time ?? null,
      monthlyVisitLimit: Number(rule.monthly_visit_limit ?? 4),
      active: Boolean(rule.active),
      customDates: Array.isArray(rule.custom_dates) ? rule.custom_dates.map((value) => String(value)) : [],
      excludedDates: Array.isArray(rule.excluded_dates) ? rule.excluded_dates.map((value) => String(value)) : [],
    }))
  }

  return []
}
