'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, Clock3, UserRound, Route } from 'lucide-react'

import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function getMonthLabel(year: number, month: number) {
  return `${year}年${month}月`
}

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  return { firstDay, daysInMonth }
}

type StaffSummary = {
  staffId: string
  staffName: string
  plannedCount: number
  completedCount: number
  firstVisitCount: number
  totalDistanceKm: number | null
  loadTone: 'light' | 'medium' | 'heavy'
}

type CalendarDaySummary = {
  date: string
  isPast: boolean
  isToday: boolean
  plannedCount: number
  inProgressCount: number
  completedCount: number
  firstVisitCount: number
  nightHandoverCount: number
  staffSummaries: StaffSummary[]
}

type CalendarDayDetail = {
  date: string
  canEditPast: boolean
  tasks: Array<{
    taskId: string
    patientId: string | null
    patientName: string
    scheduledTime: string
    status: 'scheduled' | 'in_progress' | 'completed'
    handledBy: string | null
    completedAt: string | null
    isFirstVisit: boolean
    isLongGapVisit: boolean
    hasNightHandover: boolean
    assigneeChangedAt: string | null
    note: string
  }>
}

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const

export default function CalendarPage() {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1)
  const [summaries, setSummaries] = useState<CalendarDaySummary[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [detail, setDetail] = useState<CalendarDayDetail | null>(null)
  const [loadingMonth, setLoadingMonth] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [selectedRouteCandidateIds, setSelectedRouteCandidateIds] = useState<string[]>([])
  const [routePlanLoading, setRoutePlanLoading] = useState(false)
  const [routeShareLoading, setRouteShareLoading] = useState(false)
  const [routeActionNotice, setRouteActionNotice] = useState<string | null>(null)
  const [routePlanResult, setRoutePlanResult] = useState<null | {
    ready: boolean
    suggestedOrder: Array<{ id: string; name: string; address: string }>
    missingCoordinates: Array<{ id: string; name: string; address: string }>
    totalDuration?: string | null
    totalDistanceMeters?: number | null
    origin?: { name: string; address: string }
    message: string
  }>(null)
  const routeResultRef = useRef<HTMLDivElement | null>(null)
  const { role } = useAuth()

  useEffect(() => {
    if (role !== 'pharmacy_admin' && role !== 'pharmacy_staff') return
    let cancelled = false

    async function loadMonth() {
      setLoadingMonth(true)
      try {
        const response = await fetch(`/api/calendar/month?year=${viewYear}&month=${viewMonth}`, { cache: 'no-store' })
        const result = await response.json().catch(() => null)
        if (!cancelled && response.ok && result?.ok && Array.isArray(result.summaries)) {
          setSummaries(result.summaries)
          if (!selectedDate) {
            setSelectedDate(result.summaries[0]?.date ?? `${viewYear}-${String(viewMonth).padStart(2, '0')}-01`)
          }
        }
      } finally {
        if (!cancelled) setLoadingMonth(false)
      }
    }

    void loadMonth()
    return () => { cancelled = true }
  }, [role, selectedDate, viewMonth, viewYear])

  useEffect(() => {
    if (!selectedDate) return
    let cancelled = false

    async function loadDetail() {
      setLoadingDetail(true)
      try {
        const response = await fetch(`/api/calendar/day/${selectedDate}`, { cache: 'no-store' })
        const result = await response.json().catch(() => null)
        if (!cancelled && response.ok && result?.ok && result.detail) {
          setDetail(result.detail)
        }
      } finally {
        if (!cancelled) setLoadingDetail(false)
      }
    }

    void loadDetail()
    return () => { cancelled = true }
  }, [selectedDate])

  useEffect(() => {
    setSelectedRouteCandidateIds([])
    setRoutePlanResult(null)
    setRouteActionNotice(null)
  }, [selectedDate])

  const summaryByDate = useMemo(() => new Map(summaries.map((summary) => [summary.date, summary])), [summaries])
  const todayDateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const canBuildRouteForSelectedDate = Boolean(selectedDate && selectedDate >= todayDateKey)
  const futureSelectedCount = selectedRouteCandidateIds.length
  const selectedSummary = selectedDate ? summaryByDate.get(selectedDate) ?? null : null
  const monthGrid = getMonthGrid(viewYear, viewMonth)

  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewYear((prev) => prev - 1)
      setViewMonth(12)
    } else {
      setViewMonth((prev) => prev - 1)
    }
    setSelectedDate(null)
    setDetail(null)
  }

  const toggleRouteCandidate = (patientId: string | null) => {
    if (!patientId) return
    setSelectedRouteCandidateIds((current) => current.includes(patientId) ? current.filter((id) => id !== patientId) : [...current, patientId])
  }

  const moveSuggestedStop = (index: number, direction: -1 | 1) => {
    setRoutePlanResult((current) => {
      if (!current?.ready) return current
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= current.suggestedOrder.length) return current
      const suggestedOrder = [...current.suggestedOrder]
      const temp = suggestedOrder[index]
      suggestedOrder[index] = suggestedOrder[nextIndex]
      suggestedOrder[nextIndex] = temp
      return { ...current, suggestedOrder }
    })
  }

  const handleSendRouteEmail = async () => {
    if (!selectedDate || !routePlanResult?.ready || routePlanResult.suggestedOrder.length === 0) return
    setRouteShareLoading(true)
    setRouteActionNotice(null)
    try {
      const response = await fetch('/api/calendar/route-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flowDate: selectedDate,
          totalDuration: routePlanResult.totalDuration ?? null,
          totalDistanceKm: typeof routePlanResult.totalDistanceMeters === 'number' ? routePlanResult.totalDistanceMeters / 1000 : null,
          originName: routePlanResult.origin?.name ?? '薬局',
          originAddress: routePlanResult.origin?.address ?? null,
          stops: routePlanResult.suggestedOrder,
        }),
      })
      const result = await response.json().catch(() => null)
      setRouteActionNotice(response.ok && result?.ok ? '自分のメールに送信しました。' : (result?.details ?? 'メール送信に失敗しました。'))
    } finally {
      setRouteShareLoading(false)
    }
  }

  const handleSuggestRoute = async () => {
    if (selectedRouteCandidateIds.length === 0) return
    setRoutePlanLoading(true)
    try {
      const response = await fetch('/api/day-flow/route-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientIds: selectedRouteCandidateIds }),
      })
      const result = await response.json().catch(() => null)
      if (response.ok && result?.ok && result.routePlan) {
        setRoutePlanResult(result.routePlan)
        setTimeout(() => routeResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
      }
    } finally {
      setRoutePlanLoading(false)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((prev) => prev + 1)
      setViewMonth(1)
    } else {
      setViewMonth((prev) => prev + 1)
    }
    setSelectedDate(null)
    setDetail(null)
  }

  if (role !== 'pharmacy_admin' && role !== 'pharmacy_staff') {
    return (
      <div className="space-y-4 text-gray-100">
        <div>
          <h1 className="text-lg font-semibold text-white">在宅カレンダー</h1>
          <p className="text-sm text-gray-400">この画面は Pharmacy Staff / Pharmacy Admin 向けです。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 text-gray-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">在宅カレンダー</h1>
          <p className="text-sm text-gray-400">過去は確定実績、未来は予定として確認できます。日付を押すとその日の詳細が見られます。</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[#2a3553] bg-[#11182c] px-3 py-2 text-xs text-gray-300">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" /> 完了中心
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" /> 対応中あり
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-indigo-400" /> 予定あり
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.9fr)]">
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <CalendarDays className="h-4 w-4 text-indigo-400" />
                {getMonthLabel(viewYear, viewMonth)}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#24304d]" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#24304d]" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-7 gap-2 text-center text-xs">
              {DAY_LABELS.map((label, index) => (
                <div
                  key={label}
                  className={cn(
                    'font-medium',
                    index === 0 && 'text-rose-400',
                    index === 6 && 'text-sky-400',
                    index !== 0 && index !== 6 && 'text-gray-500',
                  )}
                >
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {Array.from({ length: monthGrid.firstDay }).map((_, index) => <div key={`empty-${index}`} className="h-20 sm:h-28 rounded-lg border border-transparent" />)}
              {Array.from({ length: monthGrid.daysInMonth }).map((_, index) => {
                const day = index + 1
                const dateKey = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const summary = summaryByDate.get(dateKey)
                const isSelected = selectedDate === dateKey
                const weekDayIndex = new Date(`${dateKey}T00:00:00`).getDay()
                const toneClass = summary?.completedCount
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : summary?.inProgressCount
                    ? 'border-amber-500/40 bg-amber-500/10'
                    : summary?.plannedCount
                      ? 'border-indigo-500/40 bg-indigo-500/10'
                      : 'border-[#2a3553] bg-[#11182c]'

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => setSelectedDate(dateKey)}
                    className={cn(
                      'h-20 sm:h-28 rounded-lg border p-1.5 sm:p-2 text-left transition hover:border-indigo-400/60 hover:bg-[#24304d] overflow-hidden',
                      toneClass,
                      isSelected && 'ring-2 ring-indigo-400/60',
                    )}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className={cn(
                        'text-sm font-semibold',
                        weekDayIndex === 0 && 'text-rose-300',
                        weekDayIndex === 6 && 'text-sky-300',
                        weekDayIndex !== 0 && weekDayIndex !== 6 && 'text-white',
                      )}>{day}</span>
                      {summary?.isToday && <Badge className="border-indigo-500/40 bg-indigo-500/20 px-1.5 py-0 text-[10px] text-indigo-200">今日</Badge>}
                    </div>
                    <div className="mt-1 hidden space-y-1 text-[11px] text-gray-300 sm:block">
                      <p>予定 {summary?.plannedCount ?? 0}</p>
                      <p>完了 {summary?.completedCount ?? 0}</p>
                      <p>初回 {summary?.firstVisitCount ?? 0}</p>
                      {summary && summary.nightHandoverCount > 0 && <p className="text-amber-300">申し送り {summary.nightHandoverCount}</p>}
                    </div>
                    <div className="mt-2 sm:hidden">
                      <p className="text-xs font-medium text-gray-200">{(summary?.plannedCount ?? 0) + (summary?.inProgressCount ?? 0) + (summary?.completedCount ?? 0)}人</p>
                      <p className="text-[9px] text-gray-500">その日の患者数</p>
                    </div>
                  </button>
                )
              })}
            </div>
            {loadingMonth && <p className="text-sm text-gray-400">月カレンダーを読み込み中です...</p>}
          </CardContent>
        </Card>

        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base text-white">{selectedDate ? `${selectedDate} の詳細` : '日別詳細'}</CardTitle>
              {detail?.canEditPast && <Badge className="border-amber-500/40 bg-amber-500/20 text-amber-200">Adminのみ過去修正可</Badge>}
            </div>
            {selectedSummary && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 text-xs text-gray-300">
                  <Badge className="border-[#2a3553] bg-[#11182c] text-gray-200">予定 {selectedSummary.plannedCount}</Badge>
                  <Badge className="border-[#2a3553] bg-[#11182c] text-gray-200">対応中 {selectedSummary.inProgressCount}</Badge>
                  <Badge className="border-[#2a3553] bg-[#11182c] text-gray-200">完了 {selectedSummary.completedCount}</Badge>
                  <Badge className="border-[#2a3553] bg-[#11182c] text-gray-200">初回 {selectedSummary.firstVisitCount}</Badge>
                </div>
                {canBuildRouteForSelectedDate && (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-100">
                    <span>ルート候補 {futureSelectedCount}人</span>
                    <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-500" disabled={futureSelectedCount === 0 || routePlanLoading} onClick={() => void handleSuggestRoute()}>
                      {routePlanLoading ? '作成中...' : '選んだ患者でルートを作る'}
                    </Button>
                    {routePlanResult?.ready && routePlanResult.suggestedOrder.length > 0 && (
                      <Button size="sm" variant="outline" className="border-sky-500/40 bg-sky-500/10 text-sky-100 hover:bg-sky-500/20" disabled={routeShareLoading} onClick={() => void handleSendRouteEmail()}>
                        {routeShareLoading ? '送信中...' : 'このルートをメール送信'}
                      </Button>
                    )}
                  </div>
                )}
                {routePlanResult && (
                  <div ref={routeResultRef} className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3 text-xs text-gray-200">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-white">{routePlanResult.message}</p>
                      {routePlanResult.ready && routePlanResult.suggestedOrder.length > 0 && (
                        <Badge className="border-sky-500/40 bg-sky-500/10 text-sky-100">メール送信可</Badge>
                      )}
                    </div>
                    {routeActionNotice && <p className="mt-2 text-[11px] text-sky-200">{routeActionNotice}</p>}
                    {routePlanResult.ready && routePlanResult.suggestedOrder.length > 0 && (
                      <>
                        <p className="mt-2 text-gray-400">
                          {routePlanResult.totalDuration ? `総移動時間目安: ${routePlanResult.totalDuration}` : '総移動時間: 計算中'}
                          {typeof routePlanResult.totalDistanceMeters === 'number' ? ` / 総距離: ${(routePlanResult.totalDistanceMeters / 1000).toFixed(1)}km` : ''}
                        </p>
                        <ol className="mt-3 space-y-2">
                          {routePlanResult.suggestedOrder.map((patient, index) => {
                            const previous = index === 0 ? routePlanResult.origin : routePlanResult.suggestedOrder[index - 1]
                            const mapsLink = previous?.address
                              ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(previous.address)}&destination=${encodeURIComponent(patient.address)}&travelmode=driving`
                              : null
                            return (
                              <li key={patient.id} className="rounded-lg border border-[#2a3553] bg-[#0f1728] px-3 py-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">{index + 1}</span>
                                    <span className="font-medium text-white">{patient.name}</span>
                                    <p className="mt-1 text-[11px] text-gray-400">{patient.address}</p>
                                    {mapsLink && (
                                      <a href={mapsLink} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[11px] text-sky-300 hover:text-sky-200">
                                        {index === 0 ? '起点→1件目のGoogle Maps' : `${index}→${index + 1} のGoogle Maps`}
                                      </a>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="outline" className="border-[#2a3553] bg-[#11182c] px-2 text-gray-200" disabled={index === 0} onClick={() => moveSuggestedStop(index, -1)}>↑</Button>
                                    <Button size="sm" variant="outline" className="border-[#2a3553] bg-[#11182c] px-2 text-gray-200" disabled={index === routePlanResult.suggestedOrder.length - 1} onClick={() => moveSuggestedStop(index, 1)}>↓</Button>
                                  </div>
                                </div>
                              </li>
                            )
                          })}
                        </ol>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedSummary?.staffSummaries?.length ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">スタッフ別の状況</p>
                <div className="space-y-2">
                  {selectedSummary.staffSummaries.map((staff) => (
                    <div key={staff.staffId} className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-white">{staff.staffName}</p>
                        <Badge className={cn(
                          'border text-xs',
                          staff.loadTone === 'heavy' && 'border-rose-500/40 bg-rose-500/20 text-rose-200',
                          staff.loadTone === 'medium' && 'border-amber-500/40 bg-amber-500/20 text-amber-200',
                          staff.loadTone === 'light' && 'border-emerald-500/40 bg-emerald-500/20 text-emerald-200',
                        )}>
                          {staff.loadTone === 'heavy' ? '負荷高め' : staff.loadTone === 'medium' ? '負荷中' : '負荷軽め'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">完了 {staff.completedCount} / 初回 {staff.firstVisitCount} / 距離 {staff.totalDistanceKm ?? '未集計'}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {loadingDetail ? (
              <p className="text-sm text-gray-400">日別詳細を読み込み中です...</p>
            ) : detail?.tasks?.length ? (
              <div className="space-y-3">
                {detail.tasks.map((task) => (
                  <div key={task.taskId} className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-white">{task.patientName}</p>
                      <Badge className="border-[#2a3553] bg-[#0f1728] text-gray-200">{task.status === 'completed' ? '完了' : task.status === 'in_progress' ? '対応中' : '予定'}</Badge>
                      {task.isFirstVisit && <Badge className="border-sky-500/40 bg-sky-500/20 text-sky-200">初回</Badge>}
                      {task.isLongGapVisit && <Badge className="border-violet-500/40 bg-violet-500/20 text-violet-200">久しぶり</Badge>}
                      {task.hasNightHandover && <Badge className="border-amber-500/40 bg-amber-500/20 text-amber-200">夜間申し送りあり</Badge>}
                    </div>
                    <div className="mt-2 grid gap-2 text-xs text-gray-400 sm:grid-cols-2">
                      <p className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />予定 {task.scheduledTime}</p>
                      <p className="flex items-center gap-1"><UserRound className="h-3.5 w-3.5" />担当 {task.handledBy ?? '未対応'}</p>
                      <p>完了 {task.completedAt ? task.completedAt.replace('T', ' ').slice(0, 16) : '—'}</p>
                      <p>担当変更 {task.assigneeChangedAt ? task.assigneeChangedAt.replace('T', ' ').slice(0, 16) : '—'}</p>
                    </div>
                    {task.note ? <p className="mt-2 text-xs text-gray-300">{task.note}</p> : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {task.patientId ? (
                        <Button asChild size="sm" variant="outline" className="border-[#2a3553] bg-[#0f1728] text-gray-200 hover:bg-[#1a2035]">
                          <Link href={`/dashboard/patients/${task.patientId}`}>
                            詳細を見る
                          </Link>
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled className="border-[#2a3553] bg-[#0f1728] text-gray-200 hover:bg-[#1a2035]">
                          詳細を見る
                        </Button>
                      )}
                      {canBuildRouteForSelectedDate ? (
                        task.patientId ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleRouteCandidate(task.patientId)}
                            className={cn(
                              'border-[#2a3553] text-gray-200 hover:bg-[#1a2035]',
                              selectedRouteCandidateIds.includes(task.patientId)
                                ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-100'
                                : 'bg-[#0f1728]'
                            )}
                          >
                            <Route className="mr-1 h-3.5 w-3.5" />
                            {selectedRouteCandidateIds.includes(task.patientId) ? '候補に追加済み' : 'ルート候補に追加'}
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled className="border-[#2a3553] bg-[#0f1728] text-gray-200 hover:bg-[#1a2035]">
                            <Route className="mr-1 h-3.5 w-3.5" />ルート候補に追加
                          </Button>
                        )
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#2a3553] bg-[#11182c] p-4 text-sm text-gray-400">
                選択した日の詳細はまだありません。
              </div>
            )}

            <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3 text-xs text-gray-400">
              <p className="font-medium text-gray-200">この画面の前提</p>
              <ul className="mt-2 space-y-1">
                <li>・過去は確定実績ベースで見ます</li>
                <li>・未来は予定なので変更される前提です</li>
                <li>・地図/ルートは必要時だけ使う導線にします</li>
                <li>・過去修正は Pharmacy Admin のみを想定しています</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
