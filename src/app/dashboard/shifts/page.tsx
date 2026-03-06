'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { staffData } from '@/lib/mock-data'
import type { ShiftType } from '@/types/database'

const pharmacists = staffData.filter((s) => s.role === 'pharmacist')

const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日']

function getWeekDates(baseDate: Date): Date[] {
  const d = new Date(baseDate)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(d)
    date.setDate(d.getDate() + i)
    return date
  })
}

function fmt(d: Date) {
  return d.toISOString().slice(0, 10)
}

function fmtShort(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`
}

type ShiftMap = Record<string, Record<string, ShiftType | null>>

const initialShifts: ShiftMap = {
  'ST-02': { '2026-03-02': 'primary', '2026-03-03': null, '2026-03-04': 'primary', '2026-03-05': 'backup', '2026-03-06': 'primary', '2026-03-07': null, '2026-03-08': 'backup' },
  'ST-03': { '2026-03-02': 'backup', '2026-03-03': 'primary', '2026-03-04': null, '2026-03-05': 'primary', '2026-03-06': null, '2026-03-07': 'primary', '2026-03-08': null },
  'ST-04': { '2026-03-02': null, '2026-03-03': 'backup', '2026-03-04': 'backup', '2026-03-05': null, '2026-03-06': 'backup', '2026-03-07': null, '2026-03-08': 'primary' },
  'ST-10': { '2026-03-02': null, '2026-03-03': null, '2026-03-04': null, '2026-03-05': null, '2026-03-06': null, '2026-03-07': 'backup', '2026-03-08': null },
}

const shiftStyles: Record<ShiftType, { label: string; className: string }> = {
  primary: { label: '主番', className: 'bg-indigo-500/30 border-indigo-500/50 text-indigo-200' },
  backup: { label: '副番', className: 'bg-teal-500/30 border-teal-500/50 text-teal-200' },
}

export default function ShiftsPage() {
  const { role } = useAuth()
  const [baseDate, setBaseDate] = useState(new Date('2026-03-04'))
  const [shifts, setShifts] = useState<ShiftMap>(initialShifts)

  const weekDates = getWeekDates(baseDate)
  const today = '2026-03-06'

  const prevWeek = () => {
    setBaseDate((d) => {
      const n = new Date(d)
      n.setDate(n.getDate() - 7)
      return n
    })
  }

  const nextWeek = () => {
    setBaseDate((d) => {
      const n = new Date(d)
      n.setDate(n.getDate() + 7)
      return n
    })
  }

  const toggleShift = useCallback((staffId: string, dateKey: string) => {
    setShifts((prev) => {
      const current = prev[staffId]?.[dateKey] ?? null
      const next: ShiftType | null = current === null ? 'primary' : current === 'primary' ? 'backup' : null
      return {
        ...prev,
        [staffId]: { ...prev[staffId], [dateKey]: next },
      }
    })
  }, [])

  if (role !== 'admin' && role !== 'pharmacist') {
    return (
      <Card className="border-[#2a3553] bg-[#1a2035] text-gray-100">
        <CardHeader>
          <CardTitle className="text-base text-white">シフト管理</CardTitle>
          <CardDescription className="text-gray-400">このページは管理者または薬剤師のみ閲覧できます。</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4 text-gray-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-white">シフト管理</h1>
          <p className="text-xs text-gray-400">夜勤当番スケジュールの確認と編集</p>
        </div>
        <div className="flex items-center gap-1">
          <CalendarDays className="h-4 w-4 text-indigo-400" />
          <span className="text-sm text-gray-300">
            {fmtShort(weekDates[0])}({DAY_LABELS[0]})〜{fmtShort(weekDates[6])}({DAY_LABELS[6]})
          </span>
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-3">
        <Button size="sm" variant="ghost" onClick={prevWeek} className="text-gray-300 hover:bg-[#1a2035]">
          <ChevronLeft className="h-4 w-4" />
          前の週
        </Button>
        <Button size="sm" variant="ghost" onClick={nextWeek} className="text-gray-300 hover:bg-[#1a2035]">
          次の週
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-indigo-500/50 bg-indigo-500/30" />
          <span className="text-gray-300">主番 (primary)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-teal-500/50 bg-teal-500/30" />
          <span className="text-gray-300">副番 (backup)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-[#2a3553] bg-[#111827]" />
          <span className="text-gray-400">休み</span>
        </span>
      </div>

      {/* Desktop grid */}
      <Card className="hidden border-[#2a3553] bg-[#1a2035] md:block">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-[#1a2035] p-3 text-left text-xs font-medium text-gray-400">
                  薬剤師
                </th>
                {weekDates.map((d, i) => {
                  const dateKey = fmt(d)
                  const isToday = dateKey === today
                  return (
                    <th
                      key={dateKey}
                      className={cn(
                        'min-w-[90px] p-3 text-center text-xs font-medium',
                        isToday ? 'bg-indigo-500/10 text-indigo-300' : 'text-gray-400'
                      )}
                    >
                      <div>{DAY_LABELS[i]}</div>
                      <div className="mt-0.5 text-[11px]">{fmtShort(d)}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {pharmacists.map((p) => (
                <tr key={p.id} className="border-t border-[#2a3553]">
                  <td className="sticky left-0 z-10 bg-[#1a2035] p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{p.name}</span>
                      {p.status === 'inactive' && (
                        <Badge variant="outline" className="border-gray-500/40 bg-gray-500/20 text-[10px] text-gray-400">
                          休止
                        </Badge>
                      )}
                    </div>
                  </td>
                  {weekDates.map((d) => {
                    const dateKey = fmt(d)
                    const isToday = dateKey === today
                    const shift = shifts[p.id]?.[dateKey] ?? null
                    const style = shift ? shiftStyles[shift] : null

                    return (
                      <td
                        key={dateKey}
                        className={cn(
                          'p-2 text-center',
                          isToday && 'bg-indigo-500/5'
                        )}
                      >
                        <button
                          onClick={() => toggleShift(p.id, dateKey)}
                          className={cn(
                            'mx-auto flex h-10 w-full max-w-[80px] items-center justify-center rounded-md border text-xs font-medium transition',
                            style
                              ? style.className
                              : 'border-[#2a3553] bg-[#111827] text-gray-500 hover:border-indigo-500/30 hover:bg-[#1a2035]'
                          )}
                        >
                          {style?.label ?? ''}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Mobile view */}
      <div className="space-y-3 md:hidden">
        {weekDates.map((d, i) => {
          const dateKey = fmt(d)
          const isToday = dateKey === today
          return (
            <Card
              key={dateKey}
              className={cn(
                'border-[#2a3553] bg-[#1a2035]',
                isToday && 'border-indigo-500/50'
              )}
            >
              <CardHeader className="pb-2">
                <CardTitle className={cn('text-sm', isToday ? 'text-indigo-300' : 'text-white')}>
                  {fmtShort(d)}({DAY_LABELS[i]})
                  {isToday && <span className="ml-2 text-xs text-indigo-400">今日</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pharmacists.map((p) => {
                  const shift = shifts[p.id]?.[dateKey] ?? null
                  const style = shift ? shiftStyles[shift] : null
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleShift(p.id, dateKey)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg border p-3 text-left transition',
                        style
                          ? style.className
                          : 'border-[#2a3553] bg-[#111827] text-gray-400'
                      )}
                    >
                      <span className="text-sm font-medium">{p.name}</span>
                      <span className="text-xs">{style?.label ?? '休み'}</span>
                    </button>
                  )
                })}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
