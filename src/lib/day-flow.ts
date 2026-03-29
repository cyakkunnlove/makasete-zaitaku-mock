import { dayTaskData, type DayTaskItem, type PatientRecord } from '@/lib/mock-data'
import type { RegisteredPatientRecord } from '@/lib/patient-master'

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

function matchesVisitRule(patient: Pick<RegisteredPatientRecord, 'visitRules' | 'startedAt'>, flowDate: string) {
  const rules = patient.visitRules?.filter((rule) => rule.active) ?? []
  if (rules.length === 0) return false

  const currentWeekday = toWeekday(flowDate)

  return rules.some((rule) => {
    const customHit = rule.customDates.includes(flowDate)
    if (customHit) return true
    if (rule.excludedDates.includes(flowDate)) return false
    if (rule.pattern === 'custom') return false
    if (rule.weekday !== currentWeekday) return false
    if (rule.pattern === 'biweekly') {
      if (patient.startedAt) {
        const startedAt = new Date(`${patient.startedAt}T00:00:00`)
        const target = new Date(`${flowDate}T00:00:00`)
        const diffDays = Math.floor((target.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays >= 0 && diffDays % 14 === 0) return true
      }
      return hasBiweeklyAnchorMatch(rule.anchorWeek, flowDate)
    }
    return true
  })
}

function buildAutoTaskFromPatient(patient: RegisteredPatientRecord, flowDate: string, sortOrder: number): DayTaskItem {
  const activeRules = patient.visitRules?.filter((rule) => rule.active) ?? []
  const preferredTime = activeRules.find((rule) => rule.preferredTime)?.preferredTime ?? DAY_FLOW_TIME_SLOTS[(sortOrder - 1) % DAY_FLOW_TIME_SLOTS.length]
  const weekday = weekdayLabels[toWeekday(flowDate)]
  const noteParts = [
    `${weekday}曜のvisitRulesから自動生成`,
    patient.manualTags && patient.manualTags.length > 0 ? `タグ: ${patient.manualTags.slice(0, 2).join(' / ')}` : null,
    patient.visitNotes && patient.visitNotes !== '未設定' ? patient.visitNotes.split('\n')[0].replace(/^【[^】]+】/, '').trim() : null,
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

export function generateAutoDayTasksFromVisitRules(patients: RegisteredPatientRecord[], flowDate: string = MOCK_FLOW_DATE): DayTaskItem[] {
  const matchedPatients = patients
    .filter((patient) => patient.status === 'active')
    .filter((patient) => matchesVisitRule(patient, flowDate))
    .sort((a, b) => {
      const timeA = a.visitRules?.find((rule) => rule.active)?.preferredTime ?? '99:99'
      const timeB = b.visitRules?.find((rule) => rule.active)?.preferredTime ?? '99:99'
      if (timeA !== timeB) return timeA.localeCompare(timeB)
      return a.name.localeCompare(b.name, 'ja')
    })

  return matchedPatients.map((patient, index) => buildAutoTaskFromPatient(patient, flowDate, dayTaskData.length + index + 1))
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
  const generatedTasks = generateAutoDayTasksFromVisitRules(registeredPatients, flowDate)

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
