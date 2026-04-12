'use client'

import { useMemo, useState } from 'react'
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
import { canManagePatients, getScopedPharmacyId } from '@/lib/patient-permissions'
import { MOCK_FLOW_DATE } from '@/lib/day-flow'
import {
  buildRegisteredPatientRecord,
  loadRegisteredPatients,
  upsertRegisteredPatient,
  type PatientVisitRule,
  type VisitRulePattern,
} from '@/lib/patient-master'
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

function normalizeDateInput(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const digits = trimmed.replace(/[^0-9]/g, '')
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(trimmed)) return trimmed.replace(/\//g, '-')
  return trimmed
}

function normalizePostalCode(value: string) {
  return value.replace(/[^0-9]/g, '').slice(0, 7)
}

function formatPostalCode(value: string) {
  const digits = normalizePostalCode(value)
  if (digits.length <= 3) return digits
  return `${digits.slice(0, 3)}-${digits.slice(3)}`
}

type GeocodePreview = {
  inputAddress: string
  normalizedAddress: string | null
  latitude: number | null
  longitude: number | null
  warnings: Array<{ code: string; message: string }>
}

export default function NewPatientPage() {
  const router = useRouter()
  const { user, role, authMode } = useAuth()
  const [visitCount, setVisitCount] = useState('4')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [visitPattern, setVisitPattern] = useState<VisitRulePattern>('weekly')
  const [biweeklyAnchorWeek, setBiweeklyAnchorWeek] = useState<1 | 2>(1)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [warningMessage, setWarningMessage] = useState<string | null>(null)
  const [showOptional, setShowOptional] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customDates, setCustomDates] = useState<string[]>([])
  const [excludedDates, setExcludedDates] = useState<string[]>([])
  const [geocodeConfirmOpen, setGeocodeConfirmOpen] = useState(false)
  const [geocodePreview, setGeocodePreview] = useState<GeocodePreview | null>(null)
  const [postalLookupLoading, setPostalLookupLoading] = useState(false)
  const [postalLookupMessage, setPostalLookupMessage] = useState<string | null>(null)
  const ownPharmacyId = getScopedPharmacyId(user)
  const [form, setForm] = useState({
    name: '',
    dob: '',
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
    visitNotes: '',
    insuranceInfo: '',
  })

  const isExceeded = Number(visitCount) > 4
  const canEditPatients = canManagePatients(role)
  const previewBaseDate = useMemo(() => new Date(`${form.startedAt || MOCK_FLOW_DATE}T00:00:00`), [form.startedAt])
  const [previewYear, setPreviewYear] = useState(previewBaseDate.getFullYear())
  const [previewMonth, setPreviewMonth] = useState(previewBaseDate.getMonth())

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
    setSelectedDays((prev) => prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day])
  }

  const previewVisitRules = useMemo<PatientVisitRule[]>(() => {
    const baseRules: PatientVisitRule[] = selectedDays.map((day, index) => ({
      id: `preview-rule-${weekdayMap[day as keyof typeof weekdayMap]}-${index + 1}`,
      pattern: visitPattern,
      weekday: weekdayMap[day as keyof typeof weekdayMap],
      intervalWeeks: visitPattern === 'biweekly' ? 2 : 1,
      anchorWeek: visitPattern === 'biweekly' ? biweeklyAnchorWeek : null,
      preferredTime: form.preferredTime || null,
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
        preferredTime: form.preferredTime || null,
        monthlyVisitLimit: Math.max(1, Number(visitCount) || 4),
        active: true,
        customDates: effectiveCustomDates,
        excludedDates: [],
      })
    }

    return baseRules
  }, [biweeklyAnchorWeek, effectiveCustomDates, excludedDates, form.preferredTime, selectedDays, visitCount, visitPattern])

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
    let nextValue = value

    if (key === 'dob' || key === 'firstVisitDate') {
      nextValue = normalizeDateInput(value)
    }

    if (key === 'postalCode') {
      nextValue = normalizePostalCode(value)
      setPostalLookupMessage(null)
    }

    setForm((prev) => ({ ...prev, [key]: nextValue }))

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

  const handleSave = async (skipGeocodeConfirmation = false) => {
    if (isSubmitting) return

    setErrorMessage(null)
    setWarningMessage(null)

    if (!canEditPatients) {
      setErrorMessage('このロールでは患者登録はできません。')
      return
    }

    if (!form.name.trim()) {
      setErrorMessage('氏名を入力してください。')
      return
    }

    const normalizedDob = normalizeDateInput(form.dob)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDob)) {
      setErrorMessage('生年月日を入力してください。')
      return
    }

    if (!form.address.trim()) {
      setErrorMessage('住所を入力してください。')
      return
    }

    if (!normalizeDateInput(form.firstVisitDate) && selectedDays.length === 0) {
      setErrorMessage('初回訪問予定日または訪問曜日を入力してください。')
      return
    }

    const visitRules = previewVisitRules
    const requestPayload = {
      basic: {
        fullName: form.name,
        birthDate: normalizedDob,
        postalCode: form.postalCode,
        addressLine1: form.address,
        phone: form.phone,
        serviceStartDate: form.startedAt,
        visitNotes: form.visitNotes,
        emergencyContactName: form.emergencyContactName,
        emergencyContactRelation: form.emergencyContactRelation,
        emergencyContactPhone: form.emergencyContactPhone,
      },
      visitPlan: {
        firstVisitDate: normalizeDateInput(form.firstVisitDate),
        monthlyVisitCount: Math.max(1, Number(visitCount) || 4),
        visitWeekdays: selectedDays.map((day) => weekdayMap[day as keyof typeof weekdayMap]),
      },
      medical: {
        doctorName: form.doctorName,
        doctorClinic: form.doctorClinic,
        doctorPhone: form.doctorPhone,
        currentMeds: form.currentMeds,
        medicalHistory: form.medicalHistory,
        allergies: form.allergies,
        diseaseName: form.diseaseName,
        insuranceInfo: form.insuranceInfo,
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
        setErrorMessage(createResult?.error === 'forbidden' ? 'このロールでは患者登録できません。' : '患者登録に失敗しました。')
        return
      }

      const createdPatientId = typeof createResult?.patient?.id === 'string' ? createResult.patient.id : null
      let fallbackPatientId: string | null = null
      const shouldPersistLocal = authMode !== 'cognito' && (createResult?.mode !== 'supabase' || !createdPatientId)

      if (shouldPersistLocal) {
        const existing = loadRegisteredPatients()
        const patient = buildRegisteredPatientRecord(
          {
            name: form.name,
            dob: normalizedDob,
            phone: form.phone,
            pharmacyId: ownPharmacyId,
            address: `${form.postalCode ? `〒${form.postalCode} ` : ''}${form.address}`.trim(),
            startedAt: form.startedAt,
            status: 'active',
            manualTags: selectedTags,
            emergencyContactName: form.emergencyContactName,
            emergencyContactRelation: form.emergencyContactRelation,
            emergencyContactPhone: form.emergencyContactPhone,
            doctorName: form.doctorName,
            doctorClinic: form.doctorClinic,
            doctorPhone: form.doctorPhone,
            currentMeds: form.currentMeds,
            medicalHistory: form.medicalHistory,
            allergies: form.allergies,
            diseaseName: form.diseaseName,
            visitNotes: form.visitNotes,
            insuranceInfo: form.insuranceInfo,
            preferredTime: form.preferredTime,
            visitCount: Math.max(1, Number(visitCount) || 4),
            visitRules,
            manualSyncAt: null,
          },
          {
            id: user?.id ?? null,
            name: user?.full_name ?? 'Pharmacy Staff',
          },
          existing,
        )
        upsertRegisteredPatient(patient)
        fallbackPatientId = patient.id
      }

      const apiWarnings = Array.isArray(createResult?.warnings) ? createResult.warnings : []
      if (apiWarnings.length > 0) {
        setWarningMessage(apiWarnings.map((warning: { message: string }) => warning.message).join(' '))
      } else if (!form.phone.trim()) {
        setWarningMessage('連絡先電話が未設定のため、患者詳細で警告表示されます。')
      }

      const destinationPatientId = createdPatientId ?? fallbackPatientId
      if (!destinationPatientId) {
        setErrorMessage('登録後の画面遷移に失敗しました。患者一覧から確認してください。')
        router.push('/dashboard/patients')
        return
      }

      setGeocodeConfirmOpen(false)
      setGeocodePreview(null)
      router.push(`/dashboard/patients/${destinationPatientId}?created=1`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!canEditPatients) {
    return (
      <div className="space-y-4 text-gray-100">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-white"><UserPlus className="h-5 w-5 text-indigo-400" />患者登録</h1>
          <p className="text-xs text-gray-400">患者登録は自局の Pharmacy Staff / Pharmacy Admin のみが行えます。</p>
        </div>
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardContent className="p-6 text-sm text-gray-300">
            現在のロールでは患者登録はできません。患者検索または患者詳細の閲覧をご利用ください。
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 text-gray-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-white"><UserPlus className="h-5 w-5 text-indigo-400" />患者登録</h1>
          <p className="text-xs text-gray-400">まずは最低限の情報で登録できます。必要な情報はあとから追加できます。</p>
        </div>
        <div className="rounded-lg border border-[#2a3553] bg-[#11182c] px-3 py-2 text-xs text-gray-300">
          登録先: <span className="font-medium text-white">現在の所属先</span>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          <AlertTriangle className="h-4 w-4 text-rose-300" />
          {errorMessage}
        </div>
      )}

      {warningMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-300" />
          {warningMessage}
        </div>
      )}

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-white">基本情報</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <Label className="text-gray-300">氏名</Label>
            <Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="山田 花子" />
          </div>
          <div>
            <Label className="text-gray-300">生年月日</Label>
            <Input value={form.dob} onChange={(e) => handleChange('dob', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="19500412 / 1950-04-12" />
          </div>
          <div>
            <Label className="text-gray-300">郵便番号</Label>
            <div className="mt-1 flex gap-2">
              <Input value={formatPostalCode(form.postalCode)} onChange={(e) => handleChange('postalCode', e.target.value)} onBlur={() => { if (normalizePostalCode(form.postalCode).length === 7) void lookupPostalCode(form.postalCode) }} className="border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="192-0012" />
              <Button type="button" variant="outline" className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#1a2035]" disabled={postalLookupLoading || normalizePostalCode(form.postalCode).length !== 7} onClick={() => void lookupPostalCode(form.postalCode)}>
                再取得
              </Button>
            </div>
            <p className="mt-1 text-[11px] text-gray-500">{postalLookupLoading ? '郵便番号から住所を確認中です...' : postalLookupMessage ?? '7桁入力すると住所を補完します。番地以降は必要に応じて追記してください。'}</p>
          </div>
          <div>
            <Label className="text-gray-300">連絡先電話</Label>
            <Input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="090-xxxx-xxxx" />
          </div>
          <div className="md:col-span-2">
            <Label className="text-gray-300">住所</Label>
            <Input value={form.address} onChange={(e) => handleChange('address', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="東京都八王子市..." />
          </div>
          <div>
            <Label className="text-gray-300">利用開始日</Label>
            <Input value={form.startedAt} onChange={(e) => handleChange('startedAt', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="2026-04-11" />
          </div>
          <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3 text-xs text-gray-400">
            <p className="font-medium text-white">登録ルール</p>
            <p className="mt-1">ステータスは active で自動設定されます。所属薬局はログイン中ユーザーの所属から自動反映します。</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-white">訪問条件</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <Label className="text-gray-300">初回訪問予定日</Label>
              <Input value={form.firstVisitDate} onChange={(e) => handleChange('firstVisitDate', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="2026-04-14" />
            </div>
            <div>
              <Label className="text-gray-300">訪問パターン</Label>
              <select value={visitPattern} onChange={(e) => setVisitPattern(e.target.value as VisitRulePattern)} className="mt-1 h-10 w-full rounded-md border border-[#2a3553] bg-[#11182c] px-3 text-sm text-gray-100">
                {patternOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-gray-300">隔週アンカー</Label>
              <select value={String(biweeklyAnchorWeek)} onChange={(e) => setBiweeklyAnchorWeek(Number(e.target.value) as 1 | 2)} disabled={visitPattern !== 'biweekly'} className="mt-1 h-10 w-full rounded-md border border-[#2a3553] bg-[#11182c] px-3 text-sm text-gray-100 disabled:cursor-not-allowed disabled:opacity-50">
                <option value="1">第1・3週</option>
                <option value="2">第2・4週</option>
              </select>
            </div>
            <div>
              <Label className="text-gray-300">月回数</Label>
              <Input value={visitCount} onChange={(e) => setVisitCount(e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" />
            </div>
          </div>

          <div>
            <Label className="text-gray-300">訪問曜日</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {visitWeekdayOptions.map((day) => {
                const active = selectedDays.includes(day)
                return (
                  <button key={day} type="button" onClick={() => toggleDay(day)} className={`rounded-md border px-3 py-1.5 text-xs ${active ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-200' : 'border-[#2a3553] bg-[#11182c] text-gray-400'}`}>
                    {day}
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-gray-500">初回訪問予定日または訪問曜日のどちらかを入力してください。</p>
          </div>

          <div>
            <Label className="text-gray-300">希望時間</Label>
            <Input value={form.preferredTime} onChange={(e) => handleChange('preferredTime', e.target.value)} className="mt-1 max-w-xs border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="10:00" />
          </div>

          {isExceeded && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-300" />
              月4回を超過しています。保存は可能ですが、運用上の確認が必要です。
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-sm text-white">訪問予定カレンダー</CardTitle>
            <Button type="button" variant="outline" onClick={resetCalendarEdits} className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#1a2035]">
              <RotateCcw className="mr-2 h-4 w-4" />自動生成に戻す
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-gray-400">入力内容をもとに訪問予定を自動で入れます。日付を押すと、追加や除外を調整できます。</p>
          <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
            <div className="mb-3 flex items-center justify-between">
              <button type="button" onClick={showPreviousPreviewMonth} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-[#212b45] hover:text-white">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-center">
                <p className="text-sm font-medium text-white">{formatVisitCalendarMonth(previewYear, previewMonth)}</p>
                <p className="text-[11px] text-gray-500">青: 通常, 緑: 手動追加, 赤: 除外</p>
              </div>
              <button type="button" onClick={showNextPreviewMonth} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-[#212b45] hover:text-white">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-1">
              {VISIT_CALENDAR_DAY_LABELS.map((label, index) => (
                <div key={label} className={`py-1 text-center text-[10px] font-medium ${index === 0 ? 'text-rose-400' : index === 6 ? 'text-sky-400' : 'text-gray-500'}`}>
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
                    className={`relative flex h-9 items-center justify-center rounded-lg text-xs font-medium ${isCustom ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' : isScheduled ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/30' : isExcluded ? 'border border-rose-500/30 bg-[#0a0e1a] text-rose-300 line-through' : 'bg-[#0a0e1a] text-gray-400'} ${isToday ? 'ring-1 ring-indigo-500/50' : ''}`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-indigo-500" />通常ルール</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-500" />手動追加</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded border border-rose-500/30 bg-[#0a0e1a]" />除外</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <button type="button" onClick={() => setShowOptional((prev) => !prev)} className="flex w-full items-center justify-between text-left">
            <CardTitle className="text-sm text-white">任意項目を追加</CardTitle>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition ${showOptional ? 'rotate-180' : ''}`} />
          </button>
        </CardHeader>
        {showOptional && (
          <CardContent className="space-y-4">
            <p className="text-xs text-gray-400">必要な場合だけ入力してください。あとから患者詳細でも編集できます。</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div><Label className="text-gray-300">注意事項メモ</Label><Textarea value={form.visitNotes} onChange={(e) => handleChange('visitNotes', e.target.value)} className="mt-1 min-h-[100px] border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="暗証番号 / 配薬場所 / 夜間訪問注意 など" /></div>
              <div className="space-y-3">
                <div><Label className="text-gray-300">緊急連絡先</Label><Input value={form.emergencyContactName} onChange={(e) => handleChange('emergencyContactName', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="山田 一郎" /></div>
                <div><Label className="text-gray-300">続柄</Label><Input value={form.emergencyContactRelation} onChange={(e) => handleChange('emergencyContactRelation', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="長男" /></div>
                <div><Label className="text-gray-300">緊急連絡先電話</Label><Input value={form.emergencyContactPhone} onChange={(e) => handleChange('emergencyContactPhone', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="090-xxxx-xxxx" /></div>
              </div>
              <div><Label className="text-gray-300">主治医</Label><Input value={form.doctorName} onChange={(e) => handleChange('doctorName', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="田中医師" /></div>
              <div><Label className="text-gray-300">クリニック</Label><Input value={form.doctorClinic} onChange={(e) => handleChange('doctorClinic', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="○○クリニック" /></div>
              <div><Label className="text-gray-300">医師電話</Label><Input value={form.doctorPhone} onChange={(e) => handleChange('doctorPhone', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="03-xxxx-xxxx" /></div>
              <div><Label className="text-gray-300">現在薬</Label><Input value={form.currentMeds} onChange={(e) => handleChange('currentMeds', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="ラシックス など" /></div>
              <div><Label className="text-gray-300">主疾患</Label><Input value={form.diseaseName} onChange={(e) => handleChange('diseaseName', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="心不全 など" /></div>
              <div className="md:col-span-2"><Label className="text-gray-300">既往歴</Label><Textarea value={form.medicalHistory} onChange={(e) => handleChange('medicalHistory', e.target.value)} className="mt-1 min-h-[80px] border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="既往歴を入力" /></div>
              <div><Label className="text-gray-300">アレルギー</Label><Input value={form.allergies} onChange={(e) => handleChange('allergies', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="なし / ペニシリン系 など" /></div>
              <div><Label className="text-gray-300">保険情報</Label><Textarea value={form.insuranceInfo} onChange={(e) => handleChange('insuranceInfo', e.target.value)} className="mt-1 min-h-[80px] border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="保険種別・負担割合など" /></div>
            </div>
            <div>
              <Label className="text-gray-300">タグ</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {patientTagOptions.map((tag) => {
                  const active = selectedTags.includes(tag)
                  return (
                    <button key={tag} type="button" onClick={() => toggleTag(tag)} className={`rounded-full border px-3 py-1.5 text-xs ${active ? 'border-indigo-500/40 bg-indigo-500/20 text-indigo-200' : 'border-[#2a3553] bg-[#11182c] text-gray-400'}`}>
                      {tag}
                    </button>
                  )
                })}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs text-gray-400">
          <div>
            <p>登録者: {user?.full_name ?? 'Pharmacy Staff'}</p>
            <p>電話未入力でも登録可能です。患者詳細で警告表示します。</p>
          </div>
          <Button disabled={isSubmitting} onClick={() => void handleSave()} className="bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"><Save className="h-4 w-4" />{isSubmitting ? '登録中...' : '登録する'}</Button>
        </CardContent>
      </Card>

      <Dialog open={geocodeConfirmOpen} onOpenChange={setGeocodeConfirmOpen}>
        <DialogContent className="border-[#2a3553] bg-[#1a2035] text-gray-100">
          <DialogHeader>
            <DialogTitle>住所の解釈を確認してください</DialogTitle>
            <DialogDescription className="text-gray-400">
              保存前に、地図で使う住所解釈を確認できます。問題なければこのまま登録します。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
              <p className="text-xs text-gray-500">入力した住所</p>
              <p className="mt-1 text-gray-100">{geocodePreview?.inputAddress ?? '—'}</p>
            </div>
            <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
              <p className="text-xs text-gray-500">解釈された住所</p>
              <p className="mt-1 text-gray-100">{geocodePreview?.normalizedAddress ?? '未取得'}</p>
              <p className="mt-1 text-xs text-gray-500">座標: {geocodePreview?.latitude ?? '-'}, {geocodePreview?.longitude ?? '-'}</p>
            </div>
            {typeof geocodePreview?.latitude === 'number' && typeof geocodePreview?.longitude === 'number' && (
              <div className="overflow-hidden rounded-lg border border-[#2a3553] bg-[#11182c]">
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
            <Button variant="outline" onClick={() => setGeocodeConfirmOpen(false)} className="border-[#2a3553] text-gray-200 hover:bg-[#11182c]">住所を見直す</Button>
            <Button onClick={() => void handleSave(true)} className="bg-indigo-600 text-white hover:bg-indigo-500">この住所で登録する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
