'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'

import { useAuth } from '@/contexts/auth-context'
import type { RequestPriority, RequestStatus } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { adminCardClass, adminPageClass, adminTableClass } from '@/components/admin-ui'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingState } from '@/components/common/LoadingState'
import { Clock3, Plus } from 'lucide-react'
import {
  statusMeta,
  priorityMeta,
} from '@/lib/mock-data'
import { getRequestDisplayStatus } from '@/lib/status-meta'

type TabKey = 'received' | 'active' | 'completed' | 'all'

type RequestRow = {
  id: string
  patientId: string | null
  pharmacyId: string
  receivedAt: string
  receivedDate: string
  patientName: string | null
  pharmacyName: string
  status: RequestStatus
  priority: RequestPriority
  assignee: string
  assigneeId: string | null
  symptom: string
  vitalsChange: string
  consciousness: string
  urgency: string
  notes: string
  faxImageUrl?: string | null
  patientLinkedAt?: string | null
  patientLinkedBy?: string | null
  timelineEvents: { status: string; timestamp: string; userName: string; note?: string }[]
}

type NightFlowCase = {
  id: string
  patientId: string | null
  sourcePharmacyId: string | null
  acceptedChannel: 'phone' | 'fax'
  acceptedAt: string
  status: 'accepted' | 'in_progress' | 'completed' | 'pharmacy_confirmed' | 'cancelled'
  startedAt: string | null
  completedAt: string | null
  summary: string | null
  handoffNote: string | null
  morningRequest: string | null
  attentionLevel: '通常' | '要確認' | string | null
  patient: { id: string; fullName: string } | null
  pharmacy: { id: string; name: string } | null
  handledBy: { id: string; displayName: string } | null
  fax: { attachmentUrl: string | null; linkedAt: string | null; linkedByUserId: string | null } | null
}

type NightFlowResponse = {
  visibleDashboardCases?: NightFlowCase[]
  cases?: NightFlowCase[]
}

type CorrectionRequestRow = {
  id: string
  target_type: string
  target_id: string
  patient_id: string | null
  patient_day_task_id: string | null
  reason_category: string | null
  reason_text: string | null
  status: 'pending' | 'approved' | 'rejected' | 'completed' | string
  created_at: string
}

function getNightNextAction(request: RequestRow) {
  if (request.status === 'fax_pending') {
    return { label: 'FAX受信待ち', href: '/dashboard/night-flow', tone: 'muted' as const }
  }
  if (!request.patientId || ['fax_received', 'assigning', 'assigned', 'checklist'].includes(request.status)) {
    return { label: '患者確認へ進む', href: `/dashboard/night-patients?requestId=${request.id}&source=${request.faxImageUrl ? 'fax' : 'phone'}`, tone: 'primary' as const }
  }
  if (['dispatched', 'arrived', 'in_progress'].includes(request.status)) {
    return { label: '対応中を確認', href: '/dashboard/night-flow', tone: 'secondary' as const }
  }
  return { label: '夜間対応を開く', href: '/dashboard/night-flow', tone: 'secondary' as const }
}

function formatDateParts(value: string | null | undefined) {
  if (!value) return { date: '-', time: '-' }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { date: '-', time: '-' }
  return {
    date: date.toISOString().slice(0, 10),
    time: date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' }),
  }
}

function mapNightCaseStatus(status: NightFlowCase['status'], acceptedChannel: NightFlowCase['acceptedChannel']): RequestStatus {
  switch (status) {
    case 'accepted':
      return acceptedChannel === 'fax' ? 'fax_received' : 'received'
    case 'in_progress':
      return 'in_progress'
    case 'completed':
    case 'pharmacy_confirmed':
      return 'completed'
    case 'cancelled':
      return 'cancelled'
    default:
      return 'received'
  }
}

