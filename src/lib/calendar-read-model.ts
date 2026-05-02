import type { PatientDayTask, Patient } from '@/types/database'
import { mapCollectionDbStatusToApp } from '@/lib/status-meta'

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
  totalCount: number
  confirmedCount: number
  generatedCandidateCount: number
  plannedCount: number
  inProgressCount: number
  completedCount: number
  completedBillableCount: number
  collectedCount: number
  uncollectedCompletedCount: number
  allCompleted: boolean
  allCollected: boolean
  firstVisitCount: number
  nightHandoverCount: number
  staffSummaries: StaffSummary[]
}

export type CalendarDayTaskDetail = {
  taskId: string
  patientId: string | null
  patientName: string
  scheduledTime: string
  source: PatientDayTask['source']
  isGeneratedCandidate: boolean
  status: PatientDayTask['status']
  handledBy: string | null
  completedAt: string | null
  isFirstVisit: boolean
  isLongGapVisit: boolean
  hasNightHandover: boolean
  assigneeChangedAt: string | null
  note: string
}

export type CalendarDayDetail = {
  date: string
  canEditPast: boolean
  tasks: CalendarDayTaskDetail[]
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

function buildCompletedDatesByPatient(tasks: PatientDayTask[]) {
  const completedByPatient = new Map<string, string[]>()

  tasks
    .filter((task) => task.patient_id)
    .filter((task) => task.status === 'completed' || Boolean(task.completed_at))
    .sort((a, b) => a.flow_date.localeCompare(b.flow_date))
    .forEach((task) => {
      const patientId = task.patient_id
      if (!patientId) return
      const dates = completedByPatient.get(patientId) ?? []
      dates.push(task.flow_date)
      completedByPatient.set(patientId, Array.from(new Set(dates)).sort((x, y) => x.localeCompare(y)))
    })

  return completedByPatient
}

function diffDays(from: string, to: string) {
  const fromDate = new Date(`${from}T00:00:00`)
  const toDate = new Date(`${to}T00:00:00`)
  return Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
}

export function buildCalendarMonthSummary(input: {
  tasks: Array<PatientDayTask & { isGeneratedCandidate?: boolean }>
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
      totalCount: 0,
      confirmedCount: 0,
      generatedCandidateCount: 0,
      plannedCount: 0,
      inProgressCount: 0,
      completedCount: 0,
      completedBillableCount: 0,
      collectedCount: 0,
      uncollectedCompletedCount: 0,
      allCompleted: false,
      allCollected: false,
      firstVisitCount: 0,
      nightHandoverCount: 0,
      staffSummaries: [],
    }

    existing.totalCount += 1
    if (task.isGeneratedCandidate) existing.generatedCandidateCount += 1
    else existing.confirmedCount += 1
    if (task.status === 'completed') existing.completedCount += 1
    else if (task.status === 'in_progress') existing.inProgressCount += 1
    else existing.plannedCount += 1

    if (task.status === 'completed' && task.billable) {
      existing.completedBillableCount += 1
      if (mapCollectionDbStatusToApp(task.collection_status) === 'paid') {
        existing.collectedCount += 1
      } else {
        existing.uncollectedCompletedCount += 1
      }
    }

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
      allCompleted: summary.totalCount > 0 && summary.completedCount === summary.totalCount,
      allCollected: summary.completedBillableCount > 0 && summary.collectedCount === summary.completedBillableCount,
      staffSummaries: [...summary.staffSummaries].sort((a, b) => {
        const aScore = a.completedCount + a.firstVisitCount
        const bScore = b.completedCount + b.firstVisitCount
        if (aScore !== bScore) return bScore - aScore
        return a.staffName.localeCompare(b.staffName, 'ja')
      }),
    }))
}

export function buildCalendarDayDetail(input: {
  tasks: Array<PatientDayTask & { isGeneratedCandidate?: boolean }>
  date: string
  today?: string
  canEditPast?: boolean
  patientsById?: Map<string, Pick<Patient, 'id' | 'full_name'>>
}) {
  const today = input.today ?? toDateKey(new Date())
  const firstVisitTaskIds = buildFirstVisitSet(input.tasks)
  const completedDatesByPatient = buildCompletedDatesByPatient(input.tasks)

  const tasks = input.tasks
    .filter((task) => task.flow_date === input.date)
    .sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
      return a.scheduled_time.localeCompare(b.scheduled_time)
    })

  const details: CalendarDayTaskDetail[] = tasks.map((task) => {
    const patient = task.patient_id ? input.patientsById?.get(task.patient_id) : null
    const priorDates = task.patient_id ? (completedDatesByPatient.get(task.patient_id) ?? []).filter((date) => date < input.date) : []
    const lastDate = priorDates.length > 0 ? priorDates[priorDates.length - 1] : null
    const isLongGapVisit = lastDate ? diffDays(lastDate, input.date) >= 42 : false

    return {
      taskId: task.id,
      patientId: task.patient_id,
      patientName: patient?.full_name ?? '患者不明',
      scheduledTime: task.scheduled_time,
      source: task.source,
      isGeneratedCandidate: Boolean(task.isGeneratedCandidate),
      status: task.status,
      handledBy: task.handled_by,
      completedAt: task.completed_at,
      isFirstVisit: firstVisitTaskIds.has(task.id),
      isLongGapVisit,
      hasNightHandover: isNightHandoverTask(task),
      assigneeChangedAt: task.updated_at !== task.created_at ? task.updated_at : null,
      note: task.note,
    }
  })

  return {
    date: input.date,
    canEditPast: Boolean(input.canEditPast && input.date < today),
    tasks: details,
  }
}
