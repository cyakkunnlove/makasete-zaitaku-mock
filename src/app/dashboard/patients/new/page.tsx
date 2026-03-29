'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertTriangle, ChevronLeft, ChevronRight, RefreshCcw, Save, UserPlus } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { pharmacyData, patientData } from '@/lib/mock-data'
import { patientTagOptions, visitWeekdayOptions } from '@/lib/patient-registration-spec'
import { MOCK_FLOW_DATE } from '@/lib/day-flow'
import {
  buildRegisteredPatientRecord,
  getPatientMasterRecords,
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

export default function NewPatientPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [visitCount, setVisitCount] = useState('4')
  const [selectedTags, setSelectedTags] = useState<string[]>(['利用中', '家族連絡用', '配薬場所指定'])
  const [selectedDays, setSelectedDays] = useState<string[]>(['土'])
  const [visitPattern, setVisitPattern] = useState<VisitRulePattern>('weekly')
  const [biweeklyAnchorWeek, setBiweeklyAnchorWeek] = useState<1 | 2>(1)
  const [manualSyncAt, setManualSyncAt] = useState('2026-03-29 15:10')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    dob: '',
    phone: '',
    pharmacyId: 'PH-01',
    address: '',
    startedAt: MOCK_FLOW_DATE,
    status: 'active' as 'active' | 'inactive',
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
  const previewBaseDate = useMemo(() => new Date(`${form.startedAt || MOCK_FLOW_DATE}T00:00:00`), [form.startedAt])
  const [previewYear, setPreviewYear] = useState(previewBaseDate.getFullYear())
  const [previewMonth, setPreviewMonth] = useState(previewBaseDate.getMonth())

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag])
  }

  const toggleDay = (day: string) => {
    setSelectedDays((prev) => prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day])
  }

  const previewVisitRules = useMemo<PatientVisitRule[]>(() => {
    return selectedDays.map((day, index) => ({
      id: `preview-rule-${weekdayMap[day as keyof typeof weekdayMap]}-${index + 1}`,
      pattern: visitPattern,
      weekday: weekdayMap[day as keyof typeof weekdayMap],
      intervalWeeks: visitPattern === 'biweekly' ? 2 : 1,
      anchorWeek: visitPattern === 'biweekly' ? biweeklyAnchorWeek : null,
      preferredTime: form.preferredTime || null,
      monthlyVisitLimit: Math.max(1, Number(visitCount) || 4),
      active: true,
      customDates: [],
      excludedDates: [],
    }))
  }, [biweeklyAnchorWeek, form.preferredTime, selectedDays, visitCount, visitPattern])

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
    setForm((prev) => ({ ...prev, [key]: value }))

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

  const handleSave = () => {
    if (!form.name.trim()) {
      setErrorMessage('氏名は必須です。')
      return
    }
    if (!form.address.trim()) {
      setErrorMessage('住所は必須です。')
      return
    }
    if (selectedDays.length === 0) {
      setErrorMessage('訪問曜日を1つ以上選んでください。')
      return
    }

    const visitRules = previewVisitRules

    const existing = getPatientMasterRecords(loadRegisteredPatients())
    const patient = buildRegisteredPatientRecord(
      {
        name: form.name,
        dob: form.dob,
        phone: form.phone,
        pharmacyId: form.pharmacyId,
        address: form.address,
        startedAt: form.startedAt,
        status: form.status,
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
        manualSyncAt,
      },
      {
        id: user?.id ?? null,
        name: user?.full_name ?? 'Pharmacy Staff（モック）',
      },
      existing.length > 0 ? existing : patientData,
    )

    upsertRegisteredPatient(patient)
    router.push('/dashboard')
  }

  return (
    <div className="space-y-4 text-gray-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-white"><UserPlus className="h-5 w-5 text-indigo-400" />患者登録</h1>
          <p className="text-xs text-gray-400">患者マスタ + visitRules モデルへ保存する最小実装。Supabase接続前は localStorage に保存します。初期曜日は mock 当日フロー（{MOCK_FLOW_DATE}）に乗る設定です。</p>
        </div>
        <Button variant="outline" className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#1a2035]" onClick={() => setManualSyncAt('2026-03-29 15:10')}>
          <RefreshCcw className="h-4 w-4" />
          手動更新
        </Button>
      </div>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs text-gray-400">
          <div>
            <p>最終同期: {manualSyncAt}</p>
            <p>最終更新者: {user?.full_name ?? 'Pharmacy Staff（モック）'} / 保存先: patient master localStorage</p>
          </div>
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-cyan-200">更新ありバッジ / 手動同期を想定</div>
        </CardContent>
      </Card>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          <AlertTriangle className="h-4 w-4 text-rose-300" />
          {errorMessage}
        </div>
      )}

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-white">基本情報</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div><Label className="text-gray-300">氏名</Label><Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="山田 花子" /></div>
          <div><Label className="text-gray-300">生年月日</Label><Input value={form.dob} onChange={(e) => handleChange('dob', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="1948-04-12" /></div>
          <div><Label className="text-gray-300">患者本人電話</Label><Input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="090-xxxx-xxxx" /></div>
          <div>
            <Label className="text-gray-300">担当薬局</Label>
            <select value={form.pharmacyId} onChange={(e) => handleChange('pharmacyId', e.target.value)} className="mt-1 h-10 w-full rounded-md border border-[#2a3553] bg-[#11182c] px-3 text-sm text-gray-100">
              {pharmacyData.map((pharmacy) => (
                <option key={pharmacy.id} value={pharmacy.id}>{pharmacy.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2"><Label className="text-gray-300">住所</Label><Input value={form.address} onChange={(e) => handleChange('address', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="東京都八王子市..." /></div>
          <div><Label className="text-gray-300">利用開始日</Label><Input value={form.startedAt} onChange={(e) => handleChange('startedAt', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="2026-03-28" /></div>
          <div>
            <Label className="text-gray-300">ステータス</Label>
            <select value={form.status} onChange={(e) => handleChange('status', e.target.value)} className="mt-1 h-10 w-full rounded-md border border-[#2a3553] bg-[#11182c] px-3 text-sm text-gray-100">
              <option value="active">利用中</option>
              <option value="inactive">休止</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-white">タグ設定</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-gray-400">manualTags として保存し、患者名横や注意フラグで再利用します。</p>
          <div className="flex flex-wrap gap-2">
            {patientTagOptions.map((tag) => {
              const active = selectedTags.includes(tag)
              return (
                <button key={tag} type="button" onClick={() => toggleTag(tag)} className={`rounded-full border px-3 py-1.5 text-xs ${active ? 'border-indigo-500/40 bg-indigo-500/20 text-indigo-200' : 'border-[#2a3553] bg-[#11182c] text-gray-400'}`}>
                  {tag}
                </button>
              )
            })}
          </div>
          <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
            <p className="text-xs text-gray-500">プレビュー</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedTags.map((tag) => <span key={tag} className="rounded-full border border-indigo-500/40 bg-indigo-500/20 px-3 py-1 text-xs text-indigo-200">{tag}</span>)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-white">連絡・医療情報</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div><Label className="text-gray-300">緊急連絡先</Label><Input value={form.emergencyContactName} onChange={(e) => handleChange('emergencyContactName', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="山田 一郎" /></div>
          <div><Label className="text-gray-300">続柄</Label><Input value={form.emergencyContactRelation} onChange={(e) => handleChange('emergencyContactRelation', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="長男" /></div>
          <div><Label className="text-gray-300">連絡先電話</Label><Input value={form.emergencyContactPhone} onChange={(e) => handleChange('emergencyContactPhone', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="090-xxxx-xxxx" /></div>
          <div><Label className="text-gray-300">主治医</Label><Input value={form.doctorName} onChange={(e) => handleChange('doctorName', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="田中医師" /></div>
          <div><Label className="text-gray-300">クリニック</Label><Input value={form.doctorClinic} onChange={(e) => handleChange('doctorClinic', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="○○クリニック" /></div>
          <div><Label className="text-gray-300">医師電話</Label><Input value={form.doctorPhone} onChange={(e) => handleChange('doctorPhone', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="03-xxxx-xxxx" /></div>
          <div><Label className="text-gray-300">現在薬</Label><Input value={form.currentMeds} onChange={(e) => handleChange('currentMeds', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="オキシコドン / ラシックス ..." /></div>
          <div><Label className="text-gray-300">主疾患</Label><Input value={form.diseaseName} onChange={(e) => handleChange('diseaseName', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="心不全、糖尿病" /></div>
          <div className="md:col-span-2"><Label className="text-gray-300">既往歴</Label><Textarea value={form.medicalHistory} onChange={(e) => handleChange('medicalHistory', e.target.value)} className="mt-1 min-h-[80px] border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="既往歴を入力" /></div>
          <div className="md:col-span-2"><Label className="text-gray-300">アレルギー</Label><Input value={form.allergies} onChange={(e) => handleChange('allergies', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="なし / ペニシリン系 など" /></div>
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-white">訪問ルール</CardTitle></CardHeader>
        <CardContent className="space-y-4">
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
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
              <Label className="text-gray-300">今月の訪問回数上限</Label>
              <Input value={visitCount} onChange={(e) => setVisitCount(e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" />
            </div>
            <div>
              <Label className="text-gray-300">希望時間</Label>
              <Input value={form.preferredTime} onChange={(e) => handleChange('preferredTime', e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="10:00" />
            </div>
          </div>

          {isExceeded && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-300" />
              月4回を超過しています。保存は可能ですが、visitRules 上の警告対象として扱います。
            </div>
          )}

          <div>
            <Label className="text-gray-300">カレンダー設定（visitRules プレビュー）</Label>
            <div className="mt-2 rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
              <div className="mb-3 flex items-center justify-between">
                <button type="button" onClick={showPreviousPreviewMonth} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-[#212b45] hover:text-white">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="text-center">
                  <p className="text-sm font-medium text-white">{formatVisitCalendarMonth(previewYear, previewMonth)}</p>
                  <p className="text-[11px] text-gray-500">開始日 {form.startedAt || MOCK_FLOW_DATE} を基準に表示</p>
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
                    <div
                      key={dateKey}
                      className={`relative flex h-9 items-center justify-center rounded-lg text-xs font-medium ${isCustom ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' : isScheduled ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/30' : isExcluded ? 'border border-rose-500/30 bg-[#0a0e1a] text-rose-300 line-through' : 'bg-[#0a0e1a] text-gray-400'} ${isToday ? 'ring-1 ring-indigo-500/50' : ''}`}
                    >
                      {day}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-gray-500">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-indigo-500" />通常ルール</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-500" />追加日</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded border border-rose-500/30 bg-[#0a0e1a]" />除外日</span>
            </div>
            <p className="mt-2 text-xs text-gray-500">選択中の曜日・パターン・希望時間から visitRules を生成し、そのまま patient master に保存します。</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-white">運用情報</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label className="text-gray-300">訪問時注意事項</Label><Textarea value={form.visitNotes} onChange={(e) => handleChange('visitNotes', e.target.value)} className="mt-1 min-h-[100px] border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="暗証番号 / ペット / 配薬場所 / 夜間訪問注意 など" /></div>
          <div><Label className="text-gray-300">保険情報</Label><Textarea value={form.insuranceInfo} onChange={(e) => handleChange('insuranceInfo', e.target.value)} className="mt-1 min-h-[80px] border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="保険種別・負担割合など" /></div>
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs text-gray-400">
          <div>
            <p>最終更新者: {user?.full_name ?? 'Pharmacy Staff（モック）'}</p>
            <p>最終更新時刻: {manualSyncAt}</p>
          </div>
          <Button onClick={handleSave} className="bg-indigo-600 text-white hover:bg-indigo-500"><Save className="h-4 w-4" />patient master に保存</Button>
        </CardContent>
      </Card>
    </div>
  )
}
