'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Calendar, ChevronLeft, ChevronRight, Repeat, AlertTriangle } from 'lucide-react'

type VisitPattern = 'weekly' | 'biweekly' | 'custom'

interface VisitScheduleProps {
  patientId: string
  // In real app, these would come from DB
  initialPattern?: VisitPattern
  initialDayOfWeek?: number // 0=Sun ... 6=Sat
  initialVisitDates?: string[] // ISO date strings for the month
}

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']
const PATTERN_LABELS: Record<VisitPattern, string> = {
  weekly: '毎週',
  biweekly: '隔週',
  custom: 'カスタム',
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return { firstDay, daysInMonth }
}

function formatMonth(year: number, month: number) {
  return `${year}年${month + 1}月`
}

export function VisitSchedule({ initialPattern = 'weekly', initialDayOfWeek = 4, initialVisitDates }: VisitScheduleProps) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [pattern, setPattern] = useState<VisitPattern>(initialPattern)
  const [dayOfWeek, setDayOfWeek] = useState(initialDayOfWeek) // Thursday default
  const [customDates, setCustomDates] = useState<Set<string>>(new Set(initialVisitDates ?? []))

  // Generate visit dates based on pattern
  const visitDates = useMemo(() => {
    if (pattern === 'custom') return customDates

    const dates = new Set<string>()
    const { daysInMonth } = getMonthDays(viewYear, viewMonth)
    let weekCount = 0

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewYear, viewMonth, day)
      if (date.getDay() === dayOfWeek) {
        weekCount++
        if (pattern === 'weekly') {
          if (weekCount <= 4) { // Max 4 per month
            dates.add(date.toISOString().split('T')[0])
          }
        } else if (pattern === 'biweekly') {
          if (weekCount % 2 === 1 && weekCount <= 4) {
            dates.add(date.toISOString().split('T')[0])
          }
        }
      }
    }
    return dates
  }, [pattern, dayOfWeek, viewYear, viewMonth, customDates])

  const monthVisitCount = visitDates.size
  const isOverLimit = monthVisitCount > 4

  const toggleDate = (dateStr: string) => {
    const next = new Set(customDates)
    if (next.has(dateStr)) {
      next.delete(dateStr)
    } else {
      next.add(dateStr)
    }
    setCustomDates(next)
  }

  const { firstDay, daysInMonth } = getMonthDays(viewYear, viewMonth)

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

  // For auto-generated patterns, allow skipping individual dates
  const [skippedDates, setSkippedDates] = useState<Set<string>>(new Set())
  const toggleSkip = (dateStr: string) => {
    if (pattern === 'custom') {
      toggleDate(dateStr)
      return
    }
    const next = new Set(skippedDates)
    if (next.has(dateStr)) {
      next.delete(dateStr)
    } else {
      next.add(dateStr)
    }
    setSkippedDates(next)
  }

  const effectiveDates = useMemo(() => {
    if (pattern === 'custom') return visitDates
    const dates = new Set<string>()
    visitDates.forEach((d) => {
      if (!skippedDates.has(d)) dates.add(d)
    })
    return dates
  }, [visitDates, skippedDates, pattern])

  const effectiveCount = effectiveDates.size

  return (
    <Card className="border-[#2a3553] bg-[#1a2035]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm text-white">
          <Calendar className="h-4 w-4 text-indigo-400" />
          訪問スケジュール
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pattern Selector */}
        <div className="space-y-2">
          <p className="text-xs text-gray-400">基本パターン</p>
          <div className="flex gap-2">
            {(Object.keys(PATTERN_LABELS) as VisitPattern[]).map((p) => (
              <Button
                key={p}
                variant="outline"
                size="sm"
                onClick={() => setPattern(p)}
                className={cn(
                  'h-8 border text-xs',
                  pattern === p
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                    : 'border-[#2a3553] bg-[#0a0e1a] text-gray-400 hover:bg-[#212b45]'
                )}
              >
                {PATTERN_LABELS[p]}
              </Button>
            ))}
          </div>
        </div>

        {/* Day of Week Selector (for weekly/biweekly) */}
        {pattern !== 'custom' && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400">訪問曜日</p>
            <div className="flex gap-1">
              {DAY_LABELS.map((label, i) => (
                <button
                  key={i}
                  onClick={() => setDayOfWeek(i)}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition',
                    dayOfWeek === i
                      ? 'bg-indigo-500 text-white'
                      : 'bg-[#0a0e1a] text-gray-400 hover:bg-[#212b45]',
                    i === 0 && 'text-rose-400',
                    i === 6 && 'text-sky-400'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Count + Limit Warning */}
        <div className="flex items-center justify-between rounded-lg border border-[#2a3553] bg-[#0a0e1a] p-3">
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-400">今月の訪問回数</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('text-lg font-bold', isOverLimit ? 'text-rose-400' : effectiveCount === 4 ? 'text-amber-400' : 'text-emerald-400')}>
              {effectiveCount}
            </span>
            <span className="text-xs text-gray-500">/ 4回</span>
            {isOverLimit && (
              <Badge variant="outline" className="border-rose-500/40 bg-rose-500/20 text-rose-300 text-[10px]">
                <AlertTriangle className="mr-1 h-3 w-3" />
                上限超過
              </Badge>
            )}
          </div>
        </div>

        {/* Calendar */}
        <div>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="rounded-lg p-1.5 text-gray-400 hover:bg-[#212b45] hover:text-white transition">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-white">{formatMonth(viewYear, viewMonth)}</span>
            <button onClick={nextMonth} className="rounded-lg p-1.5 text-gray-400 hover:bg-[#212b45] hover:text-white transition">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className={cn(
                  'text-center text-[10px] font-medium py-1',
                  i === 0 ? 'text-rose-400' : i === 6 ? 'text-sky-400' : 'text-gray-500'
                )}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const date = new Date(viewYear, viewMonth, day)
              const isScheduled = visitDates.has(dateStr) && !skippedDates.has(dateStr)
              const isSkipped = visitDates.has(dateStr) && skippedDates.has(dateStr)
              const isCustomSelected = pattern === 'custom' && customDates.has(dateStr)
              const isToday = dateStr === today.toISOString().split('T')[0]
              const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate())

              return (
                <button
                  key={day}
                  onClick={() => toggleSkip(dateStr)}
                  className={cn(
                    'relative flex h-9 items-center justify-center rounded-lg text-xs font-medium transition',
                    isScheduled || isCustomSelected
                      ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/30'
                      : isSkipped
                        ? 'bg-[#0a0e1a] text-gray-600 line-through'
                        : 'bg-[#0a0e1a] text-gray-400 hover:bg-[#212b45]',
                    isToday && !isScheduled && !isCustomSelected && 'ring-1 ring-indigo-500/50',
                    isPast && !isScheduled && !isCustomSelected && 'opacity-40'
                  )}
                >
                  {day}
                  {isToday && (
                    <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-indigo-400" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-indigo-500" />
            訪問予定
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-[#0a0e1a] border border-[#2a3553] line-through" />
            スキップ
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-[#0a0e1a] ring-1 ring-indigo-500/50" />
            今日
          </span>
        </div>

        {/* Helper Text */}
        <p className="text-[10px] text-gray-500">
          {pattern === 'custom'
            ? '日付をタップして訪問日を選択/解除できます'
            : '自動生成された日程をタップしてスキップ/復帰できます（月4回上限）'}
        </p>
      </CardContent>
    </Card>
  )
}
