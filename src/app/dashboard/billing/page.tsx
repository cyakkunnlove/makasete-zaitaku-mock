'use client'

import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { useAuth } from '@/contexts/auth-context'
import type { RegisteredPatientRecord } from '@/lib/patient-master'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { AdminPageHeader, AdminStatCard, adminCardClass, adminDialogClass, adminInputClass, adminPageClass, adminPanelClass, adminTableClass } from '@/components/admin-ui'
import { AlertCircle, CalendarDays, CheckCircle, ChevronDown, ChevronRight, FileText, Layers, Link2 } from 'lucide-react'

import { billingData, type BillingRecord, type DayTaskItem } from '@/lib/mock-data'
import { buildDayTaskCollectionRecords, type BillingCollectionRecord, type BillingDateCollectionSummary } from '@/lib/billing-read-model'
import { getBillingCollectionActions, type BillingCollectionAction } from '@/lib/billing-collection-actions'
import { DEFAULT_BILLING_PAID_CANCEL_WINDOW_MINUTES, correctionReasonCategories, getBillingPaidCorrectionAction } from '@/lib/correction-policy'
import { mapPatientDayTaskRowToDayTaskItem } from '@/lib/day-flow'
import { mergePatientSources } from '@/lib/patient-read-model'
import { billingStatusMeta, collectionWorkflowStatusMeta, mapCollectionStatusToLegacy, normalizeCollectionStatusToDb, type CollectionWorkflowStatus } from '@/lib/status-meta'
import { fetchJsonWithClientCache } from '@/lib/client-cache'
import { vibrateOnButtonPress, vibrateOnSaveSuccess } from '@/lib/haptics'

const STABLE_PATIENT_CACHE_MS = 5 * 60 * 1000

type PatientsByPharmacyResponse = {
  ok: boolean
  patients?: RegisteredPatientRecord[]
}

