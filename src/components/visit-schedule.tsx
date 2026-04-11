'use client'

import { useMemo, useState } from 'react'
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
  onEdit?: () => void
}

const DAY_LABELS = VISIT_CALENDAR_DAY_LABELS
const PATTERN_LABELS: Record<PatientVisitRule['pattern'], string> = {
  weekly: '毎週',
  biweekly: '隔週',
  custom: 'カスタム',
}

export function VisitSchedule({ patientId: _patientId, visitRules = [], canEdit = false, onEdit }: VisitScheduleProps) {
  void _patientId
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const activeRules = useMemo(() => visitRules.filter((rule) => rule.active), [visitRules])
  const { scheduled, custom, excluded } = useMemo(
    () => collectVisitRuleDates(activeRules, viewYear, viewMonth),
    [activeRules, viewYear, viewMonth],
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
          {canEdit && onEdit && (
            <Button size="sm" variant="outline" onClick={onEdit} className="border-[#2a3553] text-gray-200 hover:bg-[#11182c]">
              <PencilLine className="mr-1 h-4 w-4" />
              修正する
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs text-gray-400">patient master の visitRules</p>
          {activeRules.length === 0 ? (
            <p className="text-sm text-gray-500">visitRules は未設定です。</p>
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
                <div
                  key={day}
                  className={cn(
                    'relative flex h-9 items-center justify-center rounded-lg text-xs font-medium',
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
                </div>
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
          patient master の visitRules をそのまま表示しています。追加日が除外日より優先され、月間上限は警告のみで生成自体は止めません。
        </p>
      </CardContent>
    </Card>
  )
}
