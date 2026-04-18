'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import type { BillingStatus } from '@/types/database'
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
import { CalendarDays, CheckCircle, FileText, Layers, Link2 } from 'lucide-react'

import { billingData, dayTaskData, patientData, type BillingRecord } from '@/lib/mock-data'
import { mergePatientSources } from '@/lib/patient-read-model'
import { billingStatusMeta, collectionWorkflowStatusMeta, type CollectionWorkflowStatus } from '@/lib/status-meta'

const BILLING_FLOW_DATE = '2026-03-28'

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


function parseIsoDateParts(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return { year, month, day }
}

const initialPatientCollectionRecords = [
  { id: 'COL-01', patientName: '田中 優子', month: '2026-03', amount: 12800, status: 'paid' as CollectionWorkflowStatus, dueDate: '2026-03-10', note: '口座振替完了', linkedTaskId: 'DT-260315-01', handledBy: '小林 薫', handledAt: '2026-03-15 10:28', billable: true },
  { id: 'COL-02', patientName: '佐々木 恒一', month: '2026-03', amount: 9400, status: 'billed' as CollectionWorkflowStatus, dueDate: '2026-03-12', note: '電話フォロー予定', linkedTaskId: 'DT-260315-02', handledBy: '小林 薫', handledAt: '2026-03-15 11:58', billable: true },
  { id: 'COL-03', patientName: '中村 恒一', month: '2026-03', amount: 15600, status: 'needs_attention' as CollectionWorkflowStatus, dueDate: '2026-03-05', note: '再請求書送付待ち', linkedTaskId: 'DT-260315-03', handledBy: null, handledAt: null, billable: false },
]

const visitChargeHistory = {
  'PT-001': [
    { visitId: 'V-001', prescriptionDate: '2026-03-01', visitDate: '2026-03-02', amount: 6400, status: 'paid' as BillingStatus },
    { visitId: 'V-002', prescriptionDate: '2026-03-08', visitDate: '2026-03-09', amount: 6400, status: 'paid' as BillingStatus },
  ],
  'PT-011': [
    { visitId: 'V-003', prescriptionDate: '2026-03-08', visitDate: '2026-03-09', amount: 4700, status: 'paid' as BillingStatus },
    { visitId: 'V-004', prescriptionDate: '2026-03-15', visitDate: '2026-03-16', amount: 4700, status: 'unpaid' as BillingStatus },
  ],
  'PT-012': [
    { visitId: 'V-005', prescriptionDate: '2026-03-15', visitDate: '2026-03-16', amount: 15600, status: 'overdue' as BillingStatus },
  ],
  'PT-013': [
    { visitId: 'V-006', prescriptionDate: '2026-03-12', visitDate: '2026-03-13', amount: 11200, status: 'unpaid' as BillingStatus },
  ],
}