function getTodayJstDateKey() {
  const now = new Date()
  const jst = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))
  const year = jst.getFullYear()
  const month = String(jst.getMonth() + 1).padStart(2, '0')
  const day = String(jst.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

type CollectionStatusChangeDraft = {
  recordId: string
  patientName: string
  from: CollectionWorkflowStatus
  to: CollectionWorkflowStatus
}

type CalendarActionDraft = {
  recordId: string
  patientName: string
  visitDate: string
  amount: number
  status: CollectionWorkflowStatus
  note: string
}

type CorrectionRequestDraft = {
  recordId: string
  patientName: string
  linkedTaskId: string | null
  note: string
  reasonCategory: string
  requestedChange: string
  detail: string
}

type StaffCollectionFilter = 'all' | 'needs_action' | 'on_hold' | 'paid'
type DateCollectionFlagFilter = 'all' | 'needs_attention' | 'has_billing' | 'all_paid'

function toLegacyDayTaskCollectionStatus(status: CollectionWorkflowStatus): DayTaskItem['collectionStatus'] {
  return mapCollectionStatusToLegacy(status)
}

const onHoldReasonTags = correctionReasonCategories

const billingCorrectionTemplates = [
  {
    label: '入金確認の取り消し',
    reasonCategory: '入金確認の誤り',
    requestedChange: '入金済みを請求済みに戻したい',
    detail: '入金済みにしましたが、入金確認前のため請求済みに戻してください。',
  },
  {
    label: '金額・請求対象の確認',
    reasonCategory: '請求対象設定の訂正',
    requestedChange: '請求対象または金額を確認したい',
    detail: '請求対象または金額に確認が必要です。内容確認後に回収状態を修正してください。',
  },
  {
    label: '押し間違い',
    reasonCategory: '押し間違い',
    requestedChange: '誤って入金済みにしたため状態を戻したい',
    detail: '操作時に誤って入金済みにしました。正しい状態へ戻してください。',
  },
] as const

const initialPatientCollectionRecords = [
  { id: 'COL-01', patientName: '田中 優子', month: '2026-03', amount: 12800, status: 'paid' as CollectionWorkflowStatus, dueDate: '2026-03-10', note: '口座振替完了', linkedTaskId: 'DT-260315-01', handledBy: '小林 薫', handledAt: '2026-03-15 10:28', billable: true },
  { id: 'COL-02', patientName: '佐々木 恒一', month: '2026-03', amount: 9400, status: 'pending' as CollectionWorkflowStatus, dueDate: '2026-03-12', note: '電話フォロー予定', linkedTaskId: 'DT-260315-02', handledBy: '小林 薫', handledAt: '2026-03-15 11:58', billable: true },
  { id: 'COL-03', patientName: '中村 恒一', month: '2026-03', amount: 15600, status: 'on_hold' as CollectionWorkflowStatus, dueDate: '2026-03-05', note: '再請求書送付待ち', linkedTaskId: 'DT-260315-03', handledBy: null, handledAt: null, billable: false },
]

function appendReasonTag(note: string, tag: string) {
  const trimmed = note.trim()
  const tagged = `#${tag}`
  if (trimmed.includes(tagged)) return trimmed
  return trimmed ? `${trimmed} ${tagged}` : tagged
}

function formatJstDateTime(value: string | null | undefined) {
  if (!value) return '—'
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function BillingCollapsibleSection({
  title,
  description,
  countLabel,
  icon: Icon,
  defaultOpen = false,
  children,
}: {
  title: string
  description?: string
  countLabel?: string
  icon: ComponentType<{ className?: string }>
  defaultOpen?: boolean
  children: ReactNode
}) {
  return (
    <details open={defaultOpen} className="action-disclosure group rounded-xl border border-slate-200 bg-white shadow-sm">
      <summary className="action-summary flex list-none items-center justify-between gap-3 rounded-xl px-4 py-3 marker:hidden">
        <span className="flex min-w-0 items-start gap-2">
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
              <span>{title}</span>
              {countLabel ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-normal text-slate-500">{countLabel}</span>
              ) : null}
            </span>
            {description ? <span className="mt-0.5 block text-xs font-normal text-slate-500">{description}</span> : null}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="action-summary-label rounded-full px-2 py-0.5 text-[11px] font-medium group-open:hidden">開く</span>
          <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500 group-open:inline">閉じる</span>
          <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
        </span>
      </summary>
      <div className="border-t border-slate-100 p-4">
        {children}
      </div>
    </details>
  )
}

export default function BillingPage() {
  const { role, user } = useAuth()
  const collectionRecords = useMemo<BillingCollectionRecord[]>(() => (
    role === 'pharmacy_staff' || role === 'pharmacy_admin' ? [] : initialPatientCollectionRecords
  ), [role])
  const [sharedDayTasks, setSharedDayTasks] = useState<DayTaskItem[]>([])
  const [databasePatients, setDatabasePatients] = useState<RegisteredPatientRecord[]>([])
  const [selectedRecord, setSelectedRecord] = useState<BillingRecord | null>(null)
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)
  const [batchMonth, setBatchMonth] = useState('2026-03')
  const [generatedLabel, setGeneratedLabel] = useState('')
  const [adminBillingRecords, setAdminBillingRecords] = useState<BillingRecord[]>(billingData)
  const [apiCollectionRecords, setApiCollectionRecords] = useState<BillingCollectionRecord[]>([])
  const [apiDateCollectionSummaries, setApiDateCollectionSummaries] = useState<BillingDateCollectionSummary[]>([])
  const [billingReadModelVersion, setBillingReadModelVersion] = useState(0)
  const [toastMessage, setToastMessage] = useState('')
  const [toastTone, setToastTone] = useState<'success' | 'error'>('success')
  const [savingCollectionRecordId, setSavingCollectionRecordId] = useState<string | null>(null)
  const [recentlySavedCollectionRecordId, setRecentlySavedCollectionRecordId] = useState<string | null>(null)
  const [failedCollectionRecordId, setFailedCollectionRecordId] = useState<string | null>(null)
  const [collectionErrorMessage, setCollectionErrorMessage] = useState<string>('')
  const [statusDialog, setStatusDialog] = useState<CollectionStatusChangeDraft | null>(null)
  const [statusChangeNote, setStatusChangeNote] = useState('')
  const [correctionRequestDialog, setCorrectionRequestDialog] = useState<CorrectionRequestDraft | null>(null)
  const [calendarActionDialog, setCalendarActionDialog] = useState<CalendarActionDraft | null>(null)
  const [calendarActionNote, setCalendarActionNote] = useState('')
  const [patientSearch, setPatientSearch] = useState('')
  const [staffFilter, setStaffFilter] = useState<StaffCollectionFilter>('needs_action')
  const [billingFlowDate, setBillingFlowDate] = useState(getTodayJstDateKey)
  const [dateFlagFilter, setDateFlagFilter] = useState<DateCollectionFlagFilter>('all')
  const [selectedCollectionDate, setSelectedCollectionDate] = useState<string | null>(null)
  const [showCollectionTable, setShowCollectionTable] = useState(false)
  const [expandedHistoryPatients, setExpandedHistoryPatients] = useState<string[]>([])
  const [historyViewMode, setHistoryViewMode] = useState<'latest' | 'all'>('latest')
  const [historyStatusFocus, setHistoryStatusFocus] = useState<'all' | 'on_hold'>('all')
  const [billingPaidCancelWindowMinutes, setBillingPaidCancelWindowMinutes] = useState(DEFAULT_BILLING_PAID_CANCEL_WINDOW_MINUTES)
  const ownPharmacyId = user?.activeRoleContext?.pharmacyId ?? user?.pharmacy_id ?? null
  const isSystemAdmin = role === 'system_admin'
  const isPharmacyAdmin = role === 'pharmacy_admin'
  const isPharmacyStaff = role === 'pharmacy_staff'
  const isPharmacyRole = role === 'pharmacy_staff' || role === 'pharmacy_admin'

  const ownPatients = useMemo(() => {
    if (!ownPharmacyId) return []
    const source = mergePatientSources({ databasePatients, includeMockPatients: false })
    return source.filter((patient) => patient.pharmacyId === ownPharmacyId)
  }, [databasePatients, ownPharmacyId])

  const patientBillingSettings = useMemo(() => new Map(
    ownPatients.map((patient) => [
      patient.id,
      {
        isBillable: patient.isBillable ?? true,
        reason: patient.billingExclusionReason ?? null,
      },
    ]),
  ), [ownPatients])
  const ownPatientNames = useMemo(() => new Set(ownPatients.map((patient) => patient.name)), [ownPatients])

  useEffect(() => {
    if (!ownPharmacyId || !isPharmacyRole) {
      setBillingPaidCancelWindowMinutes(DEFAULT_BILLING_PAID_CANCEL_WINDOW_MINUTES)
      return
    }

    let cancelled = false
    fetch('/api/pharmacy-operation-settings', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json().catch(() => null)
        if (!response.ok || !result?.ok) throw new Error(result?.error ?? 'operation_settings_fetch_failed')
        const minutes = Number(result.settings?.billing_paid_cancel_window_minutes)
        if (!cancelled && Number.isFinite(minutes)) {
          setBillingPaidCancelWindowMinutes(Math.max(1, minutes))
        }
      })
      .catch(() => {
        if (!cancelled) setBillingPaidCancelWindowMinutes(DEFAULT_BILLING_PAID_CANCEL_WINDOW_MINUTES)
      })

    return () => {
      cancelled = true
    }
  }, [isPharmacyRole, ownPharmacyId])

  useEffect(() => {
    let cancelled = false

    async function fetchDayTasks() {
      try {
        const response = await fetch(`/api/day-flow/${billingFlowDate}/tasks`, { cache: 'no-store' })
        const result = await response.json().catch(() => null)
        if (!cancelled && response.ok && result?.ok && Array.isArray(result.tasks)) {
          const mapped = result.tasks.map((task: Record<string, unknown>) => mapPatientDayTaskRowToDayTaskItem(task, billingFlowDate))
          setSharedDayTasks(mapped)
          return
        }
      } catch {}

      if (!cancelled) {
        setSharedDayTasks([])
      }
    }

    fetchDayTasks()
    return () => {
      cancelled = true
    }
  }, [billingFlowDate])

  useEffect(() => {
    if (!user || !ownPharmacyId) {
      setDatabasePatients([])
      return
    }

    let cancelled = false
    async function fetchPatients() {
      try {
        const result = await fetchJsonWithClientCache<PatientsByPharmacyResponse>({
          key: `makasete:patients-by-pharmacy:${ownPharmacyId}:v1`,
          url: `/api/patients/by-pharmacy/${ownPharmacyId}`,
          maxAgeMs: STABLE_PATIENT_CACHE_MS,
          onCached: (cached) => {
            if (!cancelled && cached?.ok && Array.isArray(cached.patients)) setDatabasePatients(cached.patients)
          },
          init: { cache: 'no-store' },
        })
        if (!cancelled && result?.ok && Array.isArray(result.patients)) {
          setDatabasePatients(result.patients)
          return
        }
        if (!cancelled) setDatabasePatients([])
      } catch {
        if (!cancelled) setDatabasePatients([])
      }
    }

    void fetchPatients()
    return () => {
      cancelled = true
    }
  }, [ownPharmacyId, user])

  const patientMap = useMemo(() => new Map(ownPatients.map((patient) => [patient.id, patient])), [ownPatients])

	  const dayTaskCollectionRecords = useMemo(() => buildDayTaskCollectionRecords({
	    sharedDayTasks,
	    ownPharmacyId: ownPharmacyId ?? '',
    ownPatientNames,
    patientMap,
    patientBillingSettings,
    collectionRecords,
	  }), [collectionRecords, ownPatientNames, ownPharmacyId, patientBillingSettings, patientMap, sharedDayTasks])

  const mergedCollectionRecords = useMemo(() => {
    if (isPharmacyRole) return apiCollectionRecords
    const manualOnly = collectionRecords.filter((record) => !dayTaskCollectionRecords.some((taskRecord) => taskRecord.linkedTaskId === record.linkedTaskId))
    return [...dayTaskCollectionRecords, ...manualOnly]
  }, [apiCollectionRecords, collectionRecords, dayTaskCollectionRecords, isPharmacyRole])

  const dateCollectionSummaries = useMemo(() => {
    return apiDateCollectionSummaries.filter((summaryItem) => {
      if (dateFlagFilter === 'needs_attention') return summaryItem.attentionCount > 0
      if (dateFlagFilter === 'has_billing') return summaryItem.billedCount > 0
      if (dateFlagFilter === 'all_paid') return summaryItem.patientCount > 0 && summaryItem.paidCount === summaryItem.patientCount
      return true
    })
  }, [apiDateCollectionSummaries, dateFlagFilter])


  const summary = useMemo(() => {
    if (isPharmacyRole) {
      const source = mergedCollectionRecords.filter((r) => r.billable)
      const needsBilling = source.filter((record) => record.status === 'ready').length
      const billed = source.filter((record) => record.status === 'pending').length
      return {
        needsBilling,
        billed,
        needsAction: needsBilling + billed,
        paid: source.filter((record) => record.status === 'paid').length,
        needsAttention: source.filter((record) => record.status === 'on_hold').length,
      }
    }

    return {
      issued: adminBillingRecords.length,
      paid: adminBillingRecords.filter((record) => record.status === 'paid').length,
      pending: adminBillingRecords.filter((record) => record.status !== 'paid').length,
    }
  }, [adminBillingRecords, isPharmacyRole, mergedCollectionRecords])

  const patientCollectionHistories = useMemo(() => {
    const map = new Map<string, {
      patientName: string
      records: BillingCollectionRecord[]
      latestHandledAt: string | null
      latestStatus: CollectionWorkflowStatus | null
    }>()

    mergedCollectionRecords
      .filter((record) => record.billable)
      .forEach((record) => {
        const current = map.get(record.patientName)
        const nextRecords = current ? [...current.records, record] : [record]
        const sortedRecords = nextRecords.sort((a, b) => (b.handledAt ?? '').localeCompare(a.handledAt ?? ''))
        map.set(record.patientName, {
          patientName: record.patientName,
          records: sortedRecords,
          latestHandledAt: sortedRecords[0]?.handledAt ?? null,
          latestStatus: sortedRecords[0]?.status ?? null,
        })
      })

    return Array.from(map.values()).sort((a, b) => (b.latestHandledAt ?? '').localeCompare(a.latestHandledAt ?? ''))
  }, [mergedCollectionRecords])

  const primaryCollectionRecords = useMemo(() => {
    const keyword = patientSearch.trim().toLowerCase()
    const filtered = mergedCollectionRecords.filter((record) => {
      if (!record.billable) return false
      if (keyword && !record.patientName.toLowerCase().includes(keyword)) return false
      if (staffFilter === 'needs_action') return record.status === 'ready' || record.status === 'pending'
      if (staffFilter === 'on_hold') return record.status === 'on_hold'
      if (staffFilter === 'paid') return record.status === 'paid'
      return true
    })

    const priority = { on_hold: 0, ready: 1, pending: 2, paid: 3 } as const
    return filtered.sort((a, b) => {
      const priorityDiff = priority[a.status] - priority[b.status]
      if (priorityDiff !== 0) return priorityDiff
      return (b.handledAt ?? '').localeCompare(a.handledAt ?? '')
    })
  }, [mergedCollectionRecords, patientSearch, staffFilter])

  const filteredPatientCollectionHistories = useMemo(() => {
    const keyword = patientSearch.trim().toLowerCase()

    return patientCollectionHistories.filter((item) => {
      const matchesKeyword = !keyword || item.patientName.toLowerCase().includes(keyword)
      const matchesStatusFocus = historyStatusFocus === 'all' || item.latestStatus === 'on_hold'
      return matchesKeyword && matchesStatusFocus
    })
  }, [historyStatusFocus, patientCollectionHistories, patientSearch])

  const togglePatientHistory = (patientName: string) => {
    setExpandedHistoryPatients((prev) => (
      prev.includes(patientName)
        ? prev.filter((name) => name !== patientName)
        : [...prev, patientName]
    ))
  }

  useEffect(() => {
    if (!selectedCollectionDate) return
    if (dateCollectionSummaries.some((item) => item.date === selectedCollectionDate)) return
    setSelectedCollectionDate(null)
    setCalendarActionDialog(null)
  }, [dateCollectionSummaries, selectedCollectionDate])

  useEffect(() => {
    let cancelled = false

	    async function fetchAdminBillingReadModel() {
	      if (!user || !ownPharmacyId) {
	        setAdminBillingRecords([])
	        setApiCollectionRecords([])
	        setApiDateCollectionSummaries([])
	        return
	      }

	      try {
        const response = await fetch('/api/billing/read-model', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            flowDate: billingFlowDate,
            patientSearch,
            statusFilter: 'all',
          }),
        })
        const result = await response.json().catch(() => null)
        if (!cancelled && response.ok && result?.ok && Array.isArray(result.adminBillingRecords)) {
          setAdminBillingRecords(result.adminBillingRecords)
          setApiCollectionRecords(Array.isArray(result.collectionRecords) ? result.collectionRecords : [])
          setApiDateCollectionSummaries(Array.isArray(result.dateCollectionSummaries) ? result.dateCollectionSummaries : [])
          return
        }
      } catch {}

      if (!cancelled) {
        setAdminBillingRecords(billingData)
        setApiCollectionRecords([])
        setApiDateCollectionSummaries([])
      }
    }

    void fetchAdminBillingReadModel()
    return () => {
      cancelled = true
    }
  }, [billingFlowDate, billingReadModelVersion, ownPharmacyId, patientSearch, user])

  const handleBatchGenerate = () => {
    setGeneratedLabel(`${batchMonth} の請求書を ${adminBillingRecords.length} 件生成しました（モック）`)
    setBatchDialogOpen(false)
  }

  const showToast = (message: string, tone: 'success' | 'error' = 'success') => {
    setToastTone(tone)
    setToastMessage(message)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handlePaymentConfirm = (recordId: string, pharmacyName: string) => {
    setAdminBillingRecords((prev) => prev.map((record) => (
      record.id === recordId ? { ...record, status: 'paid' } : record
    )))
    setSelectedRecord((prev) => (prev?.id === recordId ? { ...prev, status: 'paid' } : prev))
    showToast(`${pharmacyName} の入金を確認しました（モック）`)
  }

  const updateCollectionStatus = async (recordId: string, status: CollectionWorkflowStatus, note?: string) => {
    const target = mergedCollectionRecords.find((record) => record.id === recordId)
    const trimmedNote = note?.trim()
    const actorName = user?.full_name ?? '担当者'
    const handledAt = new Date().toISOString()
    setSavingCollectionRecordId(recordId)
    setFailedCollectionRecordId(null)
    setCollectionErrorMessage('')

    if (!target?.linkedTaskId) {
      showToast('対象の回収データが見つかりませんでした', 'error')
      setFailedCollectionRecordId(recordId)
      setCollectionErrorMessage('この患者の回収状況はまだ保存できていません。もう一度お試しください。')
      setSavingCollectionRecordId(null)
      return false
    }

    try {
      const response = await fetch(`/api/billing/collection-records/${target.linkedTaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionStatus: normalizeCollectionStatusToDb(status),
          note: trimmedNote ? trimmedNote : target.note,
          handledBy: actorName,
          handledById: user?.id ?? null,
          handledAt,
        }),
      })
      if (!response.ok) {
        throw new Error('collection_status_save_failed')
      }
      setSharedDayTasks((prev) => prev.map((task) => (
        task.id === target.linkedTaskId
          ? {
              ...task,
              collectionStatus: toLegacyDayTaskCollectionStatus(status),
              note: trimmedNote ? trimmedNote : task.note,
              handledBy: actorName,
              handledById: user?.id ?? task.handledById,
              handledAt,
            }
          : task
      )))
      setBillingReadModelVersion((current) => current + 1)
    } catch {
      showToast('回収状況の保存に失敗しました', 'error')
      setFailedCollectionRecordId(recordId)
      setCollectionErrorMessage('この患者の回収状況はまだ保存できていません。もう一度お試しください。')
      setSavingCollectionRecordId(null)
      return false
    }

    showToast(`${target.patientName} を${collectionWorkflowStatusMeta[status].label}に更新しました`)
    vibrateOnSaveSuccess()
    setSavingCollectionRecordId(null)
    setFailedCollectionRecordId(null)
    setCollectionErrorMessage('')
    setRecentlySavedCollectionRecordId(recordId)
    setTimeout(() => setRecentlySavedCollectionRecordId((current) => current === recordId ? null : current), 1500)
    return true
  }

  const openStatusDialog = (recordId: string, to: CollectionWorkflowStatus) => {
    const record = mergedCollectionRecords.find((item) => item.id === recordId)
    if (!record) return
    setStatusDialog({
      recordId,
      patientName: record.patientName,
      from: record.status,
      to,
    })
    setStatusChangeNote('')
  }

  const confirmStatusChange = async () => {
    if (!statusDialog) return
    const draft = statusDialog
    vibrateOnButtonPress()
    const didSave = await updateCollectionStatus(draft.recordId, draft.to, statusChangeNote)
    if (!didSave) return
    setTimeout(() => {
      setStatusDialog((current) => current?.recordId === draft.recordId ? null : current)
      setStatusChangeNote('')
    }, 700)
  }

  const applyStatusReasonTag = (tag: string) => {
    setStatusChangeNote((current) => appendReasonTag(current, tag))
  }

  const openCalendarActionDialog = (item: BillingDateCollectionSummary['items'][number], collectionDate: string) => {
    const recordId = item.recordId ?? `TEMP-${item.patientId}-${item.visitDate}`
    const nextDraft: CalendarActionDraft = {
      recordId,
      patientName: item.patientName,
      visitDate: item.visitDate,
      amount: item.amount ?? 0,
      status: item.status,
      note: item.note ?? '',
    }
    setSelectedCollectionDate(collectionDate)
    setCalendarActionDialog(nextDraft)
    setCalendarActionNote(nextDraft.note)
  }

  const closeCalendarActionDialog = () => {
    setCalendarActionDialog(null)
    setCalendarActionNote('')
  }

  const applyCalendarReasonTag = (tag: string) => {
    setCalendarActionNote((current) => appendReasonTag(current, tag))
  }

  const openPaidCorrectionRequestDialog = (record: BillingCollectionRecord) => {
    const template = billingCorrectionTemplates[0]
    setCorrectionRequestDialog({
      recordId: record.id,
      patientName: record.patientName,
      linkedTaskId: record.linkedTaskId,
      note: record.note,
      reasonCategory: template.reasonCategory,
      requestedChange: template.requestedChange,
      detail: template.detail,
    })
  }

  const applyCorrectionTemplate = (template: (typeof billingCorrectionTemplates)[number]) => {
    setCorrectionRequestDialog((current) => current ? {
      ...current,
      reasonCategory: template.reasonCategory,
      requestedChange: template.requestedChange,
      detail: template.detail,
    } : current)
  }

  const submitPaidCorrectionRequest = async () => {
    if (!correctionRequestDialog) return
    const draft = correctionRequestDialog
    try {
      setSavingCollectionRecordId(draft.recordId)
      setFailedCollectionRecordId(null)
      setCollectionErrorMessage('')
      const response = await fetch('/api/correction-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: 'billing_collection',
          targetId: draft.recordId,
          patientDayTaskId: draft.linkedTaskId,
          reasonCategory: draft.reasonCategory,
          reasonText: draft.detail.trim() || draft.requestedChange,
          requestedChanges: {
            from: 'paid',
            to: 'billed',
            note: draft.note,
            requestedChange: draft.requestedChange.trim(),
            detail: draft.detail.trim(),
          },
        }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.ok) throw new Error(result?.error ?? 'correction_request_failed')
      showToast('管理者へ修正依頼を送信しました')
      setCorrectionRequestDialog(null)
      setRecentlySavedCollectionRecordId(draft.recordId)
      setTimeout(() => setRecentlySavedCollectionRecordId((current) => current === draft.recordId ? null : current), 1500)
    } catch {
      showToast('修正依頼の送信に失敗しました', 'error')
      setFailedCollectionRecordId(draft.recordId)
      setCollectionErrorMessage('修正依頼がまだ送信できていません。もう一度お試しください。')
    } finally {
      setSavingCollectionRecordId(null)
    }
  }

  const getPaidActionForRecord = (record: Pick<BillingCollectionRecord, 'status' | 'handledAt'>) => getBillingPaidCorrectionAction({
    status: record.status,
    handledAt: record.handledAt,
    windowMinutes: billingPaidCancelWindowMinutes,
    isPharmacyAdmin,
    isPharmacyStaff,
  })

  const getCollectionActionsForRecord = (record: BillingCollectionRecord) => getBillingCollectionActions({
    record,
    paidAction: getPaidActionForRecord(record),
  })

  const runCollectionAction = async (record: BillingCollectionRecord, action: BillingCollectionAction) => {
    if (action.kind === 'request_correction') {
      setCalendarActionDialog(null)
      openPaidCorrectionRequestDialog(record)
      return
    }
    if (!action.nextStatus) return
    openStatusDialog(record.id, action.nextStatus)
  }

  const getCardActionClassName = (action: BillingCollectionAction) => {
    const pressClass = 'min-h-11 touch-manipulation shadow-sm transition active:scale-[0.98] active:shadow-inner sm:min-h-9'
    if (action.kind === 'mark_paid') return `${pressClass} bg-emerald-600 text-white hover:bg-emerald-600/90`
    if (action.kind === 'mark_on_hold') return `${pressClass} border-rose-200 bg-white text-rose-700 hover:bg-rose-50`
    if (action.kind === 'return_ready') return `${pressClass} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`
    return `${pressClass} border-amber-200 bg-white text-amber-700 hover:bg-amber-50`
  }

  const getTableActionClassName = (action: BillingCollectionAction) => {
    if (action.kind === 'mark_paid') return 'min-h-10 touch-manipulation text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60'
    if (action.kind === 'mark_on_hold') return 'min-h-10 touch-manipulation text-rose-700 hover:bg-rose-50 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-60'
    if (action.kind === 'return_ready') return 'min-h-10 touch-manipulation text-slate-700 hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60'
    return 'min-h-10 touch-manipulation text-amber-700 hover:bg-amber-50 hover:text-amber-800 disabled:cursor-not-allowed disabled:opacity-60'
  }

  const getPaidRecordNotice = (record: BillingCollectionRecord) => {
    if (record.status !== 'paid') return null
    const paidAction = getPaidActionForRecord(record)
    if (paidAction === 'cancel') {
      return `入金済み後 ${billingPaidCancelWindowMinutes} 分までは取消できます。以降は修正依頼に切り替わります。`
    }
    if (paidAction === 'request' || paidAction === 'edit_from_request') {
      return `この入金済みはロック済みです。通常取消はできず、修正依頼に進みます。`
    }
    return null
  }

  if (role === 'pharmacy_staff' || role === 'pharmacy_admin') {
    return (
      <div className={adminPageClass}>
        <AdminPageHeader title="請求フォロー" description="対応完了した請求対象患者を自動で拾い、請求必要・請求済み・入金済み・要確認を追います。" />
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard label="請求必要" value={summary.needsBilling} tone="primary" icon={<FileText className="h-4 w-4" />} />
          <AdminStatCard label="請求済み" value={summary.billed} tone="primary" icon={<Layers className="h-4 w-4" />} />
          <AdminStatCard label="要確認" value={summary.needsAttention} tone="danger" icon={<CalendarDays className="h-4 w-4" />} />
          <AdminStatCard label="入金済み" value={summary.paid} tone="success" icon={<CheckCircle className="h-4 w-4" />} />
        </section>

        <Card className={adminCardClass}>
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <span>患者対応が完了すると、請求対象患者は自動でここへ載ります。通常は `請求必要` から `請求済み` または `入金済み` へ進め、例外時だけ `要確認` に回します。</span>
              <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">day flow 連動</Badge>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <Input
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className={adminInputClass}
                placeholder="患者名で検索"
              />
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'needs_action', label: '請求必要・請求済み' },
                  { key: 'on_hold', label: '要確認' },
                  { key: 'paid', label: '入金済み' },
                  { key: 'all', label: '全て' },
                ].map((option) => (
                  <Button
                    key={option.key}
                    type="button"
                    size="sm"
                    variant={staffFilter === option.key ? 'default' : 'outline'}
                    onClick={() => setStaffFilter(option.key as StaffCollectionFilter)}
                    className={cn(
                      staffFilter === option.key
                        ? 'bg-indigo-600 text-white hover:bg-indigo-600/90'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                    )}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <BillingCollapsibleSection
          title="今処理する患者"
          description="主作業はここだけです。請求必要または請求済みの患者を進め、例外時だけ要確認へ回します。"
          countLabel={`${primaryCollectionRecords.length}名`}
          icon={Layers}
          defaultOpen
        >
          <div className="space-y-3">
            {primaryCollectionRecords.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                条件に合う患者はありません。通常は day flow で対応完了した請求対象患者がここに出ます。
              </div>
            ) : (
              primaryCollectionRecords.map((record) => {
                return (
                  <div key={record.id} className={cn('rounded-lg border bg-white p-3 shadow-sm', savingCollectionRecordId === record.id ? 'border-indigo-300 ring-2 ring-indigo-100 status-pulse-soft' : 'border-slate-200', recentlySavedCollectionRecordId === record.id ? 'border-emerald-300 ring-2 ring-emerald-100 success-badge-pop' : null, failedCollectionRecordId === record.id ? 'border-rose-300 ring-2 ring-rose-100' : null)}>
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">{record.patientName}</p>
                          <StatusBadge meta={collectionWorkflowStatusMeta[record.status]} />
                          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-[11px] text-slate-700">
                            {record.status === 'ready'
                              ? '請求必要'
                              : record.status === 'pending'
                                ? '請求済み'
                                : record.status === 'on_hold'
                                  ? '例外対応'
                                  : '完了済み'}
                          </Badge>
                        </div>
                        <p className="mt-1 truncate text-[11px] text-slate-500">{record.linkedTaskId} / {formatJstDateTime(record.handledAt)} / {record.handledBy ?? '未対応'}</p>
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">{record.note || 'メモなし'}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        {getCollectionActionsForRecord(record).map((action) => (
                          <Button
                            key={action.kind}
                            type="button"
                            size="sm"
                            variant={action.kind === 'mark_paid' ? 'default' : 'outline'}
                            onClick={() => void runCollectionAction(record, action)}
                            disabled={savingCollectionRecordId === record.id}
                            className={getCardActionClassName(action)}
                          >
                            {savingCollectionRecordId === record.id
                              ? action.kind === 'request_correction' ? '送信中...' : '保存中...'
                              : action.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    {failedCollectionRecordId === record.id ? <p className="mt-2 text-xs font-medium text-rose-600">{collectionErrorMessage}</p> : null}
                    {getPaidRecordNotice(record) ? <p className="mt-2 text-xs font-medium text-amber-700">{getPaidRecordNotice(record)}</p> : null}
                  </div>
                )
              })
            )}
          </div>
        </BillingCollapsibleSection>

        <BillingCollapsibleSection
          title="日付別に見返す"
          description="通常の処理では使いません。後から特定日を追いたい時だけ開きます。"
          countLabel={`${dateCollectionSummaries.length}日`}
          icon={CalendarDays}
        >
          <div className="space-y-3">
            <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[220px_1fr] sm:items-center">
              <div>
                <p className="text-xs font-semibold text-slate-900">対象日</p>
                <p className="mt-0.5 text-[11px] text-slate-500">選択した日の回収状況を見返します。</p>
              </div>
              <Input
                type="date"
                value={billingFlowDate}
                onChange={(event) => {
                  setBillingFlowDate(event.target.value || getTodayJstDateKey())
                  setDateFlagFilter('all')
                  setSelectedCollectionDate(null)
                  setCalendarActionDialog(null)
                }}
                className={adminInputClass}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: '全フラグ' },
                { key: 'needs_attention', label: '要確認あり' },
                { key: 'has_billing', label: '請求対象あり' },
                { key: 'all_paid', label: 'すべて入金済み' },
              ].map((option) => (
                <Button
                  key={option.key}
                  type="button"
                  size="sm"
                  variant={dateFlagFilter === option.key ? 'default' : 'outline'}
                  onClick={() => {
                    setDateFlagFilter(option.key as DateCollectionFlagFilter)
                    setCalendarActionDialog(null)
                  }}
                  className={cn(
                    dateFlagFilter === option.key
                      ? 'bg-indigo-600 text-white hover:bg-indigo-600/90'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                  )}
                >
                  {option.label}
                </Button>
              ))}
            </div>

            {dateCollectionSummaries.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                条件に合う日付はありません。対象日かフラグを変えて確認してください。
              </div>
            ) : (
              <div className="space-y-2">
                {dateCollectionSummaries.map((summaryItem) => {
                  const hasAttention = summaryItem.attentionCount > 0
                  const allPaid = summaryItem.patientCount > 0 && summaryItem.paidCount === summaryItem.patientCount
                  const isSelected = selectedCollectionDate === summaryItem.date
                  const toneClass = hasAttention
                    ? 'border-rose-200 bg-rose-50'
                    : allPaid
                      ? 'border-sky-200 bg-sky-50'
                      : 'border-amber-200 bg-amber-50'
                  return (
                    <div key={summaryItem.date} className={cn('overflow-hidden rounded-lg border transition', toneClass, isSelected && 'ring-2 ring-indigo-300 shadow-sm')}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCollectionDate((current) => current === summaryItem.date ? null : summaryItem.date)
                          setCalendarActionDialog(null)
                        }}
                        className="w-full rounded-lg px-3 py-2.5 text-left"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{summaryItem.date}</p>
                            <p className="mt-0.5 text-[11px] text-slate-600">
                              {summaryItem.attentionCount > 0
                                ? '要確認あり'
                                : allPaid
                                  ? 'すべて入金済み'
                                  : '請求必要または請求済みあり'}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            {summaryItem.attentionCount > 0 ? <Badge variant="outline" className="border-rose-200 bg-white text-rose-700">要確認あり</Badge> : null}
                            {summaryItem.billedCount > 0 ? <Badge variant="outline" className="border-indigo-200 bg-white text-indigo-700">請求対象あり</Badge> : null}
                            {allPaid ? <Badge variant="outline" className="border-sky-200 bg-white text-sky-700">すべて入金済み</Badge> : null}
                            <span className="ml-1 inline-flex items-center gap-1 text-slate-500">
                              <span>{isSelected ? '閉じる' : '開く'}</span>
                              {isSelected ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </span>
                          </div>
                        </div>
                      </button>

                      {isSelected ? (
                        <div className="fade-in-up border-t border-white/70 bg-white/80 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-900">{summaryItem.date} の対象患者</p>
                            <Button type="button" size="sm" variant="ghost" onClick={() => { setSelectedCollectionDate(null); setCalendarActionDialog(null) }} className="h-8 px-2 text-xs">閉じる</Button>
                          </div>
                          <div className="mt-2 space-y-2">
                            {summaryItem.items.map((item) => (
                              <div key={`${item.patientId}-${item.visitDate}`} className={cn('rounded-lg border bg-slate-50 p-2.5', savingCollectionRecordId === (item.recordId ?? `TEMP-${item.patientId}-${item.visitDate}`) ? 'border-indigo-300 ring-2 ring-indigo-100 status-pulse-soft' : 'border-slate-200', recentlySavedCollectionRecordId === (item.recordId ?? `TEMP-${item.patientId}-${item.visitDate}`) ? 'border-emerald-300 ring-2 ring-emerald-100 success-badge-pop' : null, failedCollectionRecordId === (item.recordId ?? `TEMP-${item.patientId}-${item.visitDate}`) ? 'border-rose-300 ring-2 ring-rose-100' : null)}>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-semibold text-slate-900">{item.patientName}</p>
                                    <p className="mt-0.5 text-[11px] text-slate-500">{item.visitDate} の回収状況</p>
                                  </div>
                                  <StatusBadge meta={collectionWorkflowStatusMeta[item.status]} />
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => openCalendarActionDialog(item, summaryItem.date)}
                                    className="min-h-9 touch-manipulation bg-indigo-600 text-xs text-white hover:bg-indigo-600/90 sm:min-h-8"
                                  >
                                    {item.status === 'paid' ? '内容を確認する' : 'この患者を確認する'}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </BillingCollapsibleSection>

        <BillingCollapsibleSection
          title="患者別の履歴を見返す"
          description="通常の処理では使いません。前回メモや状態変化を追いたい時だけ開きます。"
          countLabel={`${filteredPatientCollectionHistories.length}名`}
          icon={Layers}
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={historyStatusFocus === 'all' ? 'default' : 'outline'}
                  onClick={() => setHistoryStatusFocus('all')}
                  className={cn(historyStatusFocus === 'all' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}
                >
                  全患者
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={historyStatusFocus === 'on_hold' ? 'default' : 'outline'}
                  onClick={() => setHistoryStatusFocus('on_hold')}
                  className={cn(historyStatusFocus === 'on_hold' ? 'bg-rose-600 text-white hover:bg-rose-600/90' : 'border-rose-200 bg-white text-rose-700 hover:bg-rose-50')}
                >
                  要確認だけ
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={historyViewMode === 'latest' ? 'default' : 'outline'}
                  onClick={() => setHistoryViewMode('latest')}
                  className={cn(historyViewMode === 'latest' ? 'bg-indigo-600 text-white hover:bg-indigo-600/90' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}
                >
                  最新訪問だけ
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={historyViewMode === 'all' ? 'default' : 'outline'}
                  onClick={() => setHistoryViewMode('all')}
                  className={cn(historyViewMode === 'all' ? 'bg-indigo-600 text-white hover:bg-indigo-600/90' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}
                >
                  全訪問
                </Button>
              </div>
            </div>
            {filteredPatientCollectionHistories.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-500">条件に合う回収履歴はありません。</p>
            ) : (
              <div className="space-y-3">
                {filteredPatientCollectionHistories.map((patientHistory) => {
                  const expanded = expandedHistoryPatients.includes(patientHistory.patientName)
                  return (
                    <div key={patientHistory.patientName} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <button type="button" onClick={() => togglePatientHistory(patientHistory.patientName)} className="flex w-full flex-wrap items-center justify-between gap-2 text-left">
                        <div className="flex items-start gap-2">
                          {expanded ? <ChevronDown className="mt-0.5 h-4 w-4 text-slate-400" /> : <ChevronRight className="mt-0.5 h-4 w-4 text-slate-400" />}
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{patientHistory.patientName}</p>
                            <p className="text-xs text-slate-500">最新処理: {formatJstDateTime(patientHistory.latestHandledAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {patientHistory.latestStatus ? <StatusBadge meta={collectionWorkflowStatusMeta[patientHistory.latestStatus]} /> : null}
                          <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">訪問 {patientHistory.records.length}件</Badge>
                        </div>
                      </button>
                      {expanded ? (
                        <div className="mt-3 space-y-2">
                          {(historyViewMode === 'latest' ? patientHistory.records.slice(0, 1) : patientHistory.records).map((record, index, visibleRecords) => {
                            const sourceIndex = patientHistory.records.findIndex((item) => item.id === record.id)
                            const previousRecord = historyViewMode === 'all' ? patientHistory.records[sourceIndex + 1] ?? null : patientHistory.records[sourceIndex + 1] ?? null
                            const isLatestOnly = visibleRecords.length === 1 && historyViewMode === 'latest'
                            return (
                              <div key={record.id} className="rounded-lg border border-white bg-white p-3 text-xs text-slate-700 shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {previousRecord ? (
                                      <>
                                        <StatusBadge meta={collectionWorkflowStatusMeta[previousRecord.status]} />
                                        <span className="text-slate-400">→</span>
                                      </>
                                    ) : null}
                                    <StatusBadge meta={collectionWorkflowStatusMeta[record.status]} />
                                    <span>{formatJstDateTime(record.handledAt)}</span>
                                    <span className="text-slate-500">{record.handledBy ?? '未対応'}</span>
                                  </div>
                                  <span className="text-slate-500">{record.linkedTaskId}</span>
                                </div>
                                {isLatestOnly && previousRecord ? <p className="mt-2 text-[11px] text-slate-500">前回訪問の状態: {collectionWorkflowStatusMeta[previousRecord.status].label}</p> : null}
                                {previousRecord && previousRecord.note && previousRecord.note !== record.note ? <p className="mt-2 text-[11px] text-slate-500">前回訪問メモ: {previousRecord.note}</p> : null}
                                <p className="mt-2 text-slate-600">{record.note || 'メモなし'}</p>
                              </div>
                            )
                          })}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </BillingCollapsibleSection>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm text-slate-900">全件確認</CardTitle>
                <CardDescription className="text-slate-600">通常の処理では使いません。監査や抜け漏れ確認が必要なときだけ開きます。</CardDescription>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => setShowCollectionTable((prev) => !prev)} className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                {showCollectionTable ? '一覧を閉じる' : '一覧を開く'}
              </Button>
            </div>
          </CardHeader>
          {showCollectionTable ? (
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 hover:bg-slate-50">
                    <TableHead className="text-slate-500">患者名</TableHead>
                    <TableHead className="text-slate-500">訪問回 / task</TableHead>
                    <TableHead className="text-slate-500">対応者 / 時刻</TableHead>
                    <TableHead className="text-slate-500">請求対象</TableHead>
                    <TableHead className="text-slate-500">状態</TableHead>
                    <TableHead className="text-slate-500">メモ</TableHead>
                    <TableHead className="text-right text-slate-500">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
	                  {mergedCollectionRecords.map((record) => {
	                    return (
	                    <TableRow key={record.id} className={cn('border-slate-200 transition hover:bg-slate-50', savingCollectionRecordId === record.id ? 'bg-indigo-50/70' : null, recentlySavedCollectionRecordId === record.id ? 'bg-emerald-50/70' : null, failedCollectionRecordId === record.id ? 'bg-rose-50/80' : null)}>
                      <TableCell className="font-medium text-slate-900">{record.patientName}</TableCell>
                      <TableCell className="text-xs text-slate-700">
                        <div className="flex items-center gap-1">
                          <Link2 className="h-3.5 w-3.5 text-indigo-500" />
                          {record.linkedTaskId}
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">訪問記録との連携ID</p>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        <p>{record.handledBy ?? '未対応'}</p>
                        <p className="text-slate-500">{formatJstDateTime(record.handledAt)}</p>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="outline" className={cn('border text-xs', record.billable ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' : 'border-gray-500/40 bg-gray-500/20 text-gray-300')}>
                            {record.billable ? '請求対象' : '請求対象外'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell><StatusBadge meta={collectionWorkflowStatusMeta[record.status]} /></TableCell>
                      <TableCell className="text-xs text-slate-500">
                        <div className="space-y-1">
                          <p>{record.note || '—'}</p>
                          {savingCollectionRecordId === record.id ? <p className="font-medium text-indigo-600">保存中です。反映まで少しお待ちください。</p> : null}
                          {recentlySavedCollectionRecordId === record.id ? <p className="font-medium text-emerald-600">✓ 保存できました</p> : null}
                          {failedCollectionRecordId === record.id ? <p className="font-medium text-rose-600">{collectionErrorMessage}</p> : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {getCollectionActionsForRecord(record).map((action) => (
                            <Button
                              key={action.kind}
                              size="sm"
                              variant="ghost"
                              disabled={savingCollectionRecordId === record.id}
                              onClick={() => void runCollectionAction(record, action)}
                              className={getTableActionClassName(action)}
                            >
                              {savingCollectionRecordId === record.id
                                ? action.kind === 'request_correction' ? '送信中...' : '保存中...'
                                : action.label}
                            </Button>
                          ))}
                        </div>
                      </TableCell>
	                    </TableRow>
	                    )
	                  })}
                </TableBody>
              </Table>
            </CardContent>
          ) : (
            <CardContent className="px-4 pb-4 pt-0 text-xs text-slate-500">必要なときだけ一覧を開けます。</CardContent>
          )}
        </Card>

        <Dialog open={!!statusDialog} onOpenChange={(open) => !open && setStatusDialog(null)}>
          <DialogContent className={`${adminDialogClass} sm:max-w-md`}>
            <DialogHeader>
              <DialogTitle className="text-slate-900">回収状況を更新</DialogTitle>
              <DialogDescription className="text-slate-600">
                {statusDialog ? `${statusDialog.patientName} の回収状況を「${collectionWorkflowStatusMeta[statusDialog.to].label}」に変更します。` : '回収状況を変更します。'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm text-slate-700">
              <div className={`${adminPanelClass} p-4`}>
                <p>変更前: <span className="font-medium text-slate-900">{statusDialog ? collectionWorkflowStatusMeta[statusDialog.from].label : '—'}</span></p>
                <p className="mt-1">変更後: <span className="font-medium text-slate-900">{statusDialog ? collectionWorkflowStatusMeta[statusDialog.to].label : '—'}</span></p>
                {statusDialog?.from === 'paid' ? <p className="mt-2 text-xs text-amber-700">入金済みは {billingPaidCancelWindowMinutes} 分を過ぎるとロックされます。ロック後は通常取消ではなく修正依頼に切り替わります。</p> : null}
                {savingCollectionRecordId === statusDialog?.recordId ? <p className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700">保存中です。状態を反映しています…</p> : null}
                {recentlySavedCollectionRecordId === statusDialog?.recordId ? <p className="success-badge-pop mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">✓ 保存しました。一覧の状態も更新しています。</p> : null}
                {failedCollectionRecordId === statusDialog?.recordId ? <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{collectionErrorMessage}</p> : null}
              </div>
              <div className="space-y-2">
                <p className="text-xs text-slate-500">メモ（任意）</p>
                {statusDialog?.to === 'on_hold' ? (
                  <div className="flex flex-wrap gap-2">
                    {onHoldReasonTags.map((tag) => (
                      <Button key={tag} type="button" size="sm" variant="outline" onClick={() => applyStatusReasonTag(tag)} className="min-h-10 touch-manipulation border-rose-200 bg-white text-rose-700 hover:bg-rose-50">
                        #{tag}
                      </Button>
                    ))}
                  </div>
                ) : null}
                <Input value={statusChangeNote} onChange={(e) => setStatusChangeNote(e.target.value)} className={adminInputClass} placeholder="通帳確認、電話確認など" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setStatusDialog(null)} disabled={savingCollectionRecordId === statusDialog?.recordId} className="min-h-11 touch-manipulation sm:min-h-9">キャンセル</Button>
              <Button type="button" onClick={confirmStatusChange} disabled={savingCollectionRecordId === statusDialog?.recordId} className="min-h-11 touch-manipulation bg-indigo-500 text-white shadow-sm transition active:scale-[0.98] active:shadow-inner hover:bg-indigo-500/90 sm:min-h-9">
                {savingCollectionRecordId === statusDialog?.recordId ? '保存中...' : recentlySavedCollectionRecordId === statusDialog?.recordId ? '保存しました' : '保存して反映'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!correctionRequestDialog} onOpenChange={(open) => !open && setCorrectionRequestDialog(null)}>
          <DialogContent className={`${adminDialogClass} sm:max-w-lg`}>
            <DialogHeader>
              <DialogTitle className="text-slate-900">修正依頼を作成</DialogTitle>
              <DialogDescription className="text-slate-600">
                {correctionRequestDialog ? `${correctionRequestDialog.patientName} の回収状態について、管理者へ修正依頼を送ります。` : '修正依頼を送ります。'}
              </DialogDescription>
            </DialogHeader>
            {correctionRequestDialog ? (
              <div className="space-y-4 text-sm text-slate-700">
                <div className={`${adminPanelClass} p-4`}>
                  <p>対象: <span className="font-medium text-slate-900">{correctionRequestDialog.patientName}</span></p>
                  <p className="mt-1 text-xs text-slate-500">{correctionRequestDialog.linkedTaskId ?? correctionRequestDialog.recordId} / 現在は入金済みとしてロックされています。</p>
                  {failedCollectionRecordId === correctionRequestDialog.recordId ? <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{collectionErrorMessage}</p> : null}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500">よくある修正パターン</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {billingCorrectionTemplates.map((template) => (
                      <Button
                        key={template.label}
                        type="button"
                        variant="outline"
                        onClick={() => applyCorrectionTemplate(template)}
                        className={cn(
                          'h-auto min-h-11 justify-start whitespace-normal border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50',
                          correctionRequestDialog.requestedChange === template.requestedChange && 'border-indigo-300 bg-indigo-50 text-indigo-700',
                        )}
                      >
                        {template.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">理由カテゴリ</p>
                    <div className="flex flex-wrap gap-2">
                      {correctionReasonCategories.map((category) => (
                        <Button
                          key={category}
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setCorrectionRequestDialog((current) => current ? { ...current, reasonCategory: category } : current)}
                          className={cn(
                            'min-h-9 touch-manipulation border-slate-200 bg-white text-xs text-slate-700 hover:bg-slate-50',
                            correctionRequestDialog.reasonCategory === category && 'border-indigo-300 bg-indigo-50 text-indigo-700',
                          )}
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">どう修正してほしいか</p>
                    <Input
                      value={correctionRequestDialog.requestedChange}
                      onChange={(e) => setCorrectionRequestDialog((current) => current ? { ...current, requestedChange: e.target.value } : current)}
                      className={adminInputClass}
                      placeholder="例: 入金済みを請求済みに戻したい"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-500">補足メモ</p>
                  <Textarea
                    value={correctionRequestDialog.detail}
                    onChange={(e) => setCorrectionRequestDialog((current) => current ? { ...current, detail: e.target.value } : current)}
                    className={`${adminInputClass} min-h-24 resize-none`}
                    placeholder="確認した内容、間違えた理由、管理者に見てほしい点"
                  />
                </div>
              </div>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCorrectionRequestDialog(null)} disabled={savingCollectionRecordId === correctionRequestDialog?.recordId} className="min-h-11 touch-manipulation sm:min-h-9">キャンセル</Button>
              <Button type="button" onClick={() => void submitPaidCorrectionRequest()} disabled={savingCollectionRecordId === correctionRequestDialog?.recordId || !correctionRequestDialog?.detail.trim()} className="min-h-11 touch-manipulation bg-amber-600 text-white shadow-sm transition active:scale-[0.98] active:shadow-inner hover:bg-amber-600/90 sm:min-h-9">
                {savingCollectionRecordId === correctionRequestDialog?.recordId ? '送信中...' : '修正依頼を送信'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!calendarActionDialog} onOpenChange={(open) => !open && closeCalendarActionDialog()}>
          <DialogContent className={`${adminDialogClass} sm:max-w-lg`}>
            <DialogHeader>
              <DialogTitle className="text-slate-900">患者ごとの回収処理</DialogTitle>
              <DialogDescription className="text-slate-600">
                {calendarActionDialog ? `${calendarActionDialog.patientName} / ${calendarActionDialog.visitDate}` : '患者ごとの回収状況を更新します。'}
              </DialogDescription>
            </DialogHeader>
            {calendarActionDialog ? (
              <div className="space-y-3 text-sm text-slate-700">
                <div className={`${adminPanelClass} p-4`}>
                  <p>現在状態: <span className="font-medium text-slate-900">{collectionWorkflowStatusMeta[calendarActionDialog.status].label}</span></p>
                  <p className="mt-1 text-xs text-slate-500">この患者の回収状況だけをここで更新できます。</p>
                  {(() => {
                    const record = mergedCollectionRecords.find((item) => item.id === calendarActionDialog.recordId)
                    const notice = record ? getPaidRecordNotice(record) : null
                    return notice ? <p className="mt-2 text-xs font-medium text-amber-700">{notice}</p> : null
                  })()}
                  {savingCollectionRecordId === calendarActionDialog.recordId ? <p className="mt-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700">保存中です。反映されるまでこのままお待ちください。</p> : null}
                  {recentlySavedCollectionRecordId === calendarActionDialog.recordId ? <p className="success-badge-pop mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">✓ 保存しました。一覧の状態も更新されています。</p> : null}
                  {failedCollectionRecordId === calendarActionDialog.recordId ? <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{collectionErrorMessage}</p> : null}
                </div>
                <div className={`${adminPanelClass} p-4`}>
                  <p>最終処理者: <span className="text-slate-900">{mergedCollectionRecords.find((record) => record.id === calendarActionDialog.recordId)?.handledBy ?? '未対応'}</span></p>
                  <p className="mt-1">最終処理日時: <span className="text-slate-900">{formatJstDateTime(mergedCollectionRecords.find((record) => record.id === calendarActionDialog.recordId)?.handledAt ?? null)}</span></p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">処理メモ</p>
                  {calendarActionDialog.status !== 'paid' ? (
                    <div className="flex flex-wrap gap-2">
                      {onHoldReasonTags.map((tag) => (
                        <Button key={tag} type="button" size="sm" variant="outline" onClick={() => applyCalendarReasonTag(tag)} className="min-h-10 touch-manipulation border-rose-200 bg-white text-rose-700 hover:bg-rose-50">
                          #{tag}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                  <Input
                    value={calendarActionNote}
                    onChange={(e) => setCalendarActionNote(e.target.value)}
                    className={adminInputClass}
                    placeholder="入金確認、連絡内容、差し戻し理由など"
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={closeCalendarActionDialog} className="min-h-11 touch-manipulation sm:min-h-9">閉じる</Button>
                  {(() => {
                    const record = mergedCollectionRecords.find((item) => item.id === calendarActionDialog.recordId)
                    if (!record) return null
                    return getCollectionActionsForRecord(record).map((action) => (
                      <Button
                        key={action.kind}
                        type="button"
                        variant={action.kind === 'mark_paid' ? 'default' : 'outline'}
                        onClick={() => void runCollectionAction(record, action)}
                        disabled={savingCollectionRecordId === calendarActionDialog.recordId}
                        className={getCardActionClassName(action)}
                      >
                        {savingCollectionRecordId === calendarActionDialog.recordId
                          ? action.kind === 'request_correction' ? '送信中...' : '保存中...'
                          : action.label}
                      </Button>
                    ))
                  })()}
                </DialogFooter>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className={adminPageClass}>
      <AdminPageHeader
        title={isSystemAdmin ? '加盟店請求' : '請求管理'}
        description={isSystemAdmin ? '加盟店向けの月次請求状況を確認します。' : '加盟店ごとの月次請求と回収状況を確認します。'}
        actions={isSystemAdmin ? (
          <Button onClick={() => setBatchDialogOpen(true)} className="bg-indigo-600 text-white hover:bg-indigo-500">
            <Layers className="h-4 w-4" />
            一括請求書生成
          </Button>
        ) : undefined}
      />

      {isSystemAdmin && (
        <Card className={adminCardClass}>
          <CardContent className="p-4 text-sm text-slate-700">
            <p className="font-medium text-slate-900">system_admin 向け表示</p>
            <p className="mt-1 text-xs text-slate-500">ここでは加盟店への請求状態だけを扱い、患者ごとの回収処理や訪問単位の操作は表示しません。</p>
          </CardContent>
        </Card>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <AdminStatCard label="請求書発行済み" value={adminBillingRecords.length} icon={<FileText className="h-4 w-4" />} />
        <AdminStatCard label="入金確認済み" value={adminBillingRecords.filter((record) => record.status === 'paid').length} tone="success" icon={<CheckCircle className="h-4 w-4" />} />
        <AdminStatCard label="確認待ち" value={adminBillingRecords.filter((record) => record.status !== 'paid').length} tone="warning" icon={<Layers className="h-4 w-4" />} />
      </section>

      {generatedLabel && <Card className="border-indigo-200 bg-indigo-50"><CardContent className="p-3 text-sm text-indigo-700">{generatedLabel}</CardContent></Card>}

      {toastMessage && (
        <div className={cn(
          'fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-sm',
          toastTone === 'error'
            ? 'border border-rose-200 bg-rose-50 text-rose-700'
            : 'border border-emerald-200 bg-emerald-50 text-emerald-700',
        )}>
          {toastTone === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          {toastMessage}
        </div>
      )}

      {!isSystemAdmin && (
        <div className="space-y-3 lg:hidden">
          {adminBillingRecords.map((record) => (
            <Card key={record.id} className={adminCardClass}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{record.pharmacyName}</p>
                    <p className="text-xs text-slate-500">{record.month} 請求</p>
                  </div>
                  <StatusBadge meta={billingStatusMeta[record.status]} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div><p>請求書番号</p><p className="mt-1 text-slate-900">{record.invoiceNumber}</p></div>
                  <div><p>状態</p><p className="mt-1 text-slate-900">{billingStatusMeta[record.status].label}</p></div>
                  <div className="col-span-2"><p>確認状況</p><p className="mt-1 text-slate-900">{record.status === 'paid' ? '入金確認済みです' : '確認待ちです'}</p></div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setSelectedRecord(record)} className="text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800">
                    <FileText className="h-4 w-4" />
                    詳細
                  </Button>
                  {record.status !== 'paid' && <Button size="sm" onClick={() => handlePaymentConfirm(record.id, record.pharmacyName)} className="bg-emerald-600 text-white hover:bg-emerald-600/90">入金確認</Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className={`hidden lg:block ${adminTableClass}`}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 hover:bg-slate-50">
                <TableHead className="text-slate-500">加盟店</TableHead>
                <TableHead className="text-slate-500">請求書番号</TableHead>
                <TableHead className="text-slate-500">対象月</TableHead>
                <TableHead className="text-slate-500">状態</TableHead>
                <TableHead className="text-slate-500">確認メモ</TableHead>
                <TableHead className="text-right text-slate-500">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminBillingRecords.map((record) => (
                <TableRow key={record.id} className="border-slate-200 hover:bg-slate-50">
                  <TableCell className="font-medium text-slate-900">{record.pharmacyName}</TableCell>
                  <TableCell className="text-slate-600">{record.invoiceNumber}</TableCell>
                  <TableCell className="text-slate-600">{record.month}</TableCell>
                  <TableCell><StatusBadge meta={billingStatusMeta[record.status]} /></TableCell>
                  <TableCell className="text-slate-600">{record.status === 'paid' ? '入金確認済み' : '確認待ち'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedRecord(record)} className="text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800">詳細</Button>
                      {!isSystemAdmin && record.status !== 'paid' && <Button size="sm" onClick={() => handlePaymentConfirm(record.id, record.pharmacyName)} className="bg-emerald-600 text-white hover:bg-emerald-600/90">入金確認</Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent className={`${adminDialogClass} sm:max-w-md`}>
          <DialogHeader>
            <DialogTitle className="text-slate-900">一括請求書生成</DialogTitle>
            <DialogDescription className="text-slate-600">対象月を選ぶとモック請求書を生成します。</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-xs text-slate-500">対象月</p>
            <Input value={batchMonth} onChange={(e) => setBatchMonth(e.target.value)} className={adminInputClass} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setBatchDialogOpen(false)}>キャンセル</Button>
            <Button type="button" onClick={handleBatchGenerate} className="bg-indigo-500 text-white hover:bg-indigo-500/90">生成する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!statusDialog} onOpenChange={(open) => !open && setStatusDialog(null)}>
        <DialogContent className={`${adminDialogClass} sm:max-w-md`}>
          <DialogHeader>
            <DialogTitle className="text-slate-900">回収状況を更新</DialogTitle>
            <DialogDescription className="text-slate-600">
              {statusDialog ? `${statusDialog.patientName} の回収状況を「${collectionWorkflowStatusMeta[statusDialog.to].label}」に変更します。` : '回収状況を変更します。'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-slate-700">
            <div className={`${adminPanelClass} p-4`}>
              <p>変更前: <span className="font-medium text-slate-900">{statusDialog ? collectionWorkflowStatusMeta[statusDialog.from].label : '—'}</span></p>
              <p className="mt-1">変更後: <span className="font-medium text-slate-900">{statusDialog ? collectionWorkflowStatusMeta[statusDialog.to].label : '—'}</span></p>
	              {statusDialog?.from === 'paid' ? <p className="mt-2 text-xs text-amber-700">入金済みからのキャンセルは短時間内のみ可能です。ロック後は修正依頼に切り替わります。</p> : null}
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-500">メモ（任意）</p>
              {statusDialog?.to === 'on_hold' ? (
                <div className="flex flex-wrap gap-2">
                  {onHoldReasonTags.map((tag) => (
                    <Button key={tag} type="button" size="sm" variant="outline" onClick={() => applyStatusReasonTag(tag)} className="border-rose-200 bg-white text-rose-700 hover:bg-rose-50">
                      #{tag}
                    </Button>
                  ))}
                </div>
              ) : null}
              <Input value={statusChangeNote} onChange={(e) => setStatusChangeNote(e.target.value)} className={adminInputClass} placeholder="通帳確認、電話確認など" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setStatusDialog(null)}>キャンセル</Button>
            <Button type="button" onClick={confirmStatusChange} className="bg-indigo-500 text-white hover:bg-indigo-500/90">変更する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!calendarActionDialog} onOpenChange={(open) => !open && closeCalendarActionDialog()}>
        <DialogContent className={`${adminDialogClass} sm:max-w-lg`}>
          <DialogHeader>
            <DialogTitle className="text-slate-900">患者ごとの回収処理</DialogTitle>
            <DialogDescription className="text-slate-600">
              {calendarActionDialog ? `${calendarActionDialog.patientName} / ${calendarActionDialog.visitDate}` : '患者ごとの回収状況を更新します。'}
            </DialogDescription>
          </DialogHeader>
          {calendarActionDialog ? (
            <div className="space-y-3 text-sm text-slate-700">
              <div className={`${adminPanelClass} p-4`}>
                <p>現在状態: <span className="font-medium text-slate-900">{collectionWorkflowStatusMeta[calendarActionDialog.status].label}</span></p>
                <p className="mt-1 text-xs text-slate-500">この患者の回収状況だけをここで更新できます。</p>
                {savingCollectionRecordId === calendarActionDialog.recordId ? <p className="mt-2 text-xs text-indigo-600">保存中です。反映されるまでこのままお待ちください。</p> : null}
                {recentlySavedCollectionRecordId === calendarActionDialog.recordId ? <p className="mt-2 text-xs text-emerald-600">✓ 保存できました。一覧の状態も更新されています。</p> : null}
                {failedCollectionRecordId === calendarActionDialog.recordId ? <p className="mt-2 text-xs font-medium text-rose-600">{collectionErrorMessage}</p> : null}
              </div>
              <div className={`${adminPanelClass} p-4`}>
                <p>最終処理者: <span className="text-slate-900">{mergedCollectionRecords.find((record) => record.id === calendarActionDialog.recordId)?.handledBy ?? '未対応'}</span></p>
                <p className="mt-1">最終処理日時: <span className="text-slate-900">{formatJstDateTime(mergedCollectionRecords.find((record) => record.id === calendarActionDialog.recordId)?.handledAt ?? null)}</span></p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-slate-500">処理メモ</p>
                {calendarActionDialog.status !== 'paid' ? (
                  <div className="flex flex-wrap gap-2">
                    {onHoldReasonTags.map((tag) => (
                      <Button key={tag} type="button" size="sm" variant="outline" onClick={() => applyCalendarReasonTag(tag)} className="border-rose-200 bg-white text-rose-700 hover:bg-rose-50">
                        #{tag}
                      </Button>
                    ))}
                  </div>
                ) : null}
                <Input
                  value={calendarActionNote}
                  onChange={(e) => setCalendarActionNote(e.target.value)}
                  className={adminInputClass}
                  placeholder="入金確認、連絡内容、差し戻し理由など"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={closeCalendarActionDialog}>閉じる</Button>
                {(() => {
                  const record = mergedCollectionRecords.find((item) => item.id === calendarActionDialog.recordId)
                  if (!record) return null
                  return getCollectionActionsForRecord(record).map((action) => (
                    <Button
                      key={action.kind}
                      type="button"
                      variant={action.kind === 'mark_paid' ? 'default' : 'outline'}
                      onClick={() => void runCollectionAction(record, action)}
                      disabled={savingCollectionRecordId === calendarActionDialog.recordId}
                      className={getCardActionClassName(action)}
                    >
                      {savingCollectionRecordId === calendarActionDialog.recordId
                        ? action.kind === 'request_correction' ? '送信中...' : '保存中...'
                        : action.label}
                    </Button>
                  ))
                })()}
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className={`${adminDialogClass} sm:max-w-lg`}>
          <DialogHeader>
            <DialogTitle className="text-slate-900">請求状況の詳細</DialogTitle>
            <DialogDescription className="text-slate-600">{selectedRecord?.pharmacyName} / {selectedRecord?.month}</DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-3 text-sm text-slate-700">
              <div className={`${adminPanelClass} p-4`}>
                <p>請求書番号: <span className="text-slate-900">{selectedRecord.invoiceNumber}</span></p>
                <p className="mt-1">現在状態: <span className="text-slate-900">{billingStatusMeta[selectedRecord.status].label}</span></p>
                <p className="mt-1">対象月: <span className="text-slate-900">{selectedRecord.month}</span></p>
                <p className="mt-1">確認状況: <span className="text-slate-900">{selectedRecord.status === 'paid' ? '入金確認済みです' : '確認待ちです'}</span></p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setSelectedRecord(null)}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
