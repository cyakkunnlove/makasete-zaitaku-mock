import type { Patient, PatientVisitRuleRow } from '@/types/database'
import type { PatientVisitRule } from '@/lib/patient-master'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { getRepositoryMode } from '@/lib/repositories'

function mapPatientVisitRuleRow(rule: PatientVisitRuleRow): PatientVisitRule {
  return {
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
  }
}

export async function listPatientsByPharmacy(input: { organizationId: string; pharmacyId: string }): Promise<Patient[]> {
  const mode = getRepositoryMode()

  if (mode.provider === 'supabase') {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('organization_id', input.organizationId)
      .eq('pharmacy_id', input.pharmacyId)
      .eq('status', 'active')
      .order('full_name', { ascending: true })

    if (error) throw error
    return data ?? []
  }

  return []
}

export async function listPatientsByIdsForPharmacy(input: { organizationId: string; pharmacyId: string; patientIds: string[] }): Promise<Patient[]> {
  const ids = Array.from(new Set(input.patientIds.map((id) => id.trim()).filter(Boolean)))
  if (ids.length === 0) return []

  const mode = getRepositoryMode()

  if (mode.provider === 'supabase') {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('organization_id', input.organizationId)
      .eq('pharmacy_id', input.pharmacyId)
      .eq('status', 'active')
      .in('id', ids)
      .order('full_name', { ascending: true })

    if (error) throw error
    return data ?? []
  }

  return []
}

export async function getPatientByIdForPharmacy(input: { organizationId: string; pharmacyId: string; patientId: string }): Promise<Patient | null> {
  const mode = getRepositoryMode()

  if (mode.provider === 'supabase') {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('organization_id', input.organizationId)
      .eq('pharmacy_id', input.pharmacyId)
      .eq('id', input.patientId)
      .maybeSingle()

    if (error) throw error
    return data
  }

  return null
}

export async function listPatientVisitRules(input: { organizationId: string; pharmacyId: string; patientId: string }): Promise<PatientVisitRule[]> {
  const mode = getRepositoryMode()

  if (mode.provider === 'supabase') {
    const supabase = createServerSupabaseClient()
    const patientResponse = await supabase
      .from('patients')
      .select('id')
      .eq('organization_id', input.organizationId)
      .eq('pharmacy_id', input.pharmacyId)
      .eq('id', input.patientId)
      .maybeSingle()

    if (patientResponse.error) throw patientResponse.error
    if (!patientResponse.data) return []

    const { data, error } = await supabase
      .from('patient_visit_rules')
      .select('*')
      .eq('patient_id', input.patientId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return ((data ?? []) as PatientVisitRuleRow[]).map(mapPatientVisitRuleRow)
  }

  return []
}

export async function listPatientVisitRulesByPatientIds(input: { patientIds: string[] }): Promise<Map<string, PatientVisitRule[]>> {
  const ids = Array.from(new Set(input.patientIds.map((id) => id.trim()).filter(Boolean)))
  const rulesByPatientId = new Map<string, PatientVisitRule[]>()
  ids.forEach((id) => rulesByPatientId.set(id, []))
  if (ids.length === 0) return rulesByPatientId

  const mode = getRepositoryMode()

  if (mode.provider === 'supabase') {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('patient_visit_rules')
      .select('*')
      .in('patient_id', ids)
      .order('created_at', { ascending: true })

    if (error) throw error

    ;((data ?? []) as PatientVisitRuleRow[]).forEach((rule) => {
      const patientId = rule.patient_id
      if (!patientId) return
      const current = rulesByPatientId.get(patientId) ?? []
      current.push(mapPatientVisitRuleRow(rule))
      rulesByPatientId.set(patientId, current)
    })
  }

  return rulesByPatientId
}
