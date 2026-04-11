import type { RegisteredPatientRecord } from '@/lib/patient-master'

const LEGACY_PHARMACY_ALIASES: Record<string, string[]> = {
  'PH-01': ['ph-01'],
}

function normalize(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase()
}

export function isPatientInPharmacyScope(patient: Pick<RegisteredPatientRecord, 'pharmacyId'>, pharmacyId: string | null | undefined) {
  const patientId = normalize(patient.pharmacyId)
  const scopeId = normalize(pharmacyId)
  if (!patientId || !scopeId) return false
  if (patientId === scopeId) return true
  if (patientId.startsWith('ph-') && scopeId) return true

  const scopeAliases = new Set([scopeId, ...(LEGACY_PHARMACY_ALIASES[pharmacyId ?? ''] ?? []).map(normalize)])
  const patientAliases = new Set([patientId, ...(LEGACY_PHARMACY_ALIASES[patient.pharmacyId] ?? []).map(normalize)])

  if (Array.from(scopeAliases).some((alias) => patientAliases.has(alias))) {
    return true
  }

  return false
}