export default function BillingPage() {
  const { role } = useAuth()
  const [records, setRecords] = useState<BillingRecord[]>(billingData)
  const [collectionRecords, setCollectionRecords] = useState(initialPatientCollectionRecords)
  const [sharedDayTasks, setSharedDayTasks] = useState(dayTaskData)
  const [databasePatients, setDatabasePatients] = useState<RegisteredPatientRecord[]>([])
  const [selectedRecord, setSelectedRecord] = useState<BillingRecord | null>(null)
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)
  const [batchMonth, setBatchMonth] = useState('2026-03')
  const [generatedLabel, setGeneratedLabel] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [processedUnbilledIds, setProcessedUnbilledIds] = useState<Set<string>>(new Set())
  const [statusDialog, setStatusDialog] = useState<CollectionStatusChangeDraft | null>(null)
  const [statusChangeNote, setStatusChangeNote] = useState('')
  const [calendarActionDialog, setCalendarActionDialog] = useState<CalendarActionDraft | null>(null)
  const [calendarActionNote, setCalendarActionNote] = useState('')
  const [inlineActionPatientId, setInlineActionPatientId] = useState<string | null>(null)
  const [patientSearch, setPatientSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | CollectionWorkflowStatus>('all')
  const [selectedCollectionDate, setSelectedCollectionDate] = useState<string | null>(null)
  const [showCollectionTable, setShowCollectionTable] = useState(false)
  const ownPharmacyId = 'PH-01'
  const isSystemAdmin = role === 'system_admin'
  const isPharmacyAdmin = role === 'pharmacy_admin'
  const isPharmacyRole = role === 'pharmacy_staff' || role === 'pharmacy_admin'

  const ownPatients = useMemo(() => {
    const source = databasePatients.length > 0
      ? mergePatientSources({ databasePatients, includeMockPatients: false })
      : patientData
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
    let cancelled = false

    async function fetchDayTasks() {
      try {
        const response = await fetch(`/api/day-flow/${BILLING_FLOW_DATE}/tasks`, { cache: 'no-store' })
        const result = await response.json().catch(() => null)
        if (!cancelled && response.ok && result?.ok && Array.isArray(result.tasks)) {
          const mapped = result.tasks.map((task: Record<string, unknown>) => ({
            id: String(task.id),
            patientId: String(task.patient_id ?? ''),
            pharmacyId: String(task.pharmacy_id ?? ''),
            flowDate: String(task.flow_date),
            sortOrder: Number(task.sort_order ?? 1),
            scheduledTime: String(task.scheduled_time ?? '10:00'),
            visitType: (task.visit_type as '定期' | '臨時' | '要確認') ?? '定期',
            source: (task.source as '自動生成' | '手動追加') ?? '自動生成',
            status: (task.status as 'scheduled' | 'in_progress' | 'completed') ?? 'scheduled',
            planningStatus: (task.planning_status as 'unplanned' | 'planned') ?? 'unplanned',
            plannedBy: (task.planned_by as string | null) ?? null,
            plannedById: (task.planned_by_id as string | null) ?? null,
            plannedAt: (task.planned_at as string | null) ?? null,
            handledBy: (task.handled_by as string | null) ?? null,
            handledById: (task.handled_by_id as string | null) ?? null,
            handledAt: (task.handled_at as string | null) ?? null,
            completedAt: (task.completed_at as string | null) ?? null,
            billable: Boolean(task.billable),
            collectionStatus: (task.collection_status as CollectionWorkflowStatus) ?? 'needs_billing',
            amount: Number(task.amount ?? 0),
            note: String(task.note ?? ''),
            updatedAt: (task.updated_at as string | null) ?? null,
            updatedById: (task.updated_by_id as string | null) ?? null,
          }))
          setSharedDayTasks(mapped)
          return
        }
      } catch {}

      if (!cancelled) {
        setSharedDayTasks(dayTaskData)
      }
    }

    fetchDayTasks()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function fetchPatients() {
      try {
        const response = await fetch(`/api/patients/by-pharmacy/${ownPharmacyId}`, { cache: 'no-store' })
        const result = await response.json().catch(() => null)
        if (!cancelled && response.ok && result?.ok && Array.isArray(result.patients)) {
          setDatabasePatients(result.patients)
        }
      } catch {
        if (!cancelled) setDatabasePatients([])
      }
    }

    fetchPatients()
    return () => {
      cancelled = true
    }
  }, [ownPharmacyId])

  const dayTaskCollectionRecords = useMemo(() => {
    return sharedDayTasks
      .filter((task) => task.pharmacyId === ownPharmacyId)
      .map((task) => {
        const patient = patientData.find((item) => item.id === task.patientId)
        const existing = initialPatientCollectionRecords.find((record) => record.linkedTaskId === task.id)
        const patientBilling = patientBillingSettings.get(task.patientId)
        const status = existing?.status ?? task.collectionStatus ?? 'needs_billing'
        return {
          id: existing?.id ?? `COL-${task.id}`,
          patientName: patient?.name ?? task.patientId,
          month: '2026-03',
          amount: task.amount,
          status: status as CollectionWorkflowStatus,
          dueDate: existing?.dueDate ?? '2026-03-25',
          note: existing?.note ?? (patientBilling?.isBillable === false ? (patientBilling.reason ?? '請求対象外') : 'day task 由来の請求候補'),
          linkedTaskId: task.id,
          handledBy: task.handledBy,
          handledAt: task.completedAt ?? task.handledAt,
          billable: task.billable && patientBilling?.isBillable !== false,
        }
      })
      .filter((record) => ownPatientNames.has(record.patientName))
  }, [ownPatientNames, ownPharmacyId, patientBillingSettings, sharedDayTasks])

  const mergedCollectionRecords = useMemo(() => {
    const manualOnly = collectionRecords.filter((record) => !dayTaskCollectionRecords.some((taskRecord) => taskRecord.linkedTaskId === record.linkedTaskId))
    return [...dayTaskCollectionRecords, ...manualOnly]
  }, [collectionRecords, dayTaskCollectionRecords])

  const patientVisitHistory = useMemo(() => {
    return ownPatients.map((patient) => {
      const tasks = dayTaskData.filter((task) => task.patientId === patient.id)
      const patientRecords = mergedCollectionRecords.filter((record) => record.patientName === patient.name)
      const visits = (visitChargeHistory[patient.id as keyof typeof visitChargeHistory] ?? []).map((visit) => {
        const linkedCollection = patientRecords.find((record) => record.handledAt?.slice(0, 10) === visit.visitDate)
          ?? patientRecords.find((record) => record.status === (visit.status === 'paid' ? 'paid' : visit.status === 'overdue' ? 'needs_attention' : 'billed'))
          ?? patientRecords[0]
        const workflowStatus = linkedCollection?.status ?? (visit.status === 'paid' ? 'paid' : visit.status === 'overdue' ? 'needs_attention' : 'billed')
        return {
          ...visit,
          workflowStatus,
          collectionRecordId: linkedCollection?.id ?? null,
          note: linkedCollection?.note ?? '',
        }
      })
      const lastVisit = tasks.filter((task) => task.completedAt).sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))[0]
      const calendarMonth = visits[0]?.visitDate ?? tasks.find((task) => task.completedAt)?.completedAt?.slice(0, 10) ?? '2026-03-01'
      const { year, month } = parseIsoDateParts(calendarMonth)
      return {
        patientId: patient.id,
        patientName: patient.name,
        lastVisitAt: lastVisit?.completedAt ?? '—',
        tasks,
        visits,
        calendarYear: year,
        calendarMonth: month - 1,
      }
    })
  }, [mergedCollectionRecords, ownPatients])

  const unbilledVisitRecords = useMemo(() => {
    return sharedDayTasks
      .filter((task) => task.pharmacyId === ownPharmacyId && task.status === 'completed' && task.billable)
      .map((task) => {
        const patient = patientData.find((item) => item.id === task.patientId)
        return {
          id: `UNB-${task.id}`,
          linkedTaskId: task.id,
          patientId: task.patientId,
          patientName: patient?.name ?? task.patientId,
          visitDate: task.completedAt?.slice(0, 10) ?? '2026-03-15',
          prescriptionDate: task.completedAt?.slice(0, 10) ?? '2026-03-15',
          visitType: task.visitType,
          staffName: task.handledBy ?? '未設定',
          amount: task.amount,
          status: String(task.collectionStatus) === 'needs_billing' ? 'ready' : 'review',
          note: task.note,
        }
      })
      .filter((record) => !mergedCollectionRecords.some((item) => item.linkedTaskId === record.linkedTaskId && item.billable))
      .filter((record) => !processedUnbilledIds.has(record.id))
  }, [mergedCollectionRecords, ownPharmacyId, processedUnbilledIds, sharedDayTasks])

  const filteredPatientVisitHistory = useMemo(() => {
    return patientVisitHistory.filter((item) => {
      const matchesSearch = patientSearch.trim().length === 0 || item.patientName.toLowerCase().includes(patientSearch.trim().toLowerCase())
      const matchesStatus = statusFilter === 'all' || item.visits.some((visit) => visit.workflowStatus === statusFilter)
      return matchesSearch && matchesStatus
    })
  }, [patientSearch, patientVisitHistory, statusFilter])

  const dateCollectionSummaries = useMemo(() => {
    const map = new Map<string, {
      date: string
      patientCount: number
      paidCount: number
      billedCount: number
      attentionCount: number
      items: Array<{
        patientId: string
        patientName: string
        visitDate: string
        amount: number
        status: CollectionWorkflowStatus
        note: string
        recordId: string | null
      }>
    }>()

    filteredPatientVisitHistory.forEach((patient) => {
      patient.visits.forEach((visit) => {
        const matchesStatus = statusFilter === 'all' || visit.workflowStatus === statusFilter
        if (!matchesStatus) return
        const existing = map.get(visit.visitDate) ?? {
          date: visit.visitDate,
          patientCount: 0,
          paidCount: 0,
          billedCount: 0,
          attentionCount: 0,
          items: [],
        }
        existing.patientCount += 1
        if (visit.workflowStatus === 'paid') existing.paidCount += 1
        if (visit.workflowStatus === 'billed' || visit.workflowStatus === 'needs_billing') existing.billedCount += 1
        if (visit.workflowStatus === 'needs_attention') existing.attentionCount += 1
        existing.items.push({
          patientId: patient.patientId,
          patientName: patient.patientName,
          visitDate: visit.visitDate,
          amount: visit.amount,
          status: visit.workflowStatus,
          note: visit.note,
          recordId: visit.collectionRecordId ?? null,
        })
        map.set(visit.visitDate, existing)
      })
    })

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [filteredPatientVisitHistory, statusFilter])

  const selectedDateSummary = useMemo(() => {
    if (!selectedCollectionDate) return null
    return dateCollectionSummaries.find((item) => item.date === selectedCollectionDate) ?? null
  }, [dateCollectionSummaries, selectedCollectionDate])

  const summary = useMemo(() => {
    if (isPharmacyRole) {
      const source = mergedCollectionRecords.filter((r) => r.billable)
      return {
        needsBilling: source.filter((record) => record.status === 'needs_billing').length,
        billed: source.filter((record) => record.status === 'billed').length,
        paid: source.filter((record) => record.status === 'paid').length,
        needsAttention: source.filter((record) => record.status === 'needs_attention').length,
      }
    }

    return {
      issued: records.length,
      paid: records.filter((record) => record.status === 'paid').length,
      pending: records.filter((record) => record.status !== 'paid').length,
    }
  }, [isPharmacyRole, records, mergedCollectionRecords])

  const handleBatchGenerate = () => {
    setGeneratedLabel(`${batchMonth} の請求書を ${records.length} 件生成しました（モック）`)
    setBatchDialogOpen(false)
  }

  const handlePaymentConfirm = (recordId: string, pharmacyName: string) => {
    setRecords((prev) => prev.map((r) => (r.id === recordId ? { ...r, status: 'paid' as BillingStatus } : r)))
    setToastMessage(`${pharmacyName} の入金を確認しました（モック）`)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const updateCollectionStatus = async (recordId: string, status: CollectionWorkflowStatus, note?: string) => {
    const target = mergedCollectionRecords.find((record) => record.id === recordId)
    setCollectionRecords((prev) => prev.map((r) => (r.id === recordId ? { ...r, status, note: note?.trim() ? note.trim() : r.note } : r)))

    if (target?.linkedTaskId) {
      const dayTask = sharedDayTasks.find((task) => task.id === target.linkedTaskId)
      if (dayTask) {
        try {
          const response = await fetch(`/api/day-flow/tasks/${dayTask.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              task: {
                ...dayTask,
                collectionStatus: status,
                note: note?.trim() ? note.trim() : dayTask.note,
              },
            }),
          })
          if (!response.ok) {
            throw new Error('collection_status_save_failed')
          }
        } catch {
          setToastMessage('回収状況の保存に失敗しました')
          setTimeout(() => setToastMessage(''), 3000)
          return
        }
      }
    }

    setToastMessage(`回収状況を更新しました`)
    setTimeout(() => setToastMessage(''), 3000)
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
    await updateCollectionStatus(statusDialog.recordId, statusDialog.to, statusChangeNote)
    setStatusDialog(null)
    setStatusChangeNote('')
  }

  const openCalendarActionDialog = (draft: CalendarActionDraft, patientId?: string) => {
    setCalendarActionDialog(draft)
    setCalendarActionNote(draft.note ?? '')
    setInlineActionPatientId(patientId ?? null)
  }

  const submitCalendarAction = async (status: CollectionWorkflowStatus) => {
    if (!calendarActionDialog) return
    await updateCollectionStatus(calendarActionDialog.recordId, status, calendarActionNote)
    setCalendarActionDialog(null)
    setCalendarActionNote('')
    setInlineActionPatientId(null)
  }

  const createCollectionRecordFromUnbilled = (record: {
    id: string
    linkedTaskId: string
    patientName: string
    amount: number
    note: string
    staffName: string
    visitDate: string
  }) => {
    const collectionId = `COL-${record.linkedTaskId}`
    setCollectionRecords((prev) => [
      {
        id: collectionId,
        patientName: record.patientName,
        month: record.visitDate.slice(0, 7),
        amount: record.amount,
        status: 'needs_billing' as CollectionWorkflowStatus,
        dueDate: '2026-03-25',
        note: `請求処理へ回した訪問: ${record.note}`,
        linkedTaskId: record.linkedTaskId,
        handledBy: record.staffName,
        handledAt: `${record.visitDate} 18:00`,
        billable: true,
      },
      ...prev,
    ])
    setProcessedUnbilledIds((prev) => new Set(prev).add(record.id))
    return collectionId
  }

  const sendUnbilledToCollections = (record: {
    id: string
    linkedTaskId: string
    patientName: string
    amount: number
    note: string
    staffName: string
    visitDate: string
  }) => {
    createCollectionRecordFromUnbilled(record)
    setToastMessage(`${record.patientName} を請求必要へ追加しました`)
    setTimeout(() => setToastMessage(''), 3000)
  }

  if (role === 'pharmacy_staff' || role === 'pharmacy_admin') {
    return (
      <div className={adminPageClass}>
        <AdminPageHeader title="回収管理" description="対応完了後の請求必要、請求済み、入金済み、要確認を追います。" />
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <AdminStatCard label="請求必要" value={summary.needsBilling} tone="primary" icon={<FileText className="h-4 w-4" />} />
          <AdminStatCard label="未入金" value={summary.billed} tone="warning" icon={<Layers className="h-4 w-4" />} />
          <AdminStatCard label="入金済み" value={summary.paid} tone="success" icon={<CheckCircle className="h-4 w-4" />} />
          <AdminStatCard label="要確認" value={summary.needsAttention} tone="danger" icon={<CalendarDays className="h-4 w-4" />} />
        </section>

        <Card className={adminCardClass}>
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <span>対応完了した訪問のうち、請求対象だけを請求必要から入金済みまで追います。</span>
              <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">回収進捗管理</Badge>
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
                  { key: 'all', label: '全て' },
                  { key: 'needs_billing', label: '請求必要' },
                  { key: 'billed', label: '未入金' },
                  { key: 'needs_attention', label: '要注意' },
                  { key: 'paid', label: '入金済み' },
                ].map((option) => (
                  <Button
                    key={option.key}
                    type="button"
                    size="sm"
                    variant={statusFilter === option.key ? 'default' : 'outline'}
                    onClick={() => setStatusFilter(option.key as 'all' | CollectionWorkflowStatus)}
                    className={cn(
                      statusFilter === option.key
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

        <Card className={adminCardClass}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-900">請求必要の訪問一覧</CardTitle>
            <CardDescription className="text-slate-600">対応完了した訪問のうち、請求対象だけをここで回収管理に進めます</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-2xl font-bold text-slate-900">{unbilledVisitRecords.length}</p>
                <p className="text-[10px] text-slate-500">請求必要</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600">{unbilledVisitRecords.filter((record) => record.status === 'ready').length}</p>
                <p className="text-[10px] text-slate-500">そのまま請求可</p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">{unbilledVisitRecords.filter((record) => record.status === 'review').length}</p>
                <p className="text-[10px] text-slate-500">請求前に確認</p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
              請求対象外の患者はここに出ません。患者詳細の「請求設定」で対象外にしたものは、対応完了しても回収管理へ上がりません。
            </div>

            {unbilledVisitRecords.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-500">請求必要の候補はありません。対応完了かつ請求対象の訪問があるとここに載ります。</p>
            ) : (
              <div className="space-y-2">
                {unbilledVisitRecords.map((record) => (
                  <div key={record.id} className="soft-pop rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-slate-300 hover:shadow-md">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{record.patientName}</p>
                        <p className="mt-1 text-xs text-slate-500">訪問日 {record.visitDate} / 処方日 {record.prescriptionDate} / {record.visitType}</p>
                        <p className="mt-1 text-xs text-slate-500">担当: {record.staffName} / task: {record.linkedTaskId}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={cn('border text-[10px]', record.status === 'ready' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700')}>
                          {record.status === 'ready' ? 'そのまま請求可' : '請求前に確認'}
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{record.note}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" className="soft-pop-sm border-slate-200 bg-white text-slate-700 hover:bg-slate-50">内容確認</Button>
                      <Button size="sm" variant="outline" className="soft-pop-sm border-slate-200 bg-white text-slate-700 hover:bg-slate-50">要確認メモ</Button>
                      <Button size="sm" onClick={() => sendUnbilledToCollections(record)} className="soft-pop-sm bg-indigo-600 text-white hover:bg-indigo-600/90">請求必要に追加</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={adminCardClass}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-900"><CalendarDays className="h-4 w-4 text-indigo-500" />日付から回収状況を見る</CardTitle>
            <CardDescription className="text-slate-600">まず日付を選び、その日の対象患者だけを確認します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dateCollectionSummaries.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                条件に合う日付はありません。検索語かステータスを見直してください。
              </div>
            ) : (
              <div className="space-y-2">
                {dateCollectionSummaries.map((summaryItem) => {
                  const hasAttention = summaryItem.attentionCount > 0
                  const allPaid = summaryItem.patientCount > 0 && summaryItem.paidCount === summaryItem.patientCount
                  const toneClass = hasAttention
                    ? 'border-rose-200 bg-rose-50'
                    : allPaid
                      ? 'border-sky-200 bg-sky-50'
                      : 'border-amber-200 bg-amber-50'
                  return (
                    <button
                      key={summaryItem.date}
                      type="button"
                      onClick={() => setSelectedCollectionDate(summaryItem.date)}
                      className={cn('w-full rounded-xl border p-4 text-left transition hover:shadow-sm', toneClass, selectedCollectionDate === summaryItem.date && 'ring-2 ring-indigo-300')}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{summaryItem.date}</p>
                          <p className="mt-1 text-xs text-slate-600">
                            {summaryItem.attentionCount > 0
                              ? '要注意の患者があります'
                              : allPaid
                                ? 'この日はすべて入金済みです'
                                : '未入金の患者があります'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[11px]">
                          {summaryItem.attentionCount > 0 ? <Badge variant="outline" className="border-rose-200 bg-white text-rose-700">要注意あり</Badge> : null}
                          {summaryItem.billedCount > 0 ? <Badge variant="outline" className="border-amber-200 bg-white text-amber-700">未入金あり</Badge> : null}
                          {allPaid ? <Badge variant="outline" className="border-sky-200 bg-white text-sky-700">すべて入金済み</Badge> : null}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {selectedDateSummary ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{selectedDateSummary.date} の対象患者</p>
                    <p className="text-xs text-slate-500">その日の患者だけを下に表示しています</p>
                  </div>
                  <Button type="button" variant="ghost" onClick={() => { setSelectedCollectionDate(null); setCalendarActionDialog(null); setInlineActionPatientId(null) }}>閉じる</Button>
                </div>
                <div className="mt-3 space-y-3">
                  {selectedDateSummary.items.map((item) => (
                    <div key={`${item.patientId}-${item.visitDate}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{item.patientName}</p>
                          <p className="mt-1 text-xs text-slate-500">{item.visitDate} の回収状況を確認します</p>
                        </div>
                        <StatusBadge meta={collectionWorkflowStatusMeta[item.status]} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => openCalendarActionDialog({
                            recordId: item.recordId ?? `TEMP-${item.patientId}-${item.visitDate}`,
                            patientName: item.patientName,
                            visitDate: item.visitDate,
                            amount: item.amount,
                            status: item.status,
                            note: item.note,
                          }, item.patientId)}
                          className="bg-indigo-600 text-white hover:bg-indigo-600/90"
                        >
                          この患者を確認する
                        </Button>
                      </div>

                      {calendarActionDialog && inlineActionPatientId === item.patientId && calendarActionDialog.visitDate === item.visitDate ? (
                        <div className="mt-3 rounded-xl border border-indigo-200 bg-white p-4 shadow-sm">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-900">回収処理</p>
                            <p className="text-xs text-slate-500">{calendarActionDialog.patientName} / {calendarActionDialog.visitDate}</p>
                          </div>
                          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                            <p>現在状態: <span className="font-medium text-slate-900">{collectionWorkflowStatusMeta[calendarActionDialog.status].label}</span></p>
                            <p className="mt-1 text-xs text-slate-500">この患者の回収状況だけをここで更新できます。</p>
                          </div>
                          <div className="mt-3 space-y-2">
                            <p className="text-xs text-slate-500">処理メモ</p>
                            <Input
                              value={calendarActionNote}
                              onChange={(e) => setCalendarActionNote(e.target.value)}
                              className={adminInputClass}
                              placeholder="入金確認、連絡内容、差し戻し理由など"
                            />
                          </div>
                          <div className="mt-3 grid grid-cols-1 gap-2">
                            {(calendarActionDialog.status === 'billed' || calendarActionDialog.status === 'needs_attention') ? (
                              <Button type="button" onClick={() => void submitCalendarAction('paid')} className="bg-emerald-600 text-white hover:bg-emerald-600/90">入金済みにする</Button>
                            ) : null}
                            {calendarActionDialog.status !== 'needs_attention' && calendarActionDialog.status !== 'paid' ? (
                              <Button type="button" variant="outline" onClick={() => void submitCalendarAction('needs_attention')} className="border-rose-200 bg-white text-rose-700 hover:bg-rose-50">要確認にする</Button>
                            ) : null}
                            {calendarActionDialog.status === 'paid' && isPharmacyAdmin ? (
                              <Button type="button" variant="outline" onClick={() => void submitCalendarAction('needs_attention')} className="border-amber-200 bg-white text-amber-700 hover:bg-amber-50">入金済みを見直す</Button>
                            ) : null}
                            <Button type="button" variant="ghost" onClick={() => { setCalendarActionDialog(null); setCalendarActionNote(''); setInlineActionPatientId(null) }}>閉じる</Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm text-slate-900">一覧で確認する</CardTitle>
                <CardDescription className="text-slate-600">下の一覧は補助用です。日付から確認しづらいときだけ使えます。</CardDescription>
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
                  {mergedCollectionRecords.map((record) => (
                    <TableRow key={record.id} className="border-slate-200 transition hover:bg-slate-50">
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
                        <p className="text-slate-500">{record.handledAt ?? '—'}</p>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="outline" className={cn('border text-xs', record.billable ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' : 'border-gray-500/40 bg-gray-500/20 text-gray-300')}>
                            {record.billable ? '請求対象' : '請求対象外'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell><StatusBadge meta={collectionWorkflowStatusMeta[record.status]} /></TableCell>
                      <TableCell className="text-xs text-slate-500">{record.note || '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {record.billable && record.status === 'needs_billing' && <Button size="sm" variant="ghost" onClick={() => openStatusDialog(record.id, 'billed')} className="text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800">請求済みにする</Button>}
                          {record.billable && (record.status === 'billed' || record.status === 'needs_attention') && <Button size="sm" variant="ghost" onClick={() => openStatusDialog(record.id, 'paid')} className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800">入金済みにする</Button>}
                          {record.billable && record.status !== 'needs_attention' && <Button size="sm" variant="ghost" onClick={() => openStatusDialog(record.id, 'needs_attention')} className="text-rose-700 hover:bg-rose-50 hover:text-rose-800">要確認にする</Button>}
                          {record.billable && record.status === 'paid' && isPharmacyAdmin && <Button size="sm" variant="ghost" onClick={() => openStatusDialog(record.id, 'needs_attention')} className="text-amber-700 hover:bg-amber-50 hover:text-amber-800">入金済みを見直す</Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          ) : (
            <CardContent className="px-4 pb-4 pt-0 text-xs text-slate-500">必要なときだけ一覧を開けます。</CardContent>
          )}
        </Card>
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
        <AdminStatCard label="請求書発行済み" value={records.length} icon={<FileText className="h-4 w-4" />} />
        <AdminStatCard label="入金確認済み" value={records.filter((record) => record.status === 'paid').length} tone="success" icon={<CheckCircle className="h-4 w-4" />} />
        <AdminStatCard label="確認待ち" value={records.filter((record) => record.status !== 'paid').length} tone="warning" icon={<Layers className="h-4 w-4" />} />
      </section>

      {generatedLabel && <Card className="border-indigo-200 bg-indigo-50"><CardContent className="p-3 text-sm text-indigo-700">{generatedLabel}</CardContent></Card>}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-lg backdrop-blur-sm">
          <CheckCircle className="h-4 w-4" />
          {toastMessage}
        </div>
      )}

      {!isSystemAdmin && (
        <div className="space-y-3 lg:hidden">
          {records.map((record) => (
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
              {records.map((record) => (
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
              {statusDialog?.from === 'paid' ? <p className="mt-2 text-xs text-amber-700">入金済みからの見直しは管理者向けの慎重操作です。</p> : null}
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-500">メモ（任意）</p>
              <Input value={statusChangeNote} onChange={(e) => setStatusChangeNote(e.target.value)} className={adminInputClass} placeholder="通帳確認、電話確認など" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setStatusDialog(null)}>キャンセル</Button>
            <Button type="button" onClick={confirmStatusChange} className="bg-indigo-500 text-white hover:bg-indigo-500/90">変更する</Button>
          </DialogFooter>
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
