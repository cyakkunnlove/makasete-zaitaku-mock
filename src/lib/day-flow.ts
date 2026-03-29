import { dayTaskData, type DayTaskItem, type PatientRecord } from '@/lib/mock-data'
import type { PatientVisitRule, RegisteredPatientRecord } from '@/lib/patient-master'

export const MOCK_FLOW_DATE = '2026-03-28'

const DAY_FLOW_TIME_SLOTS = ['09:30', '11:00', '13:30', '15:00', '16:30'] as const
const weekdayLabels = ['日', '月', '火', '水', '木', '金', '土'] as const

function toWeekday(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`).getDay()
}

function formatCurrencyRiskAmount(patient: Pick<PatientRecord, 'riskScore'>) {
  return 9000 + patient.riskScore * 600
}

function formatDayTaskId(patientId: string, flowDate: string) {
  return `DT-AUTO-${flowDate.replaceAll('-', '')}-${patientId}`
}

function getWeekOfMonth(flowDate: string) {
  return Math.ceil(Number(flowDate.slice(-2)) / 7)
}

function hasBiweeklyAnchorMatch(anchorWeek: 1 | 2 | null, flowDate: string) {
  const weekOfMonth = getWeekOfMonth(flowDate)
  if (anchorWeek === 2) return weekOfMonth % 2 === 0
  return weekOfMonth % 2 === 1
}

function parseDateKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`)
}

function diffDays(from: string, to: string) {
  return Math.floor((parseDateKey(to).getTime() - parseDateKey(from).getTime()) / (1000 * 60 * 60 * 24))
}

function buildVisitHistory(tasks: DayTaskItem[], flowDate: string) {
  const history = new Map<string, string[]>()

  tasks
    .filter((task) => task.completedAt || task.handledAt || task.status === 'completed')
    .filter((task) => task.flowDate < flowDate)
    .forEach((task) => {
      const current = history.get(task.patientId) ?? []
      current.push(task.flowDate)
      history.set(task.patientId, current)
    })

  history.forEach((dates, patientId) => {
    const uniqueSorted = Array.from(new Set(dates)).sort((a, b) => a.localeCompare(b))
    history.set(patientId, uniqueSorted)
  })

  return history
}

function getLastVisitDate(patientId: string, visitHistory: Map<string, string[]>) {
  const dates = visitHistory.get(patientId) ?? []
  return dates.length > 0 ? dates[dates.length - 1] : null
}

function getPreferredTime(rules: PatientVisitRule[]) {
  return rules.find((rule) => rule.preferredTime)?.preferredTime ?? null
}

function getMonthlyVisitCount(patientId: string, monthKey: string, tasks: DayTaskItem[], flowDate: string) {
  const completedDates = new Set(
    tasks
      .filter((task) => task.patientId === patientId)
      .filter((task) => task.flowDate.startsWith(monthKey))
      .filter((task) => task.flowDate <= flowDate)
      .filter((task) => task.completedAt || task.handledAt || task.status === 'completed')
      .map((task) => task.flowDate),
  )

  return completedDates.size
}

function getMatchingRules(
  patient: Pick<RegisteredPatientRecord, 'id' | 'visitRules' | 'startedAt'>,
  flowDate: string,
  visitHistory: Map<string, string[]>,
) {
  const rules = patient.visitRules?.filter((rule) => rule.active) ?? []
  if (rules.length === 0) return [] as PatientVisitRule[]

  const customMatchedRules = rules.filter((rule) => rule.customDates.includes(flowDate))
  if (customMatchedRules.length > 0) return customMatchedRules

  const currentWeekday = toWeekday(flowDate)
  const lastVisitDate = getLastVisitDate(patient.id, visitHistory)

  return rules.filter((rule) => {
    if (rule.excludedDates.includes(flowDate)) return false
    if (rule.pattern === 'custom') return false
    if (rule.weekday !== currentWeekday) return false

    if (rule.pattern === 'biweekly') {
      if (lastVisitDate) {
        const daysSinceLastVisit = diffDays(lastVisitDate, flowDate)
        if (daysSinceLastVisit === 14) return true
        if (daysSinceLastVisit >= 0 && daysSinceLastVisit < 14) return false
      }

      return hasBiweeklyAnchorMatch(rule.anchorWeek, flowDate)
    }

    return true
  })
}