function mapNightCaseToRequestRow(requestCase: NightFlowCase): RequestRow {
  const accepted = formatDateParts(requestCase.acceptedAt)
  const status = mapNightCaseStatus(requestCase.status, requestCase.acceptedChannel)
  const timelineEvents: RequestRow['timelineEvents'] = [
    { status: 'received', timestamp: requestCase.acceptedAt, userName: requestCase.handledBy?.displayName ?? '夜間担当', note: '夜間依頼受付' },
  ]
  if (requestCase.startedAt) timelineEvents.push({ status: 'in_progress', timestamp: requestCase.startedAt, userName: requestCase.handledBy?.displayName ?? '夜間担当', note: '対応開始' })
  if (requestCase.completedAt) timelineEvents.push({ status: 'completed', timestamp: requestCase.completedAt, userName: requestCase.handledBy?.displayName ?? '夜間担当', note: requestCase.handoffNote ?? '対応完了' })

  return {
    id: requestCase.id,
    patientId: requestCase.patientId,
    pharmacyId: requestCase.sourcePharmacyId ?? '',
    receivedAt: accepted.time,
    receivedDate: accepted.date,
    patientName: requestCase.patient?.fullName ?? null,
    pharmacyName: requestCase.pharmacy?.name ?? '未設定薬局',
    status,
    priority: requestCase.attentionLevel === '要確認' ? 'high' : 'normal',
    assignee: requestCase.handledBy?.displayName ?? '未割当',
    assigneeId: requestCase.handledBy?.id ?? null,
    symptom: requestCase.summary || requestCase.handoffNote || '夜間対応依頼',
    vitalsChange: '-',
    consciousness: '-',
    urgency: requestCase.attentionLevel === '要確認' ? '高' : '中',
    notes: requestCase.morningRequest || requestCase.handoffNote || '',
    faxImageUrl: requestCase.fax?.attachmentUrl ?? null,
    patientLinkedAt: requestCase.patientId ? requestCase.acceptedAt : null,
    patientLinkedBy: requestCase.patientId ? requestCase.handledBy?.displayName ?? null : null,
    timelineEvents,
  }
}

function getCorrectionRequestHref(request: CorrectionRequestRow) {
  if (request.target_type === 'patient' && request.patient_id) return `/dashboard/patients/${request.patient_id}?correctionRequestId=${request.id}`
  if (request.target_type === 'billing_collection') return `/dashboard/billing?correctionRequestId=${request.id}&recordId=${request.target_id}`
  if (request.patient_day_task_id) return `/dashboard/billing?correctionRequestId=${request.id}&taskId=${request.patient_day_task_id}`
  return '/dashboard/requests'
}

function getCorrectionTargetLabel(targetType: string) {
  switch (targetType) {
    case 'patient':
      return '患者情報'
    case 'patient_day_task':
      return '訪問タスク'
    case 'billing_collection':
      return '回収・入金'
    case 'medical_institution':
      return '医療機関'
    case 'doctor_master':
      return '医師マスタ'
    default:
      return '修正対象'
  }
}


