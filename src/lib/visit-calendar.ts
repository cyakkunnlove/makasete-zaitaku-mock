import type { PatientVisitRule } from '@/lib/patient-master'

export const VISIT_CALENDAR_DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const

export function getVisitCalendarMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return { firstDay, daysInMonth }
}

export function formatVisitCalendarMonth(year: number, month: number) {
  return `${year}年${month + 1}月`
}

export function formatVisitCalendarDateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function weekOfMonth(day: number) {
  return Math.ceil(day / 7)
}

export function matchesVisitRule(rule: PatientVisitRule, dateStr: string, day: number, weekday: number) {
  if (!rule.active) return false
  if (rule.customDates.includes(dateStr)) return true
  if (rule.excludedDates.includes(dateStr)) return false
  if (rule.pattern === 'custom') return false
  if (rule.weekday !== weekday) return false
  if (rule.pattern === 'biweekly') {
    const week = weekOfMonth(day)
    return rule.anchorWeek === 2 ? week % 2 === 0 : week % 2 === 1
  }
  return true
}

export function collectVisitRuleDates(rules: PatientVisitRule[], year: number, month: number) {
  const { daysInMonth } = getVisitCalendarMonthDays(year, month)
  const scheduled = new Set<string>()
  const custom = new Set<string>()
  const excluded = new Set<string>()
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}-`

  rules.filter((rule) => rule.active).forEach((rule) => {
    rule.customDates.forEach((dateStr) => {
      if (dateStr.startsWith(monthPrefix)) custom.add(dateStr)
    })
    rule.excludedDates.forEach((dateStr) => {
      if (dateStr.startsWith(monthPrefix)) excluded.add(dateStr)
    })
  })

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const dateStr = formatVisitCalendarDateKey(date)
    const weekday = date.getDay()
    const hasCustom = rules.some((rule) => rule.active && rule.customDates.includes(dateStr))

    if (hasCustom) {
      scheduled.add(dateStr)
      continue
    }

    if (rules.some((rule) => matchesVisitRule(rule, dateStr, day, weekday))) {
      scheduled.add(dateStr)
    }
  }

  return { scheduled, custom, excluded }
}
