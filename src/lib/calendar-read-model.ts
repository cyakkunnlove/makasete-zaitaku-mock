import type { PatientDayTask, Patient } from '@/types/database'

type StaffSummary = {
  staffId: string
  staffName: string
  plannedCount: number
  completedCount: number
  firstVisitCount: number
  totalDistanceKm: number | null
  loadTone: 'light' | 'medium' | 'heavy'
}

export type CalendarDaySummary = {
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

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function calculateLoadTone(input: Pick<StaffSummary, 'completedCount' | 'firstVisitCount'>) {
  const score = input.completedCount + input.firstVisitCount * 1.5
  if (score >= 5) return 'heavy' as const
  if (score >= 2) return 'medium' as const
  return 'light' as const
}

function isNightHandoverTask(task: PatientDayTask) {
  return task.note.includes('夜間申し送り')
}

function buildFirstVisitSet(tasks: PatientDayTask[]) {
  const firstVisitTaskIds = new Set<string>()
  const completedByPatient = new Map<string, string[]>()

  const completedTasks = tasks
    .filter((task) => task.patient_id)
    .filter((task) => task.status === 'completed' || Boolean(task.completed_at))
    .sort((a, b) => {
      if (a.flow_date !== b.flow_date) return a.flow_date.localeCompare(b.flow_date)
      return (a.completed_at ?? '').localeCompare(b.completed_at ?? '')
    })

  completedTasks.forEach((task) => {
    const patientId = task.patient_id
    if (!patientId) return
    const priorDates = completedByPatient.get(patientId) ?? []
    if (priorDates.length === 0) {
      firstVisitTaskIds.add(task.id)
    }
    priorDates.push(task.flow_date)
    completedByPatient.set(patientId, priorDates)
  })

  return firstVisitTaskIds
}

export function buildCalendarMonthSummary(input: {
  tasks: PatientDayTask[]
  patients?: Patient[]
  year: number
  month: number
  today?: string
}) {
  const monthKey = `${input.year}-${String(input.month).padStart(2, '0')}`
  const today = input.today ?? toDateKey(new Date())
  const firstVisitTaskIds = buildFirstVisitSet(input.tasks)

  const monthTasks = input.tasks.filter((task) => task.flow_date.startsWith(`${monthKey}-`))
  const dayMap = new Map<string, CalendarDaySummary>()

  monthTasks.forEach((task) => {
    const date = task.flow_date
    const existing = dayMap.get(date) ?? {
      date,
      isPast: date < today,
      isToday: date === today,
      plannedCount: 0,
      inProgressCount: 0,
      completedCount: 0,
      firstVisitCount: 0,
      nightHandoverCount: 0,
      staffSummaries: [],
    }

    if (task.status === 'completed') existing.completedCount += 1
    else if (task.status === 'in_progress') existing.inProgressCount += 1
    else existing.plannedCount += 1

    if (firstVisitTaskIds.has(task.id)) existing.firstVisitCount += 1
    if (isNightHandoverTask(task)) existing.nightHandoverCount += 1

    const actorId = task.handled_by_id ?? task.planned_by_id
    const actorName = task.handled_by ?? task.planned_by
    if (actorId && actorName) {
      const current = existing.staffSummaries.find((summary) => summary.staffId === actorId) ?? {
        staffId: actorId,
        staffName: actorName,
        plannedCount: 0,
        completedCount: 0,
        firstVisitCount: 0,
        totalDistanceKm: null,
        loadTone: 'light' as const,
      }

      if (task.status === 'completed') current.completedCount += 1
      else current.plannedCount += 1
      if (firstVisitTaskIds.has(task.id)) current.firstVisitCount += 1
      current.loadTone = calculateLoadTone(current)

      if (!existing.staffSummaries.some((summary) => summary.staffId === actorId)) {
        existing.staffSummaries.push(current)
      }
    }

    dayMap.set(date, existing)
  })

  return Array.from(dayMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((summary) => ({
      ...summary,
      staffSummaries: [...summary.staffSummaries].sort((a, b) => {
        const aScore = a.completedCount + a.firstVisitCount
        const bScore = b.completedCount + b.firstVisitCount
        if (aScore !== bScore) return bScore - aScore
        return a.staffName.localeCompare(b.staffName, 'ja')
      }),
    }))
}