function buildAutoTaskFromPatient(
  patient: RegisteredPatientRecord,
  flowDate: string,
  sortOrder: number,
  matchedRules: PatientVisitRule[],
  monthVisitCount: number,
  lastVisitDate: string | null,
): DayTaskItem {
  const preferredTime = getPreferredTime(matchedRules) ?? DAY_FLOW_TIME_SLOTS[(sortOrder - 1) % DAY_FLOW_TIME_SLOTS.length]
  const weekday = weekdayLabels[toWeekday(flowDate)]
  const monthlyLimit = matchedRules.reduce((max, rule) => Math.max(max, rule.monthlyVisitLimit), 0)
  const limitWarning = monthlyLimit > 0 && monthVisitCount >= monthlyLimit

  const noteParts = [
    `${weekday}曜のvisitRulesから自動生成`,
    matchedRules.some((rule) => rule.customDates.includes(flowDate)) ? '追加日を優先して反映' : null,
    matchedRules.some((rule) => rule.pattern === 'biweekly')
      ? lastVisitDate
        ? `隔週（前回 ${lastVisitDate} から2週間優先）`
        : `隔週（${matchedRules.find((rule) => rule.pattern === 'biweekly')?.anchorWeek === 2 ? '第2・4週' : '第1・3週'}）`
      : null,
    patient.manualTags && patient.manualTags.length > 0 ? `タグ: ${patient.manualTags.slice(0, 2).join(' / ')}` : null,
    patient.visitNotes && patient.visitNotes !== '未設定' ? patient.visitNotes.split('\n')[0].replace(/^【[^】]+】/, '').trim() : null,
    limitWarning ? `月${monthlyLimit}回上限は警告のみ（今月 ${monthVisitCount + 1} 回目想定）` : null,
  ].filter(Boolean)

  return {
    id: formatDayTaskId(patient.id, flowDate),
    patientId: patient.id,
    pharmacyId: patient.pharmacyId,
    flowDate,
    sortOrder,
    scheduledTime: preferredTime ?? DAY_FLOW_TIME_SLOTS[(sortOrder - 1) % DAY_FLOW_TIME_SLOTS.length],
    visitType: '定期',
    source: '自動生成',
    status: 'scheduled',
    planningStatus: 'unplanned',
    plannedBy: null,
    plannedById: null,
    plannedAt: null,
    handledBy: null,
    handledById: null,
    handledAt: null,
    completedAt: null,
    billable: false,
    collectionStatus: '未着手',
    amount: formatCurrencyRiskAmount(patient),
    note: noteParts.join('。'),
    updatedAt: patient.registrationMeta?.updatedAt ?? null,
    updatedById: patient.registrationMeta?.updatedById ?? null,
  }
}

export function generateAutoDayTasksFromVisitRules(
  patients: RegisteredPatientRecord[],
  flowDate: string = MOCK_FLOW_DATE,
  taskHistory: DayTaskItem[] = dayTaskData,
): DayTaskItem[] {
  const visitHistory = buildVisitHistory(taskHistory, flowDate)
  const monthKey = flowDate.slice(0, 7)

  const matchedPatients = patients
    .filter((patient) => patient.status === 'active')
    .map((patient) => ({
      patient,
      matchedRules: getMatchingRules(patient, flowDate, visitHistory),
    }))
    .filter((entry) => entry.matchedRules.length > 0)
    .sort((a, b) => {
      const timeA = getPreferredTime(a.matchedRules) ?? '99:99'
      const timeB = getPreferredTime(b.matchedRules) ?? '99:99'
      if (timeA !== timeB) return timeA.localeCompare(timeB)
      return a.patient.name.localeCompare(b.patient.name, 'ja')
    })

  return matchedPatients.map(({ patient, matchedRules }, index) => {
    const monthVisitCount = getMonthlyVisitCount(patient.id, monthKey, taskHistory, flowDate)
    const lastVisitDate = getLastVisitDate(patient.id, visitHistory)
    return buildAutoTaskFromPatient(patient, flowDate, dayTaskData.length + index + 1, matchedRules, monthVisitCount, lastVisitDate)
  })
}

export function mergeDayFlowTasks(options: {
  baseTasks?: DayTaskItem[]
  flowDate?: string
  registeredPatients?: RegisteredPatientRecord[]
  persistedTasks?: DayTaskItem[]
}) {
  const flowDate = options.flowDate ?? MOCK_FLOW_DATE
  const baseTasks = options.baseTasks ?? dayTaskData
  const registeredPatients = options.registeredPatients ?? []
  const persistedTasks = options.persistedTasks ?? []
  const taskHistory = [...baseTasks, ...persistedTasks]
  const generatedTasks = generateAutoDayTasksFromVisitRules(registeredPatients, flowDate, taskHistory)

  const persistedById = new Map(persistedTasks.map((task) => [task.id, task]))
  const generatedById = new Map(generatedTasks.map((task) => [task.id, task]))

  const seeded = baseTasks
    .filter((task) => task.flowDate === flowDate)
    .map((task) => persistedById.get(task.id) ?? task)

  const manualPersistedOnly = persistedTasks.filter((task) => task.flowDate === flowDate && !generatedById.has(task.id) && !baseTasks.some((baseTask) => baseTask.id === task.id))

  const generatedResolved = generatedTasks.map((task) => persistedById.get(task.id) ?? task)

  return [...seeded, ...manualPersistedOnly, ...generatedResolved]
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
      return a.scheduledTime.localeCompare(b.scheduledTime)
    })
    .map((task, index) => ({ ...task, sortOrder: index + 1 }))
}
