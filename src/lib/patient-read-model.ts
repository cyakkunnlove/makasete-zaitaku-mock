import type { Patient } from '@/types/database'
import { patientData } from '@/lib/mock-data'
import type { PatientVisitRule, RegisteredPatientRecord } from '@/lib/patient-master'

type PatientSource = Patient | RegisteredPatientRecord

function isRegisteredPatientRecord(patient: PatientSource): patient is RegisteredPatientRecord {
  return 'name' in patient && 'visitRules' in patient
}

export function mapDatabasePatientToPatientRecord(
  patient: Patient,
  visitRules: PatientVisitRule[] = [],
  options?: { pharmacyName?: string | null },
): RegisteredPatientRecord {
  return {
    id: patient.id,
    name: patient.full_name,
    dob: patient.date_of_birth ?? '未設定',
    address: patient.address,
    phone: patient.phone,
    pharmacyId: patient.pharmacy_id ?? 'UNKNOWN',
    pharmacyName: options?.pharmacyName?.trim() || '未設定薬局',
    riskScore: patient.risk_score,
    emergencyContact: {
      name: patient.emergency_contact_name || '未設定',
      relation: patient.emergency_contact_relation || '未設定',
      phone: patient.emergency_contact_phone || '-',
    },
    doctor: {
      name: patient.doctor_name || '未設定',
      clinic: patient.doctor_clinic || '未設定',
      phone: patient.doctor_night_phone || '-',
    },
    medicalHistory: patient.medical_history || '未設定',
    allergies: patient.allergies || 'なし',
    currentMeds: patient.current_medications || '未設定',
    visitNotes: patient.visit_notes || '未設定',
    insuranceInfo: patient.insurance_info || '未設定',
    diseaseName: patient.disease_name || '未設定',
    status: patient.status === 'inactive' ? 'inactive' : 'active',
    startedAt: null,
    manualTags: [],
    derivedFlags: [],
    visitRules,
  }
}

function buildPatientFingerprint(patient: Pick<RegisteredPatientRecord, 'name' | 'dob' | 'address' | 'pharmacyId'>) {
  return [patient.name, patient.dob, patient.address, patient.pharmacyId].map((item) => (item ?? '').trim().toLowerCase()).join('::')
}

export function mergePatientSources(options: {
  databasePatients?: PatientSource[]
  registeredPatients?: RegisteredPatientRecord[]
  includeMockPatients?: boolean
}) {
  const merged = new Map<string, RegisteredPatientRecord>()
  const databaseFingerprints = new Set<string>()

  if (options.includeMockPatients) {
    patientData.forEach((patient) => {
      merged.set(patient.id, patient)
    })
  }

  ;(options.databasePatients ?? []).forEach((patient) => {
    const mapped = isRegisteredPatientRecord(patient)
      ? patient
      : mapDatabasePatientToPatientRecord(patient)
    merged.set(mapped.id, mapped)
    databaseFingerprints.add(buildPatientFingerprint(mapped))
  })

  ;(options.registeredPatients ?? []).forEach((patient) => {
    const fingerprint = buildPatientFingerprint(patient)
    if (databaseFingerprints.has(fingerprint)) {
      return
    }
    merged.set(patient.id, patient)
  })

  return Array.from(merged.values())
}

export function mergeSinglePatient(options: {
  databasePatient?: PatientSource | null
  registeredPatients?: RegisteredPatientRecord[]
  patientId: string
  includeMockPatients?: boolean
}) {
  const merged = mergePatientSources({
    databasePatients: options.databasePatient ? [options.databasePatient] : [],
    registeredPatients: options.registeredPatients,
    includeMockPatients: options.includeMockPatients,
  })

  return merged.find((patient) => patient.id === options.patientId) ?? null
}
