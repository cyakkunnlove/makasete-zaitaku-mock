import type { Patient } from '@/types/database'
import { patientData, pharmacyData } from '@/lib/mock-data'
import type { RegisteredPatientRecord } from '@/lib/patient-master'

export function mapDatabasePatientToPatientRecord(patient: Patient): RegisteredPatientRecord {
  const pharmacy = pharmacyData.find((item) => item.id === patient.pharmacy_id)

  return {
    id: patient.id,
    name: patient.full_name,
    dob: patient.date_of_birth ?? '未設定',
    address: patient.address,
    phone: patient.phone,
    pharmacyId: patient.pharmacy_id ?? 'UNKNOWN',
    pharmacyName: pharmacy?.name ?? '未設定薬局',
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
    visitRules: [],
  }
}

export function mergePatientSources(options: {
  databasePatients?: Patient[]
  registeredPatients?: RegisteredPatientRecord[]
}) {
  const merged = new Map<string, RegisteredPatientRecord>()

  patientData.forEach((patient) => {
    merged.set(patient.id, patient)
  })

  ;(options.databasePatients ?? []).forEach((patient) => {
    merged.set(patient.id, mapDatabasePatientToPatientRecord(patient))
  })

  ;(options.registeredPatients ?? []).forEach((patient) => {
    merged.set(patient.id, patient)
  })

  return Array.from(merged.values())
}

export function mergeSinglePatient(options: {
  databasePatient?: Patient | null
  registeredPatients?: RegisteredPatientRecord[]
  patientId: string
}) {
  const merged = mergePatientSources({
    databasePatients: options.databasePatient ? [options.databasePatient] : [],
    registeredPatients: options.registeredPatients,
  })

  return merged.find((patient) => patient.id === options.patientId) ?? null
}
