'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertTriangle, ChevronDown, ChevronLeft, ChevronRight, RotateCcw, Save, UserPlus } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { patientTagOptions, visitWeekdayOptions } from '@/lib/patient-registration-spec'
import { canManagePatients } from '@/lib/patient-permissions'
import { MOCK_FLOW_DATE } from '@/lib/day-flow'
import { type PatientVisitRule, type VisitRulePattern } from '@/lib/patient-master'
import {
  collectVisitRuleDates,
  formatVisitCalendarDateKey,
  formatVisitCalendarMonth,
  getVisitCalendarMonthDays,
  VISIT_CALENDAR_DAY_LABELS,
} from '@/lib/visit-calendar'

const weekdayMap: Record<(typeof visitWeekdayOptions)[number], number> = {
  '日': 0,
  '月': 1,
  '火': 2,
  '水': 3,
  '木': 4,
  '金': 5,
  '土': 6,
}

const patternOptions: Array<{ value: VisitRulePattern; label: string }> = [
  { value: 'weekly', label: '毎週' },
  { value: 'biweekly', label: '隔週' },
]

const relationOptions = [
  '配偶者',
  '夫',
  '妻',
  '長男',
  '長女',
  '次男',
  '次女',
  '子',
  '父',
  '母',
  '兄弟姉妹',
  'ケアマネ',
  '施設職員',
  'その他',
]

const diseaseOptions = [
  '高血圧',
  '糖尿病',
  '慢性心不全',
  'COPD',
  '認知症',
  '脳梗塞後',
  '慢性腎不全',
  'がん',
  '骨粗しょう症',
  'パーキンソン病',
  '関節リウマチ',
  '脂質異常症',
  '便秘症',
  '慢性疼痛',
]

const medicalHistoryOptions = [
  '脳梗塞',
  '心筋梗塞',
  '心不全',
  '肺炎',
  '骨折',
  '手術歴あり',
  '入退院歴あり',
  '転倒歴あり',
  'アレルギー歴あり',
  '認知症',
  '糖尿病',
  '腎機能低下',
]

type FormFieldKey =
  | 'name'
  | 'dob'
  | 'postalCode'
  | 'phone'
  | 'address'
  | 'startedAt'
  | 'firstVisitDate'
  | 'visitPlan'
  | 'preferredTime'
  | 'emergencyContactPhone'
  | 'doctorPhone'
  | 'billingExclusionReason'

type FormFieldErrors = Partial<Record<FormFieldKey, string>>

function normalizeFullWidthAscii(value: string) {
  return value.replace(/[！-～]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0)).replace(/　/g, ' ')
}

function normalizeDateInput(value: string) {
  const trimmed = normalizeFullWidthAscii(value).trim()
  if (!trimmed) return ''
  const digits = trimmed.replace(/[^0-9]/g, '')
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(trimmed)) return trimmed.replace(/\//g, '-')
  return trimmed
}

function isValidDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function getDateYearsAgo(years: number) {
  const date = new Date()
  date.setFullYear(date.getFullYear() - years)
  return formatVisitCalendarDateKey(date)
}

function normalizePostalCode(value: string) {
  return normalizeFullWidthAscii(value).replace(/[^0-9]/g, '').slice(0, 7)
}

function formatPostalCode(value: string) {
  const digits = normalizePostalCode(value)
  if (digits.length <= 3) return digits
  return `${digits.slice(0, 3)}-${digits.slice(3)}`
}

function normalizePhone(value: string) {
  return normalizeFullWidthAscii(value).replace(/[^0-9]/g, '').slice(0, 11)
}