export default function RequestsPage() {
  const { role } = useAuth()
  const isAdmin = role === 'regional_admin'
  const isPharmacyAdmin = role === 'pharmacy_admin'
  const canViewCorrectionRequests = role === 'pharmacy_admin' || role === 'pharmacy_staff'
  const isNightPharmacist = role === 'night_pharmacist'
  const [activeTab, setActiveTab] = useState<TabKey>('received')
  const [newRequestOpen, setNewRequestOpen] = useState(false)
  const [correctionRequests, setCorrectionRequests] = useState<CorrectionRequestRow[]>([])
  const [nightRequests, setNightRequests] = useState<RequestRow[]>([])
  const [isNightRequestsLoading, setIsNightRequestsLoading] = useState(false)
  const [formData, setFormData] = useState({
    pharmacy: '',
    patientName: '',
    symptom: '',
    vitalsChange: '',
    consciousness: '',
    urgency: '',
  })

  const canCreateRequest = role === 'regional_admin'

  useEffect(() => {
    if (isPharmacyAdmin) {
      setNightRequests([])
      return
    }

    let active = true
    setIsNightRequestsLoading(true)
    fetch('/api/night-flow', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => null) as NightFlowResponse | null
        if (!response.ok || !data) throw new Error('night_flow_fetch_failed')
        const cases = data.visibleDashboardCases ?? data.cases ?? []
        if (active) setNightRequests(cases.map(mapNightCaseToRequestRow))
      })
      .catch(() => {
        if (active) setNightRequests([])
      })
      .finally(() => {
        if (active) setIsNightRequestsLoading(false)
      })

    return () => {
      active = false
    }
  }, [isPharmacyAdmin])

  useEffect(() => {
    if (!canViewCorrectionRequests) {
      setCorrectionRequests([])
      return
    }

    let active = true
    fetch('/api/correction-requests', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => null)
        if (!response.ok || !data?.ok) throw new Error(data?.error ?? 'correction_requests_fetch_failed')
        if (active) setCorrectionRequests(data.correctionRequests ?? [])
      })
      .catch(() => {
        if (active) setCorrectionRequests([])
      })

    return () => {
      active = false
    }
  }, [canViewCorrectionRequests])

  const pendingCorrectionRequests = useMemo(
    () => correctionRequests.filter((request) => request.status === 'pending'),
    [correctionRequests],
  )

  const visibleRequests = useMemo(() => {
    if (isPharmacyAdmin) return []
    return nightRequests
  }, [isPharmacyAdmin, nightRequests])

  const tabItems = useMemo<Array<{ key: TabKey; label: string }>>(() => {
    const receivedCount = visibleRequests.filter((request) =>
      ['received', 'fax_pending', 'fax_received', 'assigning', 'assigned', 'checklist'].includes(request.status)
    ).length
    const activeCount = visibleRequests.filter((request) => ['dispatched', 'arrived', 'in_progress'].includes(request.status)).length
    const completedCount = visibleRequests.filter((request) => request.status === 'completed').length

    return [
      { key: 'received', label: `受付対応中(${receivedCount})` },
      { key: 'active', label: `対応中(${activeCount})` },
      { key: 'completed', label: `完了(${completedCount})` },
      { key: 'all', label: `全件(${visibleRequests.length})` },
    ]
  }, [visibleRequests])

  const filteredRequests = useMemo(() => {
    switch (activeTab) {
      case 'received':
        return visibleRequests.filter((request) =>
          ['received', 'fax_pending', 'fax_received', 'assigning', 'assigned', 'checklist'].includes(
            request.status
          )
        )
      case 'active':
        return visibleRequests.filter((request) => ['dispatched', 'arrived', 'in_progress'].includes(request.status))
      case 'completed':
        return visibleRequests.filter((request) => request.status === 'completed')
      default:
        return visibleRequests
    }
  }, [activeTab, visibleRequests])

  const handleSubmitNewRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNewRequestOpen(false)
  }

  return (
    <div className={`${adminPageClass} space-y-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">依頼管理</h1>
          <p className="text-xs text-slate-500">{isPharmacyAdmin ? '依頼管理は実装予定です。現在の対応準備中・対応中はダッシュボードとカレンダーで確認します。' : isNightPharmacist ? '当日分のみ表示します。依頼管理では受付概要だけを確認し、患者特定画面でFAX内容を見ながら患者を確定します。' : '夜間受電依頼の進行状況をリアルタイムで管理'}</p>
        </div>

        {canCreateRequest && (
          <Button
            onClick={() => setNewRequestOpen(true)}
            className="soft-pop-sm bg-indigo-500 text-white hover:bg-indigo-500/90"
          >
            <Plus className="h-4 w-4" />
            新規依頼
          </Button>
        )}
      </div>

      {canViewCorrectionRequests && (
        <Card className={cn(adminCardClass, pendingCorrectionRequests.length > 0 ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200 bg-white')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-3 text-base text-slate-900">
              <span>修正依頼</span>
              <Badge variant="outline" className={pendingCorrectionRequests.length > 0 ? 'border-amber-300 bg-white text-amber-700' : 'border-slate-200 bg-slate-50 text-slate-500'}>
                未対応 {pendingCorrectionRequests.length}件
              </Badge>
            </CardTitle>
            <p className="text-xs text-slate-500">スタッフの修正依頼はここから対象画面へ移動して確認します。</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingCorrectionRequests.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-500">未対応の修正依頼はありません。</p>
            ) : pendingCorrectionRequests.slice(0, 5).map((request) => (
              <Link
                key={request.id}
                href={getCorrectionRequestHref(request)}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white p-3 text-sm transition hover:border-amber-300 hover:bg-amber-50"
              >
                <div>
                  <p className="font-medium text-slate-900">{getCorrectionTargetLabel(request.target_type)}の修正依頼</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {request.reason_category ?? '理由未選択'}{request.reason_text ? ` / ${request.reason_text}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  {new Date(request.created_at).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {isPharmacyAdmin && (
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-slate-900">依頼管理は実装予定です</p>
            <p className="mt-1 text-xs text-slate-500">支給依頼の受付・進行管理はまだDB運用に接続していません。今日の対応準備中・対応中は、実データの当日タスクとして管理します。</p>
          </CardContent>
        </Card>
      )}



      {isNightPharmacist && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card className={adminCardClass}><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-cyan-600">{visibleRequests.filter((request) => request.status === 'received').length}</p><p className="text-[10px] text-slate-500">受電済み</p></CardContent></Card>
          <Card className={adminCardClass}><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-purple-600">{visibleRequests.filter((request) => request.status === 'fax_pending').length}</p><p className="text-[10px] text-slate-500">FAX受信待ち</p></CardContent></Card>
          <Card className={adminCardClass}><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-amber-600">{visibleRequests.filter((request) => request.status === 'fax_received' || (!request.patientId && ['assigning', 'assigned', 'checklist'].includes(request.status))).length}</p><p className="text-[10px] text-slate-500">患者特定待ち</p></CardContent></Card>
          <Card className={adminCardClass}><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-sky-600">{visibleRequests.filter((request) => ['dispatched', 'arrived', 'in_progress'].includes(request.status)).length}</p><p className="text-[10px] text-slate-500">対応中</p></CardContent></Card>
        </div>
      )}

      <Card className={adminCardClass}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-900">{isPharmacyAdmin ? '自局依頼ステータス' : '依頼ステータス'}</CardTitle>
          <p className="text-xs text-slate-500">{isPharmacyAdmin ? '対象範囲: 自局依頼のみ表示' : isNightPharmacist ? '対象範囲: 当日担当分のみ表示' : '対象範囲: リージョン配下の依頼を表示'}</p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)}>
            <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-lg border border-slate-200 bg-slate-100 p-1">
              {tabItems.map((tab) => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="press-squish focus-ring rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 data-[state=active]:border-indigo-500 data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Mobile card view */}
      <div className="lg:hidden space-y-3">
        {isNightRequestsLoading ? (
          <Card className={adminCardClass}>
            <CardContent className="p-4">
              <LoadingState message="依頼一覧を読み込み中です。" />
            </CardContent>
          </Card>
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            title={isPharmacyAdmin ? '依頼管理は実装予定です' : '条件に合う依頼はまだありません'}
            description={isPharmacyAdmin ? '支給依頼の受付一覧はDB接続後に表示します。' : '新しい依頼が入るとここに表示されます。'}
            className={adminCardClass}
          />
        ) : filteredRequests.map((request) => {
          const status = isAdmin
            ? getRequestDisplayStatus(request.status, 'admin', request.patientId)
            : isPharmacyAdmin
              ? getRequestDisplayStatus(request.status, 'pharmacy', request.patientId)
              : isNightPharmacist
                ? getRequestDisplayStatus(request.status, 'night_pharmacist', request.patientId)
                : statusMeta[request.status]
          const priority = priorityMeta[request.priority]
          const patientLabel = isAdmin
            ? request.patientId
              ? '患者特定済'
              : '患者未特定'
            : isPharmacyAdmin
              ? request.id
              : request.patientName ?? '患者未特定'

          return (
            <Link key={request.id} href={isPharmacyAdmin ? '#' : getNightNextAction(request).href} onClick={(event) => { if (isPharmacyAdmin) event.preventDefault() }}>
              <Card
                className={cn(
                  `${adminCardClass} soft-pop cursor-pointer border-l-4 hover:border-indigo-400 hover:shadow-md`,
                  priority.mobileBorder
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{patientLabel}</p>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{request.pharmacyName}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={cn('border text-xs', status.className)}>
                        {status.label}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                      {request.receivedAt}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className={cn('h-2 w-2 rounded-full', priority.dot)} />
                      優先度 {priority.label}
                    </span>
                  </div>
                  {isNightPharmacist && (
                    <div className="mt-2 space-y-2 text-[11px] text-slate-500">
                      <div>
                        <p className="truncate">{request.symptom}</p>
                        <p className="mt-1">{request.status === 'fax_pending' ? 'FAX受信待ち' : 'FAX内容は患者特定画面で確認'}</p>
                      </div>
                      {(() => {
                        const nextAction = getNightNextAction(request)
                        return (
                          <Link href={nextAction.href} onClick={(event) => event.stopPropagation()}>
                            <Button
                              size="sm"
                              className={cn(
                                'h-8 w-full',
                                nextAction.tone === 'primary'
                                  ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                                  : nextAction.tone === 'secondary'
                                    ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              )}
                            >
                              {nextAction.label}
                            </Button>
                          </Link>
                        )
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Desktop table view */}
      <Card className={`hidden lg:block ${adminTableClass}`}>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 hover:bg-slate-50">
              <TableHead className="text-slate-500">優先度</TableHead>
              <TableHead className="text-slate-500">受付時刻</TableHead>
              <TableHead className="text-slate-500">{isAdmin ? '患者特定' : isPharmacyAdmin ? '依頼番号' : '患者名'}</TableHead>
              <TableHead className="text-slate-500">薬局名</TableHead>
              <TableHead className="text-slate-500">ステータス</TableHead>
              <TableHead className="text-slate-500">受付概要</TableHead>
              <TableHead className="text-slate-500">{isPharmacyAdmin ? '最終状況' : '確認事項'}</TableHead>
              {isNightPharmacist && <TableHead className="text-slate-500">次の操作</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isNightRequestsLoading ? (
              <TableRow className="border-slate-200 hover:bg-slate-50">
                <TableCell colSpan={isNightPharmacist ? 8 : 7} className="py-6">
                  <LoadingState message="依頼一覧を読み込み中です。" className="justify-center" />
                </TableCell>
              </TableRow>
            ) : filteredRequests.length === 0 ? (
              <TableRow className="border-slate-200 hover:bg-slate-50">
                <TableCell colSpan={isNightPharmacist ? 8 : 7} className="py-6">
                  <EmptyState
                    title={isPharmacyAdmin ? '依頼管理は実装予定です' : '条件に合う依頼はまだありません'}
                    description={isPharmacyAdmin ? '支給依頼の受付一覧はDB接続後に表示します。' : '新しい依頼が入るとここに表示されます。'}
                    className="border-0 bg-transparent px-0 py-2 shadow-none"
                  />
                </TableCell>
              </TableRow>
            ) : filteredRequests.map((request) => {
              const status = isAdmin
                ? getRequestDisplayStatus(request.status, 'admin', request.patientId)
                : isPharmacyAdmin
                  ? getRequestDisplayStatus(request.status, 'pharmacy', request.patientId)
                  : isNightPharmacist
                    ? getRequestDisplayStatus(request.status, 'night_pharmacist', request.patientId)
                    : statusMeta[request.status]
              const priority = priorityMeta[request.priority]
                  const patientLabel = isAdmin
                ? request.patientId
                  ? '患者特定済'
                  : '患者未特定'
                : isPharmacyAdmin
                  ? request.id
                  : request.patientName ?? '患者未特定'

              return (
                <TableRow
                  key={request.id}
                  onClick={() => { if (!isPharmacyAdmin) window.location.href = getNightNextAction(request).href }}
                  className={cn('border-slate-200 transition hover:bg-slate-50', !isPharmacyAdmin && 'cursor-pointer')}
                >
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <span className={cn('h-2.5 w-2.5 rounded-full', priority.dot)} />
                      <span className="text-xs text-slate-600">{priority.label}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-700">{request.receivedAt}</TableCell>
                  <TableCell>
                    {isPharmacyAdmin ? (
                      <span className="inline-flex items-center gap-2 text-slate-700">{patientLabel}</span>
                    ) : (
                      <Link href={getNightNextAction(request).href} className="text-slate-700 hover:text-indigo-600">
                        <span className="inline-flex items-center gap-2">
                          {patientLabel}
                        </span>
                      </Link>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-600">{request.pharmacyName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('border text-xs', status.className)}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[260px] text-xs text-slate-600">
                    <div className="space-y-1">
                      <p className="truncate">{request.symptom}</p>
                      <div className="flex gap-2 text-[10px]">
                        <span className={request.status === 'fax_pending' ? 'text-purple-600' : 'text-slate-500'}>FAX{request.status === 'fax_pending' ? '待ち' : 'あり'}</span>
                        <span className={request.patientId ? 'text-indigo-600' : 'text-amber-600'}>{request.patientId ? '患者特定済み' : '患者特定待ち'}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">{isPharmacyAdmin ? request.timelineEvents[request.timelineEvents.length - 1]?.note ?? '更新待ち' : '詳細は患者特定画面で確認'}</TableCell>
                  {isNightPharmacist && (
                    <TableCell>
                      {(() => {
                        const nextAction = getNightNextAction(request)
                        return (
                          <Link href={nextAction.href} onClick={(event) => event.stopPropagation()}>
                            <Button
                              size="sm"
                              className={cn(
                                'h-8',
                                nextAction.tone === 'primary'
                                  ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                                  : nextAction.tone === 'secondary'
                                    ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              )}
                            >
                              {nextAction.label}
                            </Button>
                          </Link>
                        )
                      })()}
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={newRequestOpen} onOpenChange={setNewRequestOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-slate-200 bg-white text-slate-900 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900">新規依頼登録</DialogTitle>
            <DialogDescription className="text-slate-500">
              夜間受電内容を入力して依頼を起票します。
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmitNewRequest}>
            <div className="space-y-2">
              <Label className="text-slate-600">薬局選択</Label>
              <Select value={formData.pharmacy} onValueChange={(value) => setFormData((prev) => ({ ...prev, pharmacy: value }))}>
                <SelectTrigger className="border-slate-200 bg-white text-slate-900">
                  <SelectValue placeholder="薬局を選択" />
                </SelectTrigger>
                <SelectContent className="border-slate-200 bg-white text-slate-900">
                  <SelectItem value="城南みらい薬局">城南みらい薬局</SelectItem>
                  <SelectItem value="神田中央薬局">神田中央薬局</SelectItem>
                  <SelectItem value="西新宿いろは薬局">西新宿いろは薬局</SelectItem>
                  <SelectItem value="世田谷つばさ薬局">世田谷つばさ薬局</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-600">患者名</Label>
              <Input
                value={formData.patientName}
                onChange={(event) => setFormData((prev) => ({ ...prev, patientName: event.target.value }))}
                className="border-slate-200 bg-white text-slate-900"
                placeholder="例: 田中 優子"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-600">症状</Label>
              <Textarea
                value={formData.symptom}
                onChange={(event) => setFormData((prev) => ({ ...prev, symptom: event.target.value }))}
                className="border-slate-200 bg-white text-slate-900"
                placeholder="主訴を入力"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-600">バイタル変化</Label>
              <Textarea
                value={formData.vitalsChange}
                onChange={(event) => setFormData((prev) => ({ ...prev, vitalsChange: event.target.value }))}
                className="border-slate-200 bg-white text-slate-900"
                placeholder="血圧、体温、SpO2など"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-600">意識レベル</Label>
                <Select
                  value={formData.consciousness}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, consciousness: value }))}
                >
                  <SelectTrigger className="border-slate-200 bg-white text-slate-900">
                    <SelectValue placeholder="選択" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 bg-white text-slate-900">
                    <SelectItem value="清明">清明</SelectItem>
                    <SelectItem value="やや傾眠">やや傾眠</SelectItem>
                    <SelectItem value="混濁">混濁</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600">緊急度</Label>
                <Select value={formData.urgency} onValueChange={(value) => setFormData((prev) => ({ ...prev, urgency: value }))}>
                  <SelectTrigger className="border-slate-200 bg-white text-slate-900">
                    <SelectValue placeholder="選択" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 bg-white text-slate-900">
                    <SelectItem value="高">高</SelectItem>
                    <SelectItem value="中">中</SelectItem>
                    <SelectItem value="低">低</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                onClick={() => setNewRequestOpen(false)}
              >
                キャンセル
              </Button>
              <Button type="submit" className="bg-indigo-500 text-white hover:bg-indigo-500/90">
                依頼を作成
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
