import { pharmacyData, type PatientRecord } from '@/lib/mock-data'

export const PATIENT_MASTER_STORAGE_KEY = 'makasete-patient-master:v1'

export type VisitRulePattern = 'weekly' | 'biweekly' | 'custom'

export interface PatientVisitRule {
  id: string
  pattern: VisitRulePattern
  weekday: number | null
  intervalWeeks: number
  anchorWeek: 1 | 2 | null
  preferredTime: string | null
  monthlyVisitLimit: number
  active: boolean
  customDates: string[]
  excludedDates: string[]
}

export interface PatientRegistrationMeta {
  source: 'mock_registration_form'
  createdAt: string
  createdById: string | null
  createdByName: string
  updatedAt: string
  updatedById: string | null
  updatedByName: string
  version: number
  manualSyncAt: string | null
}

export type RegisteredPatientRecord = PatientRecord & {
  startedAt?: string | null
  manualTags?: string[]
  derivedFlags?: string[]
  visitRules?: PatientVisitRule[]
  registrationMeta?: PatientRegistrationMeta
}

export interface PatientRegistrationDraft {
  name: string
  dob: string
  phone: string
  pharmacyId: string
  address: string
  startedAt: string
  status: RegisteredPatientRecord['status']
  manualTags: string[]
  emergencyContactName: string
  emergencyContactRelation: string
  emergencyContactPhone: string
  doctorName: string
  doctorClinic: string
  doctorPhone: string
  currentMeds: string
  medicalHistory: string
  allergies: string
  diseaseName: string
  visitNotes: string
  insuranceInfo: string
  preferredTime: string
  visitCount: number
  visitRules: PatientVisitRule[]
  manualSyncAt: string | null
}

function safeWindow(): Window | null {
  return typeof window === 'undefined' ? null : window
}

export function loadRegisteredPatients(): RegisteredPatientRecord[] {
  const win = safeWindow()
  if (!win) return []

  try {
    const raw = win.localStorage.getItem(PATIENT_MASTER_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RegisteredPatientRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveRegisteredPatients(patients: RegisteredPatientRecord[]) {
  const win = safeWindow()
  if (!win) return
  win.localStorage.setItem(PATIENT_MASTER_STORAGE_KEY, JSON.stringify(patients))
}

export function upsertRegisteredPatient(patient: RegisteredPatientRecord) {
  const current = loadRegisteredPatients()
  const next = [patient, ...current.filter((item) => item.id !== patient.id)]
  saveRegisteredPatients(next)
}

export function updateRegisteredPatient(
  patientId: string,
  updater: (patient: RegisteredPatientRecord) => RegisteredPatientRecord,
) {
  const current = loadRegisteredPatients()
  const next = current.map((patient) => (patient.id === patientId ? updater(patient) : patient))
  saveRegisteredPatients(next)
}

export function getPatientMasterRecords(registeredPatients: RegisteredPatientRecord[] = []): RegisteredPatientRecord[] {
  return [...registeredPatients]
}

export function getPatientsByPharmacyFromMaster(pharmacyId: string, registeredPatients: RegisteredPatientRecord[] = []) {
  return getPatientMasterRecords(registeredPatients).filter((patient) => patient.pharmacyId === pharmacyId)
}

export function generatePatientId(existingPatients: Pick<PatientRecord, 'id'>[]) {
  const numbers = existingPatients
    .map((patient) => patient.id.match(/^PT-(\d+)$/)?.[1])
    .filter((value): value is string => Boolean(value))
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))

  const next = (numbers.length > 0 ? Math.max(...numbers) : 0) + 1
  return `PT-${String(next).padStart(3, '0')}`
}

export function buildVisitRulesFromWeekdays(options: {
  weekdays: number[]
  monthlyVisitLimit: number
  preferredTime: string
}): PatientVisitRule[] {
  return options.weekdays.map((weekday, index) => ({
    id: `VRULE-${weekday}-${index + 1}`,
    pattern: 'weekly',
    weekday,
    intervalWeeks: 1,
    anchorWeek: null,
    preferredTime: options.preferredTime || null,
    monthlyVisitLimit: options.monthlyVisitLimit,
    active: true,
    customDates: [],
    excludedDates: [],
  }))
}

export function buildRegisteredPatientRecord(
  draft: PatientRegistrationDraft,
  actor: { id: string | null; name: string },
  existingPatients: Pick<PatientRecord, 'id'>[] = [],
): RegisteredPatientRecord {
  const now = new Date().toISOString()
  const pharmacy = pharmacyData.find((item) => item.id === draft.pharmacyId)

  return {
    id: generatePatientId(existingPatients),
    name: draft.name.trim(),
    dob: draft.dob || '未設定',
    address: draft.address.trim(),
    phone: draft.phone.trim() || null,
    pharmacyId: draft.pharmacyId,
    pharmacyName: pharmacy?.name ?? '未設定薬局',
    riskScore: Math.min(9, Math.max(1, draft.manualTags.length + (draft.visitRules.length > 1 ? 2 : 1))),
    emergencyContact: {
      name: draft.emergencyContactName.trim() || '未設定',
      relation: draft.emergencyContactRelation.trim() || '未設定',
      phone: draft.emergencyContactPhone.trim() || '-',
    },
    doctor: {
      name: draft.doctorName.trim() || '未設定',
      clinic: draft.doctorClinic.trim() || '未設定',
      phone: draft.doctorPhone.trim() || '-',
    },
    medicalHistory: draft.medicalHistory.trim() || '未設定',
    allergies: draft.allergies.trim() || 'なし',
    currentMeds: draft.currentMeds.trim() || '未設定',
    visitNotes: draft.visitNotes.trim() || '未設定',
    insuranceInfo: draft.insuranceInfo.trim() || '未設定',
    diseaseName: draft.diseaseName.trim() || '未設定',
    status: draft.status,
    startedAt: draft.startedAt || null,
    manualTags: draft.manualTags,
    derivedFlags: [],
    visitRules: draft.visitRules,
    registrationMeta: {
      source: 'mock_registration_form',
      createdAt: now,
      createdById: actor.id,
      createdByName: actor.name,
      updatedAt: now,
      updatedById: actor.id,
      updatedByName: actor.name,
      version: 1,
      manualSyncAt: draft.manualSyncAt,
    },
  }
}

export function formatVisitRuleSummary(patient: Pick<RegisteredPatientRecord, 'visitRules'>) {
  if (!patient.visitRules || patient.visitRules.length === 0) return '未設定'

  const weekdayLabel = ['日', '月', '火', '水', '木', '金', '土']
  const activeRules = patient.visitRules.filter((rule) => rule.active)
  if (activeRules.length === 0) return '停止中'

  return activeRules
    .map((rule) => {
      if (rule.pattern === 'custom') {
        return `カスタム ${rule.customDates.length}日`
      }
      const dayLabel = rule.weekday == null ? '曜日未設定' : `${weekdayLabel[rule.weekday]}曜`
      if (rule.pattern === 'biweekly') {
        const anchor = rule.anchorWeek === 2 ? '第2・4週' : '第1・3週'
        return `隔週 ${dayLabel} (${anchor})`
      }
      return `毎週 ${dayLabel}`
    })
    .join(' / ')
}

export function countVisitRuleTouches(patient: Pick<RegisteredPatientRecord, 'visitRules'>) {
  if (!patient.visitRules || patient.visitRules.length === 0) return 0
  return patient.visitRules.filter((rule) => rule.active).length
}
