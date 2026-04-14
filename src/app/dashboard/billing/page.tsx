'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import type { BillingStatus } from '@/types/database'
import { Badge } from '@/components/ui/badge'
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

const DAY_TASK_STORAGE_KEY = 'makasete-day-tasks'

const statusClass: Record<BillingStatus, string> = {
  paid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  unpaid: 'border-amber-200 bg-amber-50 text-amber-700',
  overdue: 'border-rose-200 bg-rose-50 text-rose-700',
}

const statusLabel: Record<BillingStatus, string> = {
  paid: '入金済',
  unpaid: '未入金',
  overdue: '期限超過',
}

const yen = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
  maximumFractionDigits: 0,
})

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return { firstDay, daysInMonth }
}

function parseIsoDateParts(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return { year, month, day }
}

function statusCalendarClass(status: BillingStatus) {
  switch (status) {
    case 'paid':
      return 'bg-emerald-500 text-white'
    case 'unpaid':
      return 'bg-amber-500 text-[#11182c]'
    case 'overdue':
      return 'bg-rose-500 text-white'
  }
}

const initialPatientCollectionRecords = [
  { id: 'COL-01', patientName: '田中 優子', month: '2026-03', amount: 12800, status: 'paid' as BillingStatus, dueDate: '2026-03-10', note: '口座振替完了', linkedTaskId: 'DT-260315-01', handledBy: '小林 薫', handledAt: '2026-03-15 10:28', billable: true },
  { id: 'COL-02', patientName: '佐々木 恒一', month: '2026-03', amount: 9400, status: 'unpaid' as BillingStatus, dueDate: '2026-03-12', note: '電話フォロー予定', linkedTaskId: 'DT-260315-02', handledBy: '小林 薫', handledAt: '2026-03-15 11:58', billable: true },
  { id: 'COL-03', patientName: '中村 恒一', month: '2026-03', amount: 15600, status: 'overdue' as BillingStatus, dueDate: '2026-03-05', note: '再請求書送付待ち', linkedTaskId: 'DT-260315-03', handledBy: null, handledAt: null, billable: false },
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
  const [selectedRecord, setSelectedRecord] = useState<BillingRecord | null>(null)
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)
  const [batchMonth, setBatchMonth] = useState('2026-03')
  const [generatedLabel, setGeneratedLabel] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null)
  const [collapsedPatientIds, setCollapsedPatientIds] = useState<Set<string>>(new Set())
  const [selectedVisitKey, setSelectedVisitKey] = useState<string | null>(null)
  const [processedUnbilledIds, setProcessedUnbilledIds] = useState<Set<string>>(new Set())
  const ownPharmacyId = 'PH-01'
  const isSystemAdmin = role === 'system_admin'
  const isPharmacyRole = role === 'pharmacy_staff' || role === 'pharmacy_admin'

  const ownPatients = useMemo(() => patientData.filter((patient) => patient.pharmacyId === ownPharmacyId), [ownPharmacyId])
  const ownPatientNames = useMemo(() => new Set(ownPatients.map((patient) => patient.name)), [ownPatients])

  useEffect(() => {
    setCollapsedPatientIds((prev) => (prev.size > 0 ? prev : new Set(ownPatients.map((patient) => patient.id))))
  }, [ownPatients])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DAY_TASK_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) setSharedDayTasks(parsed)
      }
    } catch {}
  }, [])

  const dayTaskCollectionRecords = useMemo(() => {
    return sharedDayTasks
      .filter((task) => task.pharmacyId === ownPharmacyId)
      .map((task) => {
        const patient = patientData.find((item) => item.id === task.patientId)
        const existing = initialPatientCollectionRecords.find((record) => record.linkedTaskId === task.id)
        const status = existing?.status ?? (task.collectionStatus === '入金済' ? 'paid' : task.collectionStatus === '回収中' ? 'unpaid' : 'unpaid')
        return {
          id: existing?.id ?? `COL-${task.id}`,
          patientName: patient?.name ?? task.patientId,
          month: '2026-03',
          amount: task.amount,
          status: status as BillingStatus,
          dueDate: existing?.dueDate ?? '2026-03-25',
          note: existing?.note ?? (task.billable ? 'day task 由来の請求候補' : 'day task 完了前'),
          linkedTaskId: task.id,
          handledBy: task.handledBy,
          handledAt: task.completedAt ?? task.handledAt,
          billable: task.billable,
        }
      })
      .filter((record) => ownPatientNames.has(record.patientName))
  }, [ownPatientNames, ownPharmacyId, sharedDayTasks])

  const mergedCollectionRecords = useMemo(() => {
    const manualOnly = collectionRecords.filter((record) => !dayTaskCollectionRecords.some((taskRecord) => taskRecord.linkedTaskId === record.linkedTaskId))
    return [...dayTaskCollectionRecords, ...manualOnly]
  }, [collectionRecords, dayTaskCollectionRecords])

  const patientVisitHistory = useMemo(() => {
    return ownPatients.map((patient) => {
      const tasks = dayTaskData.filter((task) => task.patientId === patient.id)
      const visits = visitChargeHistory[patient.id as keyof typeof visitChargeHistory] ?? []
      const billedVisits = visits.length
      const collectedVisits = visits.filter((visit) => visit.status === 'paid').length
      const lastVisit = tasks.filter((task) => task.completedAt).sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))[0]
      const calendarMonth = visits[0]?.visitDate ?? tasks.find((task) => task.completedAt)?.completedAt?.slice(0, 10) ?? '2026-03-01'
      const { year, month } = parseIsoDateParts(calendarMonth)
      return {
        patientId: patient.id,
        patientName: patient.name,
        visitCount: tasks.length,
        billedVisits,
        collectedVisits,
        lastVisitAt: lastVisit?.completedAt ?? '—',
        tasks,
        visits,
        calendarYear: year,
        calendarMonth: month - 1,
      }
    })
  }, [ownPatients])

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
          status: task.collectionStatus === '請求準備OK' ? 'ready' : 'review',
          note: task.note,
        }
      })
      .filter((record) => !mergedCollectionRecords.some((item) => item.linkedTaskId === record.linkedTaskId && item.billable))
      .filter((record) => !processedUnbilledIds.has(record.id))
  }, [mergedCollectionRecords, ownPharmacyId, processedUnbilledIds, sharedDayTasks])

  const summary = useMemo(() => {
    const source = isPharmacyRole
      ? mergedCollectionRecords.filter((r) => r.billable).map((r) => ({ total: r.amount, status: r.status }))
      : records.map((r) => ({ total: r.total, status: r.status }))
    const totalBilled = source.reduce((sum, record) => sum + record.total, 0)
    const collected = source.filter((record) => record.status === 'paid').reduce((sum, record) => sum + record.total, 0)
    const outstanding = source.filter((record) => record.status !== 'paid').reduce((sum, record) => sum + record.total, 0)

    return { totalBilled, collected, outstanding }
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

  const updateCollectionStatus = (recordId: string, status: BillingStatus) => {
    setCollectionRecords((prev) => prev.map((r) => (r.id === recordId ? { ...r, status } : r)))
    setToastMessage(`回収状況を更新しました（モック）`)
    setTimeout(() => setToastMessage(''), 3000)
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
    setCollectionRecords((prev) => [
      {
        id: `COL-${record.linkedTaskId}`,
        patientName: record.patientName,
        month: record.visitDate.slice(0, 7),
        amount: record.amount,
        status: 'unpaid' as BillingStatus,
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
    setToastMessage(`${record.patientName} を請求処理に回しました（モック）`)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const togglePatientCard = (patientId: string) => {
    setCollapsedPatientIds((prev) => {
      const next = new Set(prev)
      if (next.has(patientId)) {
        next.delete(patientId)
      } else {
        next.add(patientId)
      }
      return next
    })
    setExpandedPatientId((prev) => (prev === patientId ? null : patientId))
    setSelectedVisitKey((prev) => (prev?.startsWith(`${patientId}:`) ? null : prev))
  }

  if (role === 'pharmacy_staff' || role === 'pharmacy_admin') {
    return (
      <div className={adminPageClass}>
        <AdminPageHeader title="回収管理" description="請求処理が終わった訪問について、入金確認や督促を行います。" />
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <AdminStatCard label="請求総額" value={yen.format(summary.totalBilled)} icon={<FileText className="h-4 w-4" />} />
          <AdminStatCard label="回収済み" value={yen.format(summary.collected)} tone="success" icon={<CheckCircle className="h-4 w-4" />} />
          <AdminStatCard label="未回収" value={yen.format(summary.outstanding)} tone="warning" icon={<Layers className="h-4 w-4" />} />
        </section>

        <Card className={adminCardClass}>
          <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4 text-xs text-slate-600">
            <span>在宅訪問の点数、請求額、回収状況を未請求から回収管理まで一連で確認できます。</span>
            <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">BtoC collection</Badge>
          </CardContent>
        </Card>

        <Card className={adminCardClass}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-900">請求処理が必要な訪問一覧</CardTitle>
            <CardDescription className="text-slate-600">対応完了した訪問を確認して、請求処理へ回すための一覧です</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-2xl font-bold text-slate-900">{unbilledVisitRecords.length}</p>
                <p className="text-[10px] text-slate-500">請求処理が必要</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600">{unbilledVisitRecords.filter((record) => record.status === 'ready').length}</p>
                <p className="text-[10px] text-slate-500">請求化OK</p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">{unbilledVisitRecords.filter((record) => record.status === 'review').length}</p>
                <p className="text-[10px] text-slate-500">確認待ち</p>
              </div>
            </div>

            {unbilledVisitRecords.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-500">未請求候補はありません。患者詳細または day task から訪問実績を登録するとここに載ります。</p>
            ) : (
              <div className="space-y-2">
                {unbilledVisitRecords.map((record) => (
                  <div key={record.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{record.patientName}</p>
                        <p className="mt-1 text-xs text-slate-500">訪問日 {record.visitDate} / 処方日 {record.prescriptionDate} / {record.visitType}</p>
                        <p className="mt-1 text-xs text-slate-500">担当: {record.staffName} / task: {record.linkedTaskId}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={cn('border text-[10px]', record.status === 'ready' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700')}>
                          {record.status === 'ready' ? '請求化OK' : '確認待ち'}
                        </Badge>
                        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">{yen.format(record.amount)}</Badge>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{record.note}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">内容確認</Button>
                      <Button size="sm" variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">金額補正</Button>
                      <Button size="sm" onClick={() => sendUnbilledToCollections(record)} className="bg-indigo-600 text-white hover:bg-indigo-600/90">請求処理に回す</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={adminCardClass}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-900"><CalendarDays className="h-4 w-4 text-indigo-500" />患者別 回収到達状況</CardTitle>
            <CardDescription className="text-slate-600">訪問日ごとの回収状況をカレンダーで確認できます</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {patientVisitHistory.map((item) => {
              const { firstDay, daysInMonth } = getMonthDays(item.calendarYear, item.calendarMonth)
              const visitMap = new Map(item.visits.map((visit) => [visit.visitDate, visit]))
              return (
                <div key={item.patientId} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  <button
                    type="button"
                    onClick={() => togglePatientCard(item.patientId)}
                    className="w-full text-left"
                  >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.patientName}</p>
                      <p className="text-[11px] text-slate-500">最終訪問: {item.lastVisitAt}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">訪問 {item.visitCount}回 / 請求 {item.billedVisits}回 / 回収 {item.collectedVisits}回</Badge>
                      <span className="text-xs text-slate-500">{collapsedPatientIds.has(item.patientId) ? 'タップで開く' : 'タップで閉じる'}</span>
                    </div>
                  </div>
                  </button>

                  {!collapsedPatientIds.has(item.patientId) && (
                    <>
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-2 text-xs text-slate-500">{item.calendarYear}年{item.calendarMonth + 1}月</p>
                    <div className="mb-1 grid grid-cols-7 gap-1">
                      {['日', '月', '火', '水', '木', '金', '土'].map((label, i) => (
                        <div key={label} className={cn('py-1 text-center text-[10px]', i === 0 ? 'text-rose-500' : i === 6 ? 'text-sky-500' : 'text-slate-500')}>
                          {label}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${item.patientId}-${i}`} className="h-10" />)}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1
                        const dateKey = `${item.calendarYear}-${String(item.calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                        const visit = visitMap.get(dateKey)
                        const visitKey = `${item.patientId}:${dateKey}`
                        const actionable = visit && visit.status !== 'paid'
                        return (
                          <button
                            key={dateKey}
                            type="button"
                            onClick={() => { if (actionable) { setExpandedPatientId(item.patientId); setSelectedVisitKey(selectedVisitKey === visitKey ? null : visitKey) } }}
                            className={cn('flex h-10 items-center justify-center rounded-md text-xs font-medium', visit ? statusCalendarClass(visit.status) : 'border border-slate-200 bg-white text-slate-400', actionable && 'cursor-pointer ring-1 ring-transparent hover:ring-amber-300/60')}
                          >
                            {day}
                          </button>
                        )
                      })}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-500" />回収済み</span>
                      <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-500" />未回収</span>
                      <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-rose-500" />期限超過</span>
                    </div>
                  </div>

                  {expandedPatientId === item.patientId && (
                    <div className="mt-3 space-y-2">
                      {item.visits.map((visit) => {
                        return (
                          <div key={visit.visitId} className="grid grid-cols-1 gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 sm:grid-cols-5">
                            <div><p className="text-slate-500">処方日</p><p className="mt-1">{visit.prescriptionDate}</p></div>
                            <div><p className="text-slate-500">訪問日</p><p className="mt-1">{visit.visitDate}</p></div>
                            <div><p className="text-slate-500">請求額</p><p className="mt-1">{yen.format(visit.amount)}</p></div>
                            <div><p className="text-slate-500">状態</p><Badge variant="outline" className={cn('mt-1 border text-[10px]', statusClass[visit.status])}>{statusLabel[visit.status]}</Badge></div>
                            <div><p className="text-slate-500">回収到達</p><p className="mt-1">{visit.status === 'paid' ? '回収済み' : visit.status === 'unpaid' ? '請求済み/未回収' : '期限超過'}</p></div>
                          </div>
                        )
                      })}

                      {(() => {
                        const selectedVisit = item.visits.find((visit) => `${item.patientId}:${visit.visitDate}` === selectedVisitKey)
                        if (!selectedVisit || selectedVisit.status === 'paid') return null
                        const isOverdue = selectedVisit.status === 'overdue'
                        return (
                          <div className={cn('rounded-lg p-4', isOverdue ? 'border border-rose-500/30 bg-rose-500/10' : 'border border-amber-500/30 bg-amber-500/10')}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium text-slate-900">{isOverdue ? '期限超過対応フロー' : '未回収対応フロー'}</p>
                                <p className="text-xs text-slate-500">{selectedVisit.visitDate} / {yen.format(selectedVisit.amount)}</p>
                              </div>
                              <Badge variant="outline" className={cn('border text-xs', statusClass[selectedVisit.status])}>{statusLabel[selectedVisit.status]}</Badge>
                            </div>
                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                              {isOverdue ? (
                                <>
                                  <div className="rounded-md border border-slate-200 bg-white p-3">
                                    <p className="text-[11px] text-slate-500">STEP 1</p>
                                    <p className="mt-1 text-sm text-slate-900">再督促</p>
                                    <p className="mt-1 text-[11px] text-slate-500">最終督促日と相手の反応を残す</p>
                                  </div>
                                  <div className="rounded-md border border-[#2a3553] bg-[#1a2035] p-3">
                                    <p className="text-[11px] text-gray-500">STEP 2</p>
                                    <p className="mt-1 text-sm text-white">管理者確認</p>
                                    <p className="mt-1 text-[11px] text-gray-400">長期滞留なら管理者判断に上げる</p>
                                  </div>
                                  <div className="rounded-md border border-[#2a3553] bg-[#1a2035] p-3">
                                    <p className="text-[11px] text-gray-500">STEP 3</p>
                                    <p className="mt-1 text-sm text-white">状態更新</p>
                                    <p className="mt-1 text-[11px] text-gray-400">督促継続 or 対応完了へ更新</p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="rounded-md border border-[#2a3553] bg-[#1a2035] p-3">
                                    <p className="text-[11px] text-gray-500">STEP 1</p>
                                    <p className="mt-1 text-sm text-white">患者へ連絡</p>
                                    <p className="mt-1 text-[11px] text-gray-400">入金予定日・支払方法を確認</p>
                                  </div>
                                  <div className="rounded-md border border-[#2a3553] bg-[#1a2035] p-3">
                                    <p className="text-[11px] text-gray-500">STEP 2</p>
                                    <p className="mt-1 text-sm text-white">再請求メモ作成</p>
                                    <p className="mt-1 text-[11px] text-gray-400">連絡結果と次回フォロー日を残す</p>
                                  </div>
                                  <div className="rounded-md border border-[#2a3553] bg-[#1a2035] p-3">
                                    <p className="text-[11px] text-gray-500">STEP 3</p>
                                    <p className="mt-1 text-sm text-white">状態更新</p>
                                    <p className="mt-1 text-[11px] text-gray-400">未回収→期限超過 or 対応完了</p>
                                  </div>
                                </>
                              )}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {isOverdue ? (
                                <>
                                  <Button size="sm" variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">再督促する</Button>
                                  <Button size="sm" variant="outline" className="border-[#2a3553] bg-[#1a2035] text-gray-200 hover:bg-[#212b45]">管理者確認へ</Button>
                                  <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-600/90">対応完了にする</Button>
                                </>
                              ) : (
                                <>
                                  <Button size="sm" variant="outline" className="border-[#2a3553] bg-[#1a2035] text-gray-200 hover:bg-[#212b45]">患者へ連絡</Button>
                                  <Button size="sm" variant="outline" className="border-[#2a3553] bg-[#1a2035] text-gray-200 hover:bg-[#212b45]">再請求メモ作成</Button>
                                  <Button size="sm" className="bg-amber-600 text-white hover:bg-amber-600/90">期限超過へ</Button>
                                  <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-600/90">入金確認</Button>
                                </>
                              )}
                            </div>
                            <p className="mt-3 text-[11px] text-slate-500">未回収・期限超過の日付セルを押すと、その状態に応じた処理導線が下に表示されます。</p>
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  </>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 hover:bg-slate-50">
                  <TableHead className="text-slate-500">患者名</TableHead>
                  <TableHead className="text-slate-500">訪問回 / task</TableHead>
                  <TableHead className="text-slate-500">対応者 / 時刻</TableHead>
                  <TableHead className="text-slate-500">算定・請求対象</TableHead>
                  <TableHead className="text-right text-slate-500">請求額</TableHead>
                  <TableHead className="text-slate-500">状態</TableHead>
                  <TableHead className="text-right text-slate-500">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mergedCollectionRecords.map((record) => (
                  <TableRow key={record.id} className="border-slate-200 hover:bg-slate-50">
                    <TableCell className="font-medium text-slate-900">{record.patientName}</TableCell>
                    <TableCell className="text-xs text-slate-700">
                      <div className="flex items-center gap-1">
                        <Link2 className="h-3.5 w-3.5 text-indigo-500" />
                        {record.linkedTaskId}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">訪問回: {record.linkedTaskId?.slice(-2)}</p>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">
                      <p>{record.handledBy ?? '未対応'}</p>
                      <p className="text-slate-500">{record.handledAt ?? '—'}</p>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline" className={cn('border text-xs', record.billable ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' : 'border-gray-500/40 bg-gray-500/20 text-gray-300')}>
                          {record.billable ? '請求対象' : '未計上'}
                        </Badge>
                        <p className="text-[11px] text-slate-500">在宅訪問 管理料/薬剤料ベースのモック算定</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-slate-700">
                      <Input type="number" value={record.amount} onChange={(e) => setCollectionRecords((prev) => prev.map((r) => r.id === record.id ? { ...r, amount: Number(e.target.value) || 0 } : r))} className="h-8 w-28 border-slate-200 bg-white text-right text-slate-900" disabled={!record.billable} />
                    </TableCell>
                    <TableCell><Badge variant="outline" className={cn('border text-xs', statusClass[record.status])}>{statusLabel[record.status]}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {record.billable && record.status !== 'paid' && <Button size="sm" variant="ghost" onClick={() => updateCollectionStatus(record.id, 'paid')} className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800">入金確認</Button>}
                        {record.billable && record.status === 'unpaid' && <Button size="sm" variant="ghost" onClick={() => updateCollectionStatus(record.id, 'overdue')} className="text-amber-700 hover:bg-amber-50 hover:text-amber-800">期限超過へ</Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
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
          <CardContent className="p-4 text-sm text-gray-300">
            <p className="font-medium text-white">system_admin 向け表示</p>
            <p className="mt-1 text-xs text-gray-400">ここでは加盟店への請求状態だけを扱い、患者ごとの回収処理や訪問単位の操作は表示しません。</p>
          </CardContent>
        </Card>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <AdminStatCard label="請求総額" value={yen.format(summary.totalBilled)} icon={<FileText className="h-4 w-4" />} />
        <AdminStatCard label="回収済み" value={yen.format(summary.collected)} tone="success" icon={<CheckCircle className="h-4 w-4" />} />
        <AdminStatCard label="未回収" value={yen.format(summary.outstanding)} tone="warning" icon={<Layers className="h-4 w-4" />} />
      </section>

      {generatedLabel && <Card className="border-[#2a3553] bg-[#11182c]"><CardContent className="p-3 text-sm text-indigo-300">{generatedLabel}</CardContent></Card>}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-4 py-3 text-sm font-medium text-emerald-300 shadow-lg backdrop-blur-sm">
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
                  <Badge variant="outline" className={cn('border text-xs', statusClass[record.status])}>{statusLabel[record.status]}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div><p>請求書番号</p><p className="mt-1 text-slate-900">{record.invoiceNumber}</p></div>
                  <div><p>合計</p><p className="mt-1 text-slate-900">{yen.format(record.total)}</p></div>
                  <div><p>SaaS</p><p className="mt-1 text-slate-900">{yen.format(record.saasFee)}</p></div>
                  <div><p>夜間連携</p><p className="mt-1 text-slate-900">{yen.format(record.nightFee)}</p></div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setSelectedRecord(record)} className="text-indigo-300 hover:bg-indigo-500/10 hover:text-indigo-200">
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
              <TableRow className="border-[#2a3553] hover:bg-[#1a2035]">
                <TableHead className="text-gray-400">加盟店</TableHead>
                <TableHead className="text-gray-400">請求書番号</TableHead>
                <TableHead className="text-gray-400">対象月</TableHead>
                <TableHead className="text-right text-gray-400">SaaS</TableHead>
                <TableHead className="text-right text-gray-400">夜間連携</TableHead>
                <TableHead className="text-right text-gray-400">合計</TableHead>
                <TableHead className="text-gray-400">状態</TableHead>
                <TableHead className="text-right text-gray-400">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id} className="border-[#2a3553] hover:bg-[#11182c]">
                  <TableCell className="font-medium text-white">{record.pharmacyName}</TableCell>
                  <TableCell className="text-gray-300">{record.invoiceNumber}</TableCell>
                  <TableCell className="text-gray-300">{record.month}</TableCell>
                  <TableCell className="text-right text-gray-300">{yen.format(record.saasFee)}</TableCell>
                  <TableCell className="text-right text-gray-300">{yen.format(record.nightFee)}</TableCell>
                  <TableCell className="text-right font-medium text-white">{yen.format(record.total)}</TableCell>
                  <TableCell><Badge variant="outline" className={cn('border text-xs', statusClass[record.status])}>{statusLabel[record.status]}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedRecord(record)} className="text-indigo-300 hover:bg-indigo-500/10 hover:text-indigo-200">詳細</Button>
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

      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className={`${adminDialogClass} sm:max-w-lg`}>
          <DialogHeader>
            <DialogTitle className="text-slate-900">請求詳細</DialogTitle>
            <DialogDescription className="text-slate-600">{selectedRecord?.pharmacyName} / {selectedRecord?.month}</DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-3 text-sm text-slate-700">
              <div className={`${adminPanelClass} p-4`}>
                <p>請求書番号: <span className="text-slate-900">{selectedRecord.invoiceNumber}</span></p>
                <p className="mt-1">SaaS: <span className="text-slate-900">{yen.format(selectedRecord.saasFee)}</span></p>
                <p className="mt-1">夜間連携: <span className="text-slate-900">{yen.format(selectedRecord.nightFee)}</span></p>
                <p className="mt-1">消費税: <span className="text-slate-900">{yen.format(selectedRecord.tax)}</span></p>
                <p className="mt-1">合計: <span className="text-slate-900">{yen.format(selectedRecord.total)}</span></p>
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
