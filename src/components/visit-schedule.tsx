'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Calendar, ChevronLeft, ChevronRight, Repeat, AlertTriangle, PencilLine } from 'lucide-react'
import type { PatientVisitRule } from '@/lib/patient-master'
import {
  collectVisitRuleDates,
  formatVisitCalendarDateKey,
  formatVisitCalendarMonth,
  getVisitCalendarMonthDays,
  VISIT_CALENDAR_DAY_LABELS,
} from '@/lib/visit-calendar'

interface VisitScheduleProps {
  patientId: string
  visitRules?: PatientVisitRule[]
  canEdit?: boolean
  onSave?: (visitRules: PatientVisitRule[]) => void
}

const DAY_LABELS = VISIT_CALENDAR_DAY_LABELS
const PATTERN_LABELS: Record<PatientVisitRule['pattern'], string> = {
  weekly: '毎週',
  biweekly: '隔週',
  custom: 'カスタム',
}

export function VisitSchedule({ patientId, visitRules = [], canEdit = false, onSave }: VisitScheduleProps) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [isEditing, setIsEditing] = useState(false)
  const [weeklyWeekday, setWeeklyWeekday] = useState('1')
  const [preferredTime, setPreferredTime] = useState('10:00')
  const [monthlyVisitLimitInput, setMonthlyVisitLimitInput] = useState('4')
  const [draftCustomDates, setDraftCustomDates] = useState<string[]>([])
  const [draftExcludedDates, setDraftExcludedDates] = useState<string[]>([])

  const activeRules = useMemo(() => visitRules.filter((rule) => rule.active), [visitRules])

  useEffect(() => {
    const firstRule = activeRules[0]
    const customRule = activeRules.find((rule) => rule.pattern === 'custom')
    setWeeklyWeekday(String(firstRule?.weekday ?? 1))
    setPreferredTime(firstRule?.preferredTime ?? '10:00')
    setMonthlyVisitLimitInput(String(firstRule?.monthlyVisitLimit ?? 4))
    setDraftCustomDates(customRule?.customDates ?? [])
    setDraftExcludedDates(activeRules.flatMap((rule) => rule.excludedDates))
  }, [activeRules])

  const editingRules = useMemo(() => {
    const monthlyVisitLimit = Math.max(1, Number(monthlyVisitLimitInput) || 4)
    const nextRules: PatientVisitRule[] = [{
      id: `${patientId}-weekly`,
      pattern: 'weekly',
      weekday: Number(weeklyWeekday),
      intervalWeeks: 1,
      anchorWeek: null,
      preferredTime: preferredTime || null,
      monthlyVisitLimit,
      active: true,
      customDates: [],
      excludedDates: draftExcludedDates,
    }]

    if (draftCustomDates.length > 0) {
      nextRules.push({
        id: `${patientId}-custom`,
        pattern: 'custom',
        weekday: null,
        intervalWeeks: 1,
        anchorWeek: null,
        preferredTime: preferredTime || null,
        monthlyVisitLimit,
        active: true,
        customDates: draftCustomDates,
        excludedDates: [],
      })
    }

    return nextRules
  }, [draftCustomDates, draftExcludedDates, monthlyVisitLimitInput, patientId, preferredTime, weeklyWeekday])

  const displayRules = isEditing ? editingRules : activeRules
  const { scheduled, custom, excluded } = useMemo(
    () => collectVisitRuleDates(displayRules, viewYear, viewMonth),
    [displayRules, viewYear, viewMonth],
  )
  const { firstDay, daysInMonth } = getVisitCalendarMonthDays(viewYear, viewMonth)

  const monthlyVisitLimit = activeRules.reduce((max, rule) => Math.max(max, rule.monthlyVisitLimit), 0)
  const monthVisitCount = scheduled.size
  const isOverLimit = monthlyVisitLimit > 0 && monthVisitCount > monthlyVisitLimit

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1)
      setViewMonth(11)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1)
      setViewMonth(0)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  return (
    <Card className="border-[#2a3553] bg-[#1a2035]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-sm text-white">
            <Calendar className="h-4 w-4 text-indigo-400" />
            訪問スケジュール
          </CardTitle>
          {canEdit && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="border-[#2a3553] text-gray-200 hover:bg-[#11182c]">キャンセル</Button>
                  <Button size="sm" onClick={() => { onSave?.(editingRules); setIsEditing(false) }} className="bg-indigo-600 text-white hover:bg-indigo-700">保存</Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="border-[#2a3553] text-gray-200 hover:bg-[#11182c]">
                  <PencilLine className="mr-1 h-4 w-4" />
                  修正する
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing && (
          <div className="grid gap-3 rounded-lg border border-[#2a3553] bg-[#11182c] p-3 md:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500">訪問曜日</p>
              <select value={weeklyWeekday} onChange={(e) => setWeeklyWeekday(e.target.value)} className="mt-1 w-full rounded-md border border-[#2a3553] bg-[#0a0e1a] px-3 py-2 text-sm text-gray-100">
                <option value="1">月曜</option><option value="2">火曜</option><option value="3">水曜</option><option value="4">木曜</option><option value="5">金曜</option><option value="6">土曜</option><option value="0">日曜</option>
              </select>
            </div>
            <div>
              <p className="text-xs text-gray-500">優先時間</p>
              <input value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} className="mt-1 w-full rounded-md border border-[#2a3553] bg-[#0a0e1a] px-3 py-2 text-sm text-gray-100" />
            </div>
            <div>
              <p className="text-xs text-gray-500">月回数</p>
              <input value={monthlyVisitLimitInput} onChange={(e) => setMonthlyVisitLimitInput(e.target.value)} className="mt-1 w-full rounded-md border border-[#2a3553] bg-[#0a0e1a] px-3 py-2 text-sm text-gray-100" />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs text-gray-400">現在の訪問ルール</p>
          {activeRules.length === 0 ? (
            <p className="text-sm text-gray-500">訪問ルールはまだ設定されていません。</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activeRules.map((rule) => (
                <Badge key={rule.id} variant="outline" className="border-indigo-500/40 bg-indigo-500/20 text-indigo-200">
                  {PATTERN_LABELS[rule.pattern]}
                  {rule.weekday != null ? ` / ${DAY_LABELS[rule.weekday]}曜` : ''}
                  {rule.pattern === 'biweekly' ? ` / ${rule.anchorWeek === 2 ? '第2・4週' : '第1・3週'}` : ''}
                  {rule.preferredTime ? ` / ${rule.preferredTime}` : ''}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between rounded-lg border border-[#2a3553] bg-[#0a0e1a] p-3">
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-400">今月の予定回数</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('text-lg font-bold', isOverLimit ? 'text-rose-400' : 'text-emerald-400')}>
              {monthVisitCount}
            </span>
            <span className="text-xs text-gray-500">/ {monthlyVisitLimit || '—'}回</span>
            {isOverLimit && (
              <Badge variant="outline" className="border-amber-500/40 bg-amber-500/20 text-amber-300 text-[10px]">
                <AlertTriangle className="mr-1 h-3 w-3" />
                警告のみ
              </Badge>
            )}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <button onClick={prevMonth} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-[#212b45] hover:text-white">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-white">{formatVisitCalendarMonth(viewYear, viewMonth)}</span>
            <button onClick={nextMonth} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-[#212b45] hover:text-white">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1">
            {DAY_LABELS.map((label, i) => (
              <div key={i} className={cn('py-1 text-center text-[10px] font-medium', i === 0 ? 'text-rose-400' : i === 6 ? 'text-sky-400' : 'text-gray-500')}>
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const date = new Date(viewYear, viewMonth, day)
              const dateStr = formatVisitCalendarDateKey(date)
              const isScheduled = scheduled.has(dateStr)
              const isCustom = custom.has(dateStr)
              const isExcluded = excluded.has(dateStr) && !isCustom
              const isToday = dateStr === formatVisitCalendarDateKey(today)

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    if (!isEditing) return
                    if (isCustom) {
                      setDraftCustomDates((prev) => prev.filter((item) => item !== dateStr))
                      return
                    }
                    if (isExcluded) {
                      setDraftExcludedDates((prev) => prev.filter((item) => item !== dateStr))
                      return
                    }
                    if (isScheduled) {
                      setDraftExcludedDates((prev) => Array.from(new Set([...prev, dateStr])).sort())
                      return
                    }
                    setDraftCustomDates((prev) => Array.from(new Set([...prev, dateStr])).sort())
                  }}
                  className={cn(
                    'relative flex h-9 items-center justify-center rounded-lg text-xs font-medium',
                    isEditing && 'cursor-pointer hover:ring-1 hover:ring-indigo-400/60',
                    isCustom
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                      : isScheduled
                        ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/30'
                        : isExcluded
                          ? 'border border-rose-500/30 bg-[#0a0e1a] text-rose-300 line-through'
                          : 'bg-[#0a0e1a] text-gray-400',
                    isToday && 'ring-1 ring-indigo-500/50',
                  )}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-[10px] text-gray-500">
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-indigo-500" />通常ルール</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-500" />追加日</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded border border-rose-500/30 bg-[#0a0e1a]" />除外日</span>
        </div>

        <p className="text-[10px] text-gray-500">
          {isEditing
            ? '編集中はカレンダーを直接押して、予定日を除外、空き日を追加できます。追加日を再度押すと解除されます。'
            : '保存されている訪問ルールを表示しています。追加日は除外日より優先され、月回数の超過は警告のみで予定作成自体は止めません。'}
        </p>
      </CardContent>
    </Card>
  )
}