function formatPhone(value: string) {
  const digits = normalizePhone(value)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  if (digits.length === 10) return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

function normalizeVisitCount(value: string) {
  const digits = normalizeFullWidthAscii(value).replace(/[^0-9]/g, '').slice(0, 2)
  if (!digits) return ''
  return String(Math.max(1, Number(digits)))
}

function isValidPhone(value: string) {
  const digits = normalizePhone(value)
  return !digits || digits.length === 10 || digits.length === 11
}

function composeSelectionText(selected: string[], note: string) {
  const parts = [...selected]
  const trimmedNote = note.trim()
  if (trimmedNote) parts.push(`備考: ${trimmedNote}`)
  return parts.join('、')
}

function RequiredLabel({ children }: { children: ReactNode }) {
  return (
    <Label className="text-slate-700">
      {children}
      <span className="ml-1 text-rose-300">*</span>
    </Label>
  )
}

function FieldErrorText({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-[11px] font-medium text-rose-600">{message}</p>
}

type GeocodePreview = {
  inputAddress: string
  normalizedAddress: string | null
  latitude: number | null
  longitude: number | null
  warnings: Array<{ code: string; message: string }>
}

type MedicalInstitutionOption = {
  id: string
  name: string
  phone: string
  address: string
  doctorCount: number
}

type DoctorOption = {
  id: string
  medicalInstitutionId: string | null
  fullName: string
  department: string
  phone: string
}

export default function NewPatientPage() {
  const router = useRouter()
  const { user, role } = useAuth()
  const [visitCount, setVisitCount] = useState('4')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [selectedDiseases, setSelectedDiseases] = useState<string[]>([])
  const [selectedMedicalHistories, setSelectedMedicalHistories] = useState<string[]>([])
  const [visitPattern, setVisitPattern] = useState<VisitRulePattern>('weekly')
  const [biweeklyAnchorWeek, setBiweeklyAnchorWeek] = useState<1 | 2>(1)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({})
  const [warningMessage, setWarningMessage] = useState<string | null>(null)
  const [showOptional, setShowOptional] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customDates, setCustomDates] = useState<string[]>([])
  const [excludedDates, setExcludedDates] = useState<string[]>([])
  const [geocodeConfirmOpen, setGeocodeConfirmOpen] = useState(false)
  const [geocodePreview, setGeocodePreview] = useState<GeocodePreview | null>(null)
  const [postalLookupLoading, setPostalLookupLoading] = useState(false)
  const [postalLookupMessage, setPostalLookupMessage] = useState<string | null>(null)
  const [medicalInstitutionOptions, setMedicalInstitutionOptions] = useState<MedicalInstitutionOption[]>([])
  const [medicalInstitutionLoading, setMedicalInstitutionLoading] = useState(false)
  const [doctorOptions, setDoctorOptions] = useState<DoctorOption[]>([])
  const [doctorLoading, setDoctorLoading] = useState(false)
  const [selectedMedicalInstitutionId, setSelectedMedicalInstitutionId] = useState<string | null>(null)
  const [selectedDoctorMasterId, setSelectedDoctorMasterId] = useState<string | null>(null)
  const [institutionDialogOpen, setInstitutionDialogOpen] = useState(false)
  const [doctorDialogOpen, setDoctorDialogOpen] = useState(false)
  const [institutionSubmitting, setInstitutionSubmitting] = useState(false)
  const [doctorSubmitting, setDoctorSubmitting] = useState(false)
  const [editingInstitutionId, setEditingInstitutionId] = useState<string | null>(null)
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null)
  const [institutionForm, setInstitutionForm] = useState({ name: '', phone: '', address: '' })
  const [doctorForm, setDoctorForm] = useState({ fullName: '', phone: '', department: '' })
  const [form, setForm] = useState({
    name: '',
    dob: getDateYearsAgo(70),
    postalCode: '',
    phone: '',
    address: '',
    startedAt: MOCK_FLOW_DATE,
    firstVisitDate: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',
    doctorName: '',
    doctorClinic: '',
    doctorPhone: '',
    currentMeds: '',
    medicalHistory: '',
    allergies: '',
    diseaseName: '',
    preferredTime: '10:00',
    preferredTimeUnspecified: 'false',
    visitNotes: '',
    insuranceInfo: '',
    isBillable: true,
    billingExclusionReason: '',
  })

  const isExceeded = Number(visitCount) > 4
  const canEditPatients = canManagePatients(role)
  const previewBaseDate = useMemo(() => new Date(`${form.startedAt || MOCK_FLOW_DATE}T00:00:00`), [form.startedAt])
  const [previewYear, setPreviewYear] = useState(previewBaseDate.getFullYear())
  const [previewMonth, setPreviewMonth] = useState(previewBaseDate.getMonth())
  const inputClass = (field: FormFieldKey, extra = '') => `mt-1 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 ${fieldErrors[field] ? 'border-rose-300 bg-rose-50 ring-1 ring-rose-100' : ''} ${extra}`

  const effectiveCustomDates = useMemo(() => {
    const merged = new Set(customDates)
    const normalizedFirstVisitDate = normalizeDateInput(form.firstVisitDate)
    if (normalizedFirstVisitDate) merged.add(normalizedFirstVisitDate)
    return Array.from(merged).sort()
  }, [customDates, form.firstVisitDate])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag])
  }

  const toggleDay = (day: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next.visitPlan
      return next
    })
    setSelectedDays((prev) => prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day])
  }

  const toggleDisease = (disease: string) => {
    setSelectedDiseases((prev) => prev.includes(disease) ? prev.filter((item) => item !== disease) : [...prev, disease])
  }

  const toggleMedicalHistory = (history: string) => {
    setSelectedMedicalHistories((prev) => prev.includes(history) ? prev.filter((item) => item !== history) : [...prev, history])
  }

  const previewVisitRules = useMemo<PatientVisitRule[]>(() => {
    const baseRules: PatientVisitRule[] = selectedDays.map((day, index) => ({
      id: `preview-rule-${weekdayMap[day as keyof typeof weekdayMap]}-${index + 1}`,
      pattern: visitPattern,
      weekday: weekdayMap[day as keyof typeof weekdayMap],
      intervalWeeks: visitPattern === 'biweekly' ? 2 : 1,
      anchorWeek: visitPattern === 'biweekly' ? biweeklyAnchorWeek : null,
      preferredTime: form.preferredTimeUnspecified === 'true' ? null : form.preferredTime || null,
      monthlyVisitLimit: Math.max(1, Number(visitCount) || 4),
      active: true,
      customDates: [],
      excludedDates,
    }))

    if (effectiveCustomDates.length > 0) {
      baseRules.push({
        id: 'preview-rule-custom-dates',
        pattern: 'custom',
        weekday: null,
        intervalWeeks: 1,
        anchorWeek: null,
        preferredTime: form.preferredTimeUnspecified === 'true' ? null : form.preferredTime || null,
        monthlyVisitLimit: Math.max(1, Number(visitCount) || 4),
        active: true,
        customDates: effectiveCustomDates,
        excludedDates: [],
      })
    }

    return baseRules
  }, [biweeklyAnchorWeek, effectiveCustomDates, excludedDates, form.preferredTime, form.preferredTimeUnspecified, selectedDays, visitCount, visitPattern])

  const calendarPreview = useMemo(() => {
    const { firstDay, daysInMonth } = getVisitCalendarMonthDays(previewYear, previewMonth)
    const { scheduled, custom, excluded } = collectVisitRuleDates(previewVisitRules, previewYear, previewMonth)
    const todayKey = formatVisitCalendarDateKey(new Date())

    return {
      firstDay,
      daysInMonth,
      scheduled,
      custom,
      excluded,
      todayKey,
    }
  }, [previewMonth, previewVisitRules, previewYear])

  const handleChange = (key: keyof typeof form, value: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[key as FormFieldKey]
      if (key === 'firstVisitDate') delete next.visitPlan
      return next
    })

    if (key === 'isBillable') {
      setForm((prev) => ({
        ...prev,
        isBillable: value === 'true',
        billingExclusionReason: value === 'true' ? '' : prev.billingExclusionReason,
      }))
      return
    }

    let nextValue = value

    if (key === 'dob' || key === 'firstVisitDate' || key === 'startedAt') {
      nextValue = normalizeDateInput(value)
    }

    if (key === 'postalCode') {
      nextValue = normalizePostalCode(value)
      setPostalLookupMessage(null)
    }

    if (key === 'phone' || key === 'emergencyContactPhone' || key === 'doctorPhone') {
      nextValue = normalizePhone(value)
    }

    if (key === 'preferredTime') {
      nextValue = normalizeFullWidthAscii(value).replace(/[^\d:]/g, '').slice(0, 5)
    }

    if (key === 'preferredTimeUnspecified') {
      setForm((prev) => ({ ...prev, preferredTimeUnspecified: value, preferredTime: value === 'true' ? '' : prev.preferredTime || '10:00' }))
      return
    }

    setForm((prev) => ({ ...prev, [key]: nextValue }))

    if (key === 'doctorClinic') {
      setSelectedMedicalInstitutionId(null)
      setSelectedDoctorMasterId(null)
      setDoctorOptions([])
      void searchMedicalInstitutions(nextValue)
    }

    if (key === 'doctorName') {
      setSelectedDoctorMasterId(null)
      if (selectedMedicalInstitutionId) {
        void searchDoctors(selectedMedicalInstitutionId, nextValue)
      }
    }

    if (key === 'postalCode') {
      const digits = nextValue.replace(/[^0-9]/g, '')
      if (digits.length === 7) {
        void lookupPostalCode(digits)
      }
    }

    if (key === 'startedAt') {
      const nextDate = new Date(`${value || MOCK_FLOW_DATE}T00:00:00`)
      if (!Number.isNaN(nextDate.getTime())) {
        setPreviewYear(nextDate.getFullYear())
        setPreviewMonth(nextDate.getMonth())
      }
    }
  }

  const showPreviousPreviewMonth = () => {
    if (previewMonth === 0) {
      setPreviewYear((prev) => prev - 1)
      setPreviewMonth(11)
      return
    }
    setPreviewMonth((prev) => prev - 1)
  }

  const showNextPreviewMonth = () => {
    if (previewMonth === 11) {
      setPreviewYear((prev) => prev + 1)
      setPreviewMonth(0)
      return
    }
    setPreviewMonth((prev) => prev + 1)
  }

  const resetCalendarEdits = () => {
    setCustomDates([])
    setExcludedDates([])
  }

  const toggleCalendarDate = (dateKey: string) => {
    const isCustom = effectiveCustomDates.includes(dateKey)
    const isExcluded = excludedDates.includes(dateKey)
    const isScheduled = calendarPreview.scheduled.has(dateKey)
    const normalizedFirstVisitDate = normalizeDateInput(form.firstVisitDate)

    if (isCustom) {
      if (normalizedFirstVisitDate === dateKey) {
        setForm((prev) => ({ ...prev, firstVisitDate: '' }))
      } else {
        setCustomDates((prev) => prev.filter((item) => item !== dateKey))
      }
      return
    }

    if (isExcluded) {
      setExcludedDates((prev) => prev.filter((item) => item !== dateKey))
      return
    }

    if (isScheduled) {
      setExcludedDates((prev) => [...prev, dateKey])
      return
    }

    setCustomDates((prev) => [...prev, dateKey].sort())
  }

  const searchMedicalInstitutions = async (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) {
      setMedicalInstitutionOptions([])
      return
    }

    setMedicalInstitutionLoading(true)
    try {
      const response = await fetch(`/api/medical-institutions?q=${encodeURIComponent(trimmed)}`, { cache: 'no-store' })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.ok || !Array.isArray(result.medicalInstitutions)) {
        setMedicalInstitutionOptions([])
        return
      }
      setMedicalInstitutionOptions(result.medicalInstitutions)
    } finally {
      setMedicalInstitutionLoading(false)
    }
  }

  const searchDoctors = async (medicalInstitutionId: string, query?: string) => {
    if (!medicalInstitutionId) {
      setDoctorOptions([])
      return
    }

    setDoctorLoading(true)
    try {
      const suffix = query?.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''
      const response = await fetch(`/api/medical-institutions/${medicalInstitutionId}/doctors${suffix}`, { cache: 'no-store' })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.ok || !Array.isArray(result.doctors)) {
        setDoctorOptions([])
        return
      }
      setDoctorOptions(result.doctors)
    } finally {
      setDoctorLoading(false)
    }
  }

  const saveMedicalInstitution = async () => {
    const name = institutionForm.name.trim() || form.doctorClinic.trim()
    if (!name) {
      setWarningMessage('病院名を入力してください。')
      return
    }

    setInstitutionSubmitting(true)
    try {
      const response = await fetch(editingInstitutionId ? `/api/medical-institutions/${editingInstitutionId}` : '/api/medical-institutions', {
        method: editingInstitutionId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone: institutionForm.phone,
          address: institutionForm.address,
        }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.ok || !result.medicalInstitution) {
        setWarningMessage(editingInstitutionId ? '病院の更新に失敗しました。' : '病院の追加に失敗しました。')
        return
      }

      const created = result.medicalInstitution as MedicalInstitutionOption
      setSelectedMedicalInstitutionId(created.id)
      setSelectedDoctorMasterId(null)
      setForm((prev) => ({ ...prev, doctorClinic: created.name }))
      setMedicalInstitutionOptions((prev) => [created, ...prev.filter((item) => item.id !== created.id)])
      setInstitutionDialogOpen(false)
      setEditingInstitutionId(null)
      setInstitutionForm({ name: '', phone: '', address: '' })
      setWarningMessage(null)
      await searchDoctors(created.id)
    } finally {
      setInstitutionSubmitting(false)
    }
  }

  const archiveMedicalInstitution = async () => {
    if (!selectedMedicalInstitutionId) return
    if (!window.confirm('この病院を候補一覧から外しますか？ 既存患者の表示は残ります。')) return

    const response = await fetch(`/api/medical-institutions/${selectedMedicalInstitutionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    })
    const result = await response.json().catch(() => null)
    if (!response.ok || !result?.ok) {
      setWarningMessage('病院の非表示に失敗しました。')
      return
    }
    setSelectedMedicalInstitutionId(null)
    setSelectedDoctorMasterId(null)
    setDoctorOptions([])
    setMedicalInstitutionOptions((prev) => prev.filter((item) => item.id !== selectedMedicalInstitutionId))
    setWarningMessage('病院候補から外しました。')
  }

  const archiveDoctor = async () => {
    if (!selectedDoctorMasterId) return
    if (!window.confirm('この医師を候補一覧から外しますか？ 既存患者の表示は残ります。')) return

    const response = await fetch(`/api/doctor-masters/${selectedDoctorMasterId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    })
    const result = await response.json().catch(() => null)
    if (!response.ok || !result?.ok) {
      setWarningMessage('医師の非表示に失敗しました。')
      return
    }
    setSelectedDoctorMasterId(null)
    setDoctorOptions((prev) => prev.filter((item) => item.id !== selectedDoctorMasterId))
    setWarningMessage('医師候補から外しました。')
  }

  const saveDoctor = async () => {
    if (!selectedMedicalInstitutionId) {
      setWarningMessage('先に病院を選択してください。')
      return
    }

    const fullName = doctorForm.fullName.trim() || form.doctorName.trim()
    if (!fullName) {
      setWarningMessage('医師名を入力してください。')
      return
    }

    setDoctorSubmitting(true)
    try {
      const response = await fetch(editingDoctorId ? `/api/doctor-masters/${editingDoctorId}` : `/api/medical-institutions/${selectedMedicalInstitutionId}/doctors`, {
        method: editingDoctorId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone: doctorForm.phone,
          department: doctorForm.department,
        }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.ok || !result.doctor) {
        setWarningMessage(editingDoctorId ? '医師の更新に失敗しました。' : '医師の追加に失敗しました。')
        return
      }

      const created = result.doctor as DoctorOption
      setSelectedDoctorMasterId(created.id)
      setForm((prev) => ({ ...prev, doctorName: created.fullName, doctorPhone: normalizePhone(created.phone) }))
      setDoctorOptions((prev) => [created, ...prev.filter((item) => item.id !== created.id)])
      setDoctorDialogOpen(false)
      setEditingDoctorId(null)
      setDoctorForm({ fullName: '', phone: '', department: '' })
      setWarningMessage(null)
    } finally {
      setDoctorSubmitting(false)
    }
  }

  const lookupPostalCode = async (postalCode: string) => {
    const normalized = normalizePostalCode(postalCode)
    if (normalized.length !== 7) return

    setPostalLookupLoading(true)
    try {
      const response = await fetch(`/api/postal-code?code=${normalized}`, { cache: 'no-store' })
      const result = await response.json().catch(() => null)

      if (!response.ok || !result?.ok) {
        setPostalLookupMessage('郵便番号から住所を取得できませんでした。住所を直接入力してください。')
        return
      }

      if (!result.found || !result.address?.full) {
        setPostalLookupMessage('該当する住所が見つかりませんでした。住所を直接入力してください。')
        return
      }

      setForm((prev) => (prev.address.trim() ? prev : { ...prev, address: result.address.full }))
      setPostalLookupMessage(`住所候補を確認しました: ${result.address.full}`)
    } finally {
      setPostalLookupLoading(false)
    }
  }

  const fetchGeocodePreview = async (address: string) => {
    const response = await fetch('/api/patients/geocode-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    })
    const result = await response.json().catch(() => null)
    if (!response.ok || !result?.ok || !result?.preview) {
      throw new Error('住所確認に失敗しました')
    }
    return result.preview as GeocodePreview
  }

  const shouldConfirmGeocode = (preview: GeocodePreview) => {
    const normalized = preview.normalizedAddress?.trim() ?? ''
    const input = preview.inputAddress.trim()
    return preview.warnings.length > 0 || (normalized && normalized !== input)
  }

  const validateForm = () => {
    const errors: FormFieldErrors = {}
    const normalizedDob = normalizeDateInput(form.dob)
    const normalizedStartedAt = normalizeDateInput(form.startedAt)
    const normalizedFirstVisitDate = normalizeDateInput(form.firstVisitDate)
    const postalCode = normalizePostalCode(form.postalCode)

    if (!form.name.trim()) errors.name = '氏名は必須です。患者を識別できる姓名を入力してください。'
    if (!normalizedDob) {
      errors.dob = '生年月日は必須です。カレンダーで選ぶか、8桁で入力してください。'
    } else if (!isValidDateInput(normalizedDob)) {
      errors.dob = '存在する日付を入力してください。例: 1950-04-12'
    }
    if (postalCode && postalCode.length !== 7) errors.postalCode = '郵便番号は7桁で入力してください。全角数字やハイフン付きでも構いません。'
    if (!isValidPhone(form.phone)) errors.phone = '電話番号は10桁または11桁で入力してください。全角数字やハイフン付きでも構いません。'
    if (!form.address.trim()) errors.address = '住所は必須です。郵便番号補完後、番地・建物名まで確認してください。'
    if (normalizedStartedAt && !isValidDateInput(normalizedStartedAt)) errors.startedAt = '利用開始日は存在する日付を選んでください。'
    if (normalizedFirstVisitDate && !isValidDateInput(normalizedFirstVisitDate)) errors.firstVisitDate = '初回訪問予定日は存在する日付を選んでください。'
    if (!normalizedFirstVisitDate && selectedDays.length === 0) errors.visitPlan = '初回訪問予定日または訪問曜日のどちらかを入力してください。'
    if (form.preferredTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(form.preferredTime)) errors.preferredTime = '希望時間は 10:00 のように24時間表記で入力してください。'
    if (!isValidPhone(form.emergencyContactPhone)) errors.emergencyContactPhone = '緊急連絡先電話は10桁または11桁で入力してください。'
    if (!isValidPhone(form.doctorPhone)) errors.doctorPhone = '医師電話は10桁または11桁で入力してください。'
    if (!form.isBillable && !form.billingExclusionReason.trim()) errors.billingExclusionReason = '請求対象外にする場合は理由を入力してください。'

    return errors
  }

  const focusFirstError = (errors: FormFieldErrors) => {
    const firstKey = Object.keys(errors)[0]
    if (!firstKey) return
    window.setTimeout(() => {
      document.querySelector(`[data-field="${firstKey}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }

  const handleSave = async (skipGeocodeConfirmation = false) => {
    if (isSubmitting) return

    setErrorMessage(null)
    setWarningMessage(null)
    setFieldErrors({})

    if (!canEditPatients) {
      setErrorMessage('このロールでは患者登録はできません。')
      return
    }

    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      setErrorMessage('未入力または形式が正しくない項目があります。赤く表示された項目を確認してください。')
      focusFirstError(validationErrors)
      return
    }
    const normalizedDob = normalizeDateInput(form.dob)
    const normalizedStartedAt = normalizeDateInput(form.startedAt)
    const normalizedFirstVisitDate = normalizeDateInput(form.firstVisitDate)
    const diseaseName = composeSelectionText(selectedDiseases, form.diseaseName)
    const medicalHistory = composeSelectionText(selectedMedicalHistories, form.medicalHistory)

    const requestPayload = {
      basic: {
        fullName: form.name,
        birthDate: normalizedDob,
        postalCode: normalizePostalCode(form.postalCode),
        addressLine1: form.address,
        phone: form.phone,
        serviceStartDate: normalizedStartedAt,
        visitNotes: form.visitNotes,
        emergencyContactName: form.emergencyContactName,
        emergencyContactRelation: form.emergencyContactRelation,
        emergencyContactPhone: form.emergencyContactPhone,
      },
      visitPlan: {
        firstVisitDate: normalizedFirstVisitDate,
        monthlyVisitCount: Math.max(1, Number(visitCount) || 4),
        visitWeekdays: selectedDays.map((day) => weekdayMap[day as keyof typeof weekdayMap]),
        preferredTime: form.preferredTimeUnspecified === 'true' ? null : form.preferredTime || null,
        visitRules: previewVisitRules,
      },
      medical: {
        medicalInstitutionId: selectedMedicalInstitutionId,
        doctorMasterId: selectedDoctorMasterId,
        doctorName: form.doctorName,
        doctorClinic: form.doctorClinic,
        doctorPhone: form.doctorPhone,
        currentMeds: form.currentMeds,
        medicalHistory,
        allergies: form.allergies,
        diseaseName,
        insuranceInfo: form.insuranceInfo,
      },
      billing: {
        isBillable: form.isBillable,
        billingExclusionReason: form.isBillable ? '' : form.billingExclusionReason,
      },
    }

    if (!skipGeocodeConfirmation) {
      try {
        const preview = await fetchGeocodePreview(form.address)
        if (shouldConfirmGeocode(preview)) {
          setGeocodePreview(preview)
          setGeocodeConfirmOpen(true)
          return
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '住所確認に失敗しました。')
        return
      }
    }

    setIsSubmitting(true)

    try {
      const createResponse = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      })

      const createResult = await createResponse.json().catch(() => null)
      if (!createResponse.ok || !createResult?.ok) {
        if (createResult?.error === 'duplicate_patient') {
          setFieldErrors({
            name: '同じ薬局に同一氏名・同一生年月日の患者が既に登録されています。',
            dob: '既存患者と同じ生年月日です。患者一覧で既存登録を確認してください。',
          })
        }
        if (createResult?.error === 'missing_required_fields') {
          setFieldErrors({
            name: '氏名・生年月日・住所のいずれかが不足しています。',
            dob: '生年月日を確認してください。',
            address: '住所を確認してください。',
          })
        }
        if (createResult?.error === 'visit_plan_required') {
          setFieldErrors({ visitPlan: '初回訪問予定日または訪問曜日のどちらかが必要です。' })
        }
        setErrorMessage(
          createResult?.error === 'forbidden'
            ? 'このロールでは患者登録できません。'
            : createResult?.error === 'duplicate_patient'
              ? '同じ薬局に同一氏名・同一生年月日の患者が既に登録されています。既存患者を確認してください。'
              : '患者登録に失敗しました。',
        )
        return
      }

      const createdPatientId = typeof createResult?.patient?.id === 'string' ? createResult.patient.id : null

      const apiWarnings = Array.isArray(createResult?.warnings) ? createResult.warnings : []
      if (apiWarnings.length > 0) {
        setWarningMessage(apiWarnings.map((warning: { message: string }) => warning.message).join(' '))
      } else if (!form.phone.trim()) {
        setWarningMessage('連絡先電話が未設定のため、患者詳細で警告表示されます。')
      }

      if (!createdPatientId) {
        setErrorMessage('患者登録はDB保存が完了した場合だけ成立します。登録結果を確認できませんでした。')
        return
      }

      setGeocodeConfirmOpen(false)
      setGeocodePreview(null)
      router.push(`/dashboard/patients/${createdPatientId}?created=1`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!canEditPatients) {
    return (
      <div className="space-y-4 text-slate-900">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-900"><UserPlus className="h-5 w-5 text-indigo-500" />患者登録</h1>
          <p className="text-xs text-slate-500">患者登録は自局の薬局スタッフ・薬局管理者のみが行えます。</p>
        </div>
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6 text-sm text-slate-600">
            現在のロールでは患者登録はできません。患者検索または患者詳細の閲覧をご利用ください。
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 text-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-900"><UserPlus className="h-5 w-5 text-indigo-500" />患者登録</h1>
          <p className="text-xs text-slate-500">まずは必要最小限で登録できます。細かい情報はあとから落ち着いて追加できます。</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm">
          登録先: <span className="font-medium text-slate-900">現在の所属先</span>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertTriangle className="h-4 w-4 text-rose-500" />
          {errorMessage}
        </div>
      )}

      {warningMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          {warningMessage}
        </div>
      )}

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-900">基本情報</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <RequiredLabel>氏名</RequiredLabel>
            <Input data-field="name" value={form.name} onChange={(e) => handleChange('name', e.target.value)} className={inputClass('name')} placeholder="山田 花子" />
            <FieldErrorText message={fieldErrors.name} />
          </div>
          <div>
            <RequiredLabel>生年月日</RequiredLabel>
            <Input data-field="dob" type="date" value={form.dob} onChange={(e) => handleChange('dob', e.target.value)} className={inputClass('dob')} />
            <p className="mt-1 text-[11px] text-slate-500">カレンダーで選べます。直接入力する場合は 1950-04-12 の形式です。</p>
            <FieldErrorText message={fieldErrors.dob} />
          </div>
          <div>
            <Label className="text-slate-600">郵便番号</Label>
            <div className="mt-1 flex gap-2">
              <Input data-field="postalCode" value={formatPostalCode(form.postalCode)} onChange={(e) => handleChange('postalCode', e.target.value)} onBlur={() => { if (normalizePostalCode(form.postalCode).length === 7) void lookupPostalCode(form.postalCode) }} className={inputClass('postalCode', 'mt-0')} placeholder="192-0012" inputMode="numeric" />
              <Button type="button" variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50" disabled={postalLookupLoading || normalizePostalCode(form.postalCode).length !== 7} onClick={() => void lookupPostalCode(form.postalCode)}>
                再取得
              </Button>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">{postalLookupLoading ? '郵便番号から住所を確認中です...' : postalLookupMessage ?? '7桁入力すると住所を補完します。番地以降は必要に応じて追記してください。'}</p>
            <FieldErrorText message={fieldErrors.postalCode} />
          </div>
          <div>
            <Label className="text-slate-600">連絡先電話</Label>
            <Input data-field="phone" value={formatPhone(form.phone)} onChange={(e) => handleChange('phone', e.target.value)} className={inputClass('phone')} placeholder="090-1234-5678" inputMode="tel" />
            <p className="mt-1 text-[11px] text-slate-500">全角数字・ハイフン付きでも自動で整えます。</p>
            <FieldErrorText message={fieldErrors.phone} />
          </div>
          <div className="md:col-span-2">
            <RequiredLabel>住所</RequiredLabel>
            <Input data-field="address" value={form.address} onChange={(e) => handleChange('address', e.target.value)} className={inputClass('address')} placeholder="東京都八王子市..." />
            <FieldErrorText message={fieldErrors.address} />
          </div>
          <div>
            <Label className="text-slate-600">利用開始日</Label>
            <Input data-field="startedAt" type="date" value={form.startedAt} onChange={(e) => handleChange('startedAt', e.target.value)} className={inputClass('startedAt')} />
            <FieldErrorText message={fieldErrors.startedAt} />
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            <p className="font-medium text-slate-900">登録ルール</p>
            <p className="mt-1">氏名、生年月日、住所に加えて、初回訪問予定日または訪問曜日が入っていれば登録できます。状態と所属先は自動で設定します。</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:col-span-2">
            <p className="text-sm font-semibold text-slate-900">請求設定</p>
            <p className="mt-1 text-xs text-slate-500">対応完了後に回収管理へ上げるかどうかを設定します。</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => handleChange('isBillable', 'true')}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition ${form.isBillable ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                請求対象
              </button>
              <button
                type="button"
                onClick={() => handleChange('isBillable', 'false')}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition ${!form.isBillable ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                請求対象外
              </button>
            </div>
            {!form.isBillable ? (
              <div className="mt-3">
                <Label className="text-slate-700">対象外理由</Label>
                <Input
                  data-field="billingExclusionReason"
                  value={form.billingExclusionReason}
                  onChange={(e) => handleChange('billingExclusionReason', e.target.value)}
                  placeholder="保険上対象外、施設契約内など"
                  className={inputClass('billingExclusionReason')}
                />
                <FieldErrorText message={fieldErrors.billingExclusionReason} />
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-900">訪問条件</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <Label className="text-slate-700">初回訪問予定日</Label>
              <Input data-field="firstVisitDate" type="date" value={form.firstVisitDate} onChange={(e) => handleChange('firstVisitDate', e.target.value)} className={inputClass('firstVisitDate')} />
              <FieldErrorText message={fieldErrors.firstVisitDate} />
            </div>
            <div>
              <Label className="text-slate-700">訪問パターン</Label>
              <select value={visitPattern} onChange={(e) => setVisitPattern(e.target.value as VisitRulePattern)} className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900">
                {patternOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-slate-700">隔週アンカー</Label>
              <select value={String(biweeklyAnchorWeek)} onChange={(e) => setBiweeklyAnchorWeek(Number(e.target.value) as 1 | 2)} disabled={visitPattern !== 'biweekly'} className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 disabled:cursor-not-allowed disabled:opacity-50">
                <option value="1">第1・3週</option>
                <option value="2">第2・4週</option>
              </select>
            </div>
            <div>
              <Label className="text-slate-700">月回数</Label>
              <Input value={visitCount} onChange={(e) => setVisitCount(normalizeVisitCount(e.target.value))} className="mt-1 border-slate-200 bg-white text-slate-900" inputMode="numeric" />
            </div>
          </div>

          <div>
            <Label className="text-slate-700">訪問曜日</Label>
            <div data-field="visitPlan" className={`mt-2 flex flex-wrap gap-2 rounded-lg ${fieldErrors.visitPlan ? 'border border-rose-200 bg-rose-50 p-2' : ''}`}>
              {visitWeekdayOptions.map((day) => {
                const active = selectedDays.includes(day)
                return (
                  <button key={day} type="button" onClick={() => toggleDay(day)} className={`rounded-md border px-3 py-1.5 text-xs ${active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                    {day}
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-slate-500">初回訪問予定日または訪問曜日のどちらかを入力してください。</p>
            <FieldErrorText message={fieldErrors.visitPlan} />
          </div>

          <div>
            <Label className="text-slate-700">希望時間</Label>
            <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                data-field="preferredTime"
                type="time"
                step={600}
                value={form.preferredTime}
                disabled={form.preferredTimeUnspecified === 'true'}
                onChange={(e) => handleChange('preferredTime', e.target.value)}
                className={inputClass('preferredTime', 'mt-0 max-w-xs disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400')}
              />
              <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={form.preferredTimeUnspecified === 'true'}
                  onChange={(e) => handleChange('preferredTimeUnspecified', e.target.checked ? 'true' : 'false')}
                  className="h-4 w-4 rounded border-slate-300"
                />
                指定なし
              </label>
            </div>
            {form.preferredTimeUnspecified === 'true' && <p className="mt-1 text-[11px] font-medium text-slate-500">希望時間は「指定なし」として予定に反映します。</p>}
            <FieldErrorText message={fieldErrors.preferredTime} />
          </div>

          {isExceeded && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              月4回を超過しています。保存は可能ですが、運用上の確認が必要です。
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-sm text-slate-900">訪問予定カレンダー</CardTitle>
            <Button type="button" variant="outline" onClick={resetCalendarEdits} className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
              <RotateCcw className="mr-2 h-4 w-4" />自動生成に戻す
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-slate-500">入力内容をもとに訪問予定を自動で入れます。日付を押すと、追加や除外を調整できます。</p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-3 flex items-center justify-between">
              <button type="button" onClick={showPreviousPreviewMonth} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-900">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-900">{formatVisitCalendarMonth(previewYear, previewMonth)}</p>
                <p className="text-[11px] text-slate-500">青: 通常, 緑: 手動追加, 赤: 除外</p>
              </div>
              <button type="button" onClick={showNextPreviewMonth} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-900">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-1">
              {VISIT_CALENDAR_DAY_LABELS.map((label, index) => (
                <div key={label} className={`py-1 text-center text-[10px] font-medium ${index === 0 ? 'text-rose-500' : index === 6 ? 'text-sky-500' : 'text-slate-500'}`}>
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: calendarPreview.firstDay }).map((_, index) => (
                <div key={`empty-${index}`} className="h-9" />
              ))}

              {Array.from({ length: calendarPreview.daysInMonth }).map((_, index) => {
                const day = index + 1
                const date = new Date(previewYear, previewMonth, day)
                const dateKey = formatVisitCalendarDateKey(date)
                const isScheduled = calendarPreview.scheduled.has(dateKey)
                const isCustom = calendarPreview.custom.has(dateKey)
                const isExcluded = calendarPreview.excluded.has(dateKey) && !isCustom
                const isToday = dateKey === calendarPreview.todayKey

                return (
                  <button
                    type="button"
                    key={dateKey}
                    onClick={() => toggleCalendarDate(dateKey)}
                    className={`relative flex h-9 items-center justify-center rounded-lg text-xs font-medium ${isCustom ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20' : isScheduled ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/20' : isExcluded ? 'border border-rose-200 bg-white text-rose-500 line-through' : 'bg-white text-slate-500 border border-slate-200'} ${isToday ? 'ring-1 ring-indigo-400/50' : ''}`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-[10px] text-slate-500">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-indigo-500" />通常ルール</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-500" />手動追加</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded border border-rose-200 bg-white" />除外</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <button type="button" onClick={() => setShowOptional((prev) => !prev)} className="flex w-full items-center justify-between text-left">
            <CardTitle className="text-sm text-slate-900">任意項目を追加</CardTitle>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition ${showOptional ? 'rotate-180' : ''}`} />
          </button>
        </CardHeader>
        {showOptional && (
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-500">必要な場合だけ入力してください。あとから患者詳細でも編集できます。</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div><Label className="text-slate-700">注意事項メモ</Label><Textarea value={form.visitNotes} onChange={(e) => handleChange('visitNotes', e.target.value)} className="mt-1 min-h-[100px] border-slate-200 bg-white text-slate-900" placeholder="暗証番号 / 配薬場所 / 訪問時の注意 など" /></div>
              <div className="space-y-3">
                <div><Label className="text-slate-700">緊急連絡先</Label><Input value={form.emergencyContactName} onChange={(e) => handleChange('emergencyContactName', e.target.value)} className="mt-1 border-slate-200 bg-white text-slate-900" placeholder="山田 一郎" /></div>
                <div>
                  <Label className="text-slate-700">続柄</Label>
                  <select value={form.emergencyContactRelation} onChange={(e) => handleChange('emergencyContactRelation', e.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900">
                    <option value="">未選択</option>
                    {relationOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-slate-700">緊急連絡先電話</Label>
                  <Input data-field="emergencyContactPhone" value={formatPhone(form.emergencyContactPhone)} onChange={(e) => handleChange('emergencyContactPhone', e.target.value)} className={inputClass('emergencyContactPhone')} placeholder="090-1234-5678" inputMode="tel" />
                  <FieldErrorText message={fieldErrors.emergencyContactPhone} />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-slate-700">病院・クリニック</Label>
                <Input value={form.doctorClinic} onChange={(e) => handleChange('doctorClinic', e.target.value)} className="mt-1 border-slate-200 bg-white text-slate-900" placeholder="○○クリニック" />
                <p className="text-[11px] text-slate-500">過去に登録した病院があれば候補を表示します。なければこの名前のまま登録できます。</p>
                {medicalInstitutionLoading && <p className="text-[11px] text-slate-500">病院候補を確認中です...</p>}
                {!medicalInstitutionLoading && medicalInstitutionOptions.length > 0 && (
                  <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                    {medicalInstitutionOptions.slice(0, 5).map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setSelectedMedicalInstitutionId(option.id)
                          setSelectedDoctorMasterId(null)
                          setForm((prev) => ({ ...prev, doctorClinic: option.name }))
                          void searchDoctors(option.id)
                        }}
                        className={`w-full rounded-md border px-3 py-2 text-left text-xs ${selectedMedicalInstitutionId === option.id ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{option.name}</p>
                          {form.doctorClinic.trim() && option.name === form.doctorClinic.trim() && (
                            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-200">同名候補</span>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">{option.address || '住所未設定'} / 医師候補 {option.doctorCount}件</p>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setEditingInstitutionId(null)
                      setInstitutionForm({ name: form.doctorClinic, phone: '', address: '' })
                      setInstitutionDialogOpen(true)
                    }}
                  >
                    この病院を追加
                  </Button>
                  {selectedMedicalInstitutionId && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        onClick={() => {
                          setSelectedMedicalInstitutionId(null)
                          setSelectedDoctorMasterId(null)
                          setDoctorOptions([])
                        }}
                      >
                        選択を外す
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-sky-300 hover:bg-sky-500/10 hover:text-sky-200"
                        onClick={() => {
                          const current = medicalInstitutionOptions.find((item) => item.id === selectedMedicalInstitutionId)
                          setEditingInstitutionId(selectedMedicalInstitutionId)
                          setInstitutionForm({ name: current?.name ?? form.doctorClinic, phone: current?.phone ?? '', address: current?.address ?? '' })
                          setInstitutionDialogOpen(true)
                        }}
                      >
                        修正する
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                        onClick={() => void archiveMedicalInstitution()}
                      >
                        候補から外す
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-slate-700">主治医</Label>
                <Input value={form.doctorName} onChange={(e) => handleChange('doctorName', e.target.value)} className="mt-1 border-slate-200 bg-white text-slate-900" placeholder="田中医師" />
                <p className="text-[11px] text-slate-500">病院を選ぶと、その病院に登録済みの医師候補が出ます。</p>
                {doctorLoading && selectedMedicalInstitutionId && <p className="text-[11px] text-slate-500">医師候補を確認中です...</p>}
                {!doctorLoading && selectedMedicalInstitutionId && doctorOptions.length > 0 && (
                  <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                    {doctorOptions.slice(0, 5).map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setSelectedDoctorMasterId(option.id)
                          setForm((prev) => ({ ...prev, doctorName: option.fullName, doctorPhone: normalizePhone(option.phone) }))
                        }}
                        className={`w-full rounded-md border px-3 py-2 text-left text-xs ${selectedDoctorMasterId === option.id ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{option.fullName}</p>
                          {form.doctorName.trim() && option.fullName === form.doctorName.trim() && (
                            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-200">同名候補</span>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">{option.department || '診療科未設定'}{option.phone ? ` / ${option.phone}` : ''}</p>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    disabled={!selectedMedicalInstitutionId}
                    onClick={() => {
                      setEditingDoctorId(null)
                      setDoctorForm({ fullName: form.doctorName, phone: form.doctorPhone, department: '' })
                      setDoctorDialogOpen(true)
                    }}
                  >
                    この医師を追加
                  </Button>
                  {selectedDoctorMasterId && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        onClick={() => setSelectedDoctorMasterId(null)}
                      >
                        選択を外す
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-sky-300 hover:bg-sky-500/10 hover:text-sky-200"
                        onClick={() => {
                          const current = doctorOptions.find((item) => item.id === selectedDoctorMasterId)
                          setEditingDoctorId(selectedDoctorMasterId)
                          setDoctorForm({ fullName: current?.fullName ?? form.doctorName, phone: normalizePhone(current?.phone ?? form.doctorPhone), department: current?.department ?? '' })
                          setDoctorDialogOpen(true)
                        }}
                      >
                        修正する
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                        onClick={() => void archiveDoctor()}
                      >
                        候補から外す
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-slate-700">医師電話</Label>
                <Input data-field="doctorPhone" value={formatPhone(form.doctorPhone)} onChange={(e) => handleChange('doctorPhone', e.target.value)} className={inputClass('doctorPhone')} placeholder="03-1234-5678" inputMode="tel" />
                <FieldErrorText message={fieldErrors.doctorPhone} />
              </div>
              <div><Label className="text-slate-700">現在薬</Label><Input value={form.currentMeds} onChange={(e) => handleChange('currentMeds', e.target.value)} className="mt-1 border-slate-200 bg-white text-slate-900" placeholder="ラシックス など" /></div>
              <div className="md:col-span-2">
                <Label className="text-slate-700">主疾患</Label>
                <div className="mt-2 flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  {diseaseOptions.map((disease) => {
                    const active = selectedDiseases.includes(disease)
                    return (
                      <button key={disease} type="button" onClick={() => toggleDisease(disease)} className={`rounded-md border px-3 py-1.5 text-xs ${active ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                        {disease}
                      </button>
                    )
                  })}
                </div>
                <Input value={form.diseaseName} onChange={(e) => handleChange('diseaseName', e.target.value)} className="mt-2 border-slate-200 bg-white text-slate-900" placeholder="備考・その他疾患" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-slate-700">既往歴</Label>
                <div className="mt-2 flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  {medicalHistoryOptions.map((history) => {
                    const active = selectedMedicalHistories.includes(history)
                    return (
                      <button key={history} type="button" onClick={() => toggleMedicalHistory(history)} className={`rounded-md border px-3 py-1.5 text-xs ${active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                        {history}
                      </button>
                    )
                  })}
                </div>
                <Textarea value={form.medicalHistory} onChange={(e) => handleChange('medicalHistory', e.target.value)} className="mt-2 min-h-[80px] border-slate-200 bg-white text-slate-900" placeholder="備考・その他の既往歴" />
              </div>
              <div><Label className="text-slate-700">アレルギー</Label><Input value={form.allergies} onChange={(e) => handleChange('allergies', e.target.value)} className="mt-1 border-slate-200 bg-white text-slate-900" placeholder="なし / ペニシリン系 など" /></div>
              <div><Label className="text-slate-700">保険情報</Label><Textarea value={form.insuranceInfo} onChange={(e) => handleChange('insuranceInfo', e.target.value)} className="mt-1 min-h-[80px] border-slate-200 bg-white text-slate-900" placeholder="保険種別・負担割合など" /></div>
            </div>
            <div>
              <Label className="text-slate-700">タグ</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {patientTagOptions.map((tag) => {
                  const active = selectedTags.includes(tag)
                  return (
                    <button key={tag} type="button" onClick={() => toggleTag(tag)} className={`rounded-full border px-3 py-1.5 text-xs ${active ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                      {tag}
                    </button>
                  )
                })}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs text-slate-500">
          <div>
            <p>登録者: {user?.full_name ?? '薬局スタッフ'}</p>
            <p><span className="text-rose-500">*</span> は登録時に必要です。電話は未入力でも登録できます。</p>
          </div>
          <Button disabled={isSubmitting} onClick={() => void handleSave()} className="bg-indigo-600 text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"><Save className="h-4 w-4" />{isSubmitting ? '登録中...' : '登録する'}</Button>
        </CardContent>
      </Card>

      <Dialog open={institutionDialogOpen} onOpenChange={setInstitutionDialogOpen}>
        <DialogContent className="border-slate-200 bg-white text-slate-900 shadow-xl">
          <DialogHeader>
            <DialogTitle>病院を追加</DialogTitle>
            <DialogDescription className="text-slate-500">候補にない病院は、その場で追加できます。</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-slate-700">病院名</Label>
              <Input value={institutionForm.name} onChange={(e) => setInstitutionForm((prev) => ({ ...prev, name: e.target.value }))} className="mt-1 border-slate-200 bg-white text-slate-900" placeholder="○○クリニック" />
            </div>
            <div>
              <Label className="text-slate-700">電話</Label>
              <Input value={formatPhone(institutionForm.phone)} onChange={(e) => setInstitutionForm((prev) => ({ ...prev, phone: normalizePhone(e.target.value) }))} className="mt-1 border-slate-200 bg-white text-slate-900" placeholder="03-1234-5678" inputMode="tel" />
            </div>
            <div>
              <Label className="text-slate-700">住所</Label>
              <Input value={institutionForm.address} onChange={(e) => setInstitutionForm((prev) => ({ ...prev, address: e.target.value }))} className="mt-1 border-slate-200 bg-white text-slate-900" placeholder="東京都..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstitutionDialogOpen(false)} className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">閉じる</Button>
            <Button onClick={() => void saveMedicalInstitution()} disabled={institutionSubmitting} className="bg-indigo-600 text-white hover:bg-indigo-500">{institutionSubmitting ? (editingInstitutionId ? '更新中...' : '追加中...') : (editingInstitutionId ? '病院を更新' : '病院を追加')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={doctorDialogOpen} onOpenChange={setDoctorDialogOpen}>
        <DialogContent className="border-slate-200 bg-white text-slate-900 shadow-xl">
          <DialogHeader>
            <DialogTitle>医師を追加</DialogTitle>
            <DialogDescription className="text-slate-500">選択中の病院に医師を追加します。</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-slate-700">医師名</Label>
              <Input value={doctorForm.fullName} onChange={(e) => setDoctorForm((prev) => ({ ...prev, fullName: e.target.value }))} className="mt-1 border-slate-200 bg-white text-slate-900" placeholder="田中医師" />
            </div>
            <div>
              <Label className="text-slate-700">診療科</Label>
              <Input value={doctorForm.department} onChange={(e) => setDoctorForm((prev) => ({ ...prev, department: e.target.value }))} className="mt-1 border-slate-200 bg-white text-slate-900" placeholder="内科" />
            </div>
            <div>
              <Label className="text-slate-700">電話</Label>
              <Input value={formatPhone(doctorForm.phone)} onChange={(e) => setDoctorForm((prev) => ({ ...prev, phone: normalizePhone(e.target.value) }))} className="mt-1 border-slate-200 bg-white text-slate-900" placeholder="03-1234-5678" inputMode="tel" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDoctorDialogOpen(false)} className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">閉じる</Button>
            <Button onClick={() => void saveDoctor()} disabled={doctorSubmitting} className="bg-emerald-600 text-white hover:bg-emerald-500">{doctorSubmitting ? (editingDoctorId ? '更新中...' : '追加中...') : (editingDoctorId ? '医師を更新' : '医師を追加')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={geocodeConfirmOpen} onOpenChange={setGeocodeConfirmOpen}>
        <DialogContent className="border-slate-200 bg-white text-slate-900 shadow-xl">
          <DialogHeader>
            <DialogTitle>住所の解釈を確認してください</DialogTitle>
            <DialogDescription className="text-slate-500">
              保存前に、地図で使う住所解釈を確認できます。問題なければこのまま登録します。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">入力した住所</p>
              <p className="mt-1 text-slate-900">{geocodePreview?.inputAddress ?? '—'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">解釈された住所</p>
              <p className="mt-1 text-slate-900">{geocodePreview?.normalizedAddress ?? '未取得'}</p>
              <p className="mt-1 text-xs text-slate-500">座標: {geocodePreview?.latitude ?? '-'}, {geocodePreview?.longitude ?? '-'}</p>
            </div>
            {typeof geocodePreview?.latitude === 'number' && typeof geocodePreview?.longitude === 'number' && (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <iframe
                  title="住所確認地図"
                  className="h-56 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${geocodePreview.latitude},${geocodePreview.longitude}&z=16&output=embed`}
                />
              </div>
            )}
            {geocodePreview?.warnings?.length ? (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-amber-200">
                {geocodePreview.warnings.map((warning) => (
                  <p key={warning.code}>{warning.message}</p>
                ))}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGeocodeConfirmOpen(false)} className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">住所を見直す</Button>
            <Button onClick={() => void handleSave(true)} className="bg-indigo-600 text-white hover:bg-indigo-500">この住所で登録する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
