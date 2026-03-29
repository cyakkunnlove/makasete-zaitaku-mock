'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import {
  Search,
  AlertTriangle,
  Activity,
  Users,
  Moon,
  Building2,
  ClipboardList,
  ArrowUpRight,
  ArrowDownRight,
  Timer,
  Stethoscope,
  FileImage,
  Shield,
  RotateCcw,
  Receipt,
  GripVertical,
} from 'lucide-react'
import { dayTaskData, getAttentionFlags, getAttentionFlagClass, handoverData, kpiData, nightStaff, requestData, type DayTaskItem } from '@/lib/mock-data'
import { MOCK_FLOW_DATE, mergeDayFlowTasks } from '@/lib/day-flow'
import { countVisitRuleTouches, formatVisitRuleSummary, getPatientsByPharmacyFromMaster, loadRegisteredPatients, type RegisteredPatientRecord } from '@/lib/patient-master'

const mockPharmacyRequests = [
  { id: 'REQ-0308-001', patientName: '田中 優子', status: '対応完了', time: '22:30', pharmacist: '佐藤 健一' },
  { id: 'REQ-0308-002', patientName: '清水 恒一', status: '対応中', time: '23:00', pharmacist: '佐藤 健一' },
  { id: 'REQ-0308-003', patientName: '小川 正子', status: 'FAX送信済', time: '23:10', pharmacist: '未アサイン' },
]

const staffStatusClass: Record<string, string> = {
  待機中: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  対応中: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  移動中: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
}

const kpiIcons = [ClipboardList, Activity, Building2, Timer]
const UNDO_WINDOW_MS = 8000
const DAY_TASK_STORAGE_KEY = `makasete-day-flow:PH-01:${MOCK_FLOW_DATE}`
const DAY_TASK_SHARED_STORAGE_KEY = `makasete-day-flow:shared:PH-01:${MOCK_FLOW_DATE}`

function formatMockTimestamp(time: string) {
  return `2026-03-15 ${time}`
}

function taskStatusMeta(status: DayTaskItem['status']) {
  switch (status) {
    case 'completed':
      return { label: '対応完了', className: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' }
    case 'in_progress':
      return { label: '対応中', className: 'border-amber-500/40 bg-amber-500/20 text-amber-300' }
    default:
      return { label: '未着手', className: 'border-sky-500/40 bg-sky-500/20 text-sky-300' }
  }
}

function collectionStatusMeta(status: DayTaskItem['collectionStatus']) {
  switch (status) {
    case '入金済':
      return { className: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' }
    case '回収中':
      return { className: 'border-amber-500/40 bg-amber-500/20 text-amber-300' }
    case '請求準備OK':
      return { className: 'border-indigo-500/40 bg-indigo-500/20 text-indigo-300' }
    default:
      return { className: 'border-gray-500/40 bg-gray-500/20 text-gray-300' }
  }
}

function RegionalAdminDashboard() {
  const slaRate = 94.2
  const delayedRequests = requestData.filter((request) => ['fax_received', 'assigning', 'assigned'].includes(request.status)).length
  const unassignedRequests = requestData.filter((request) => !request.assigneeId && request.status !== 'completed' && request.status !== 'cancelled').length
  const urgentActiveRequests = requestData.filter((request) => request.priority === 'high' && ['dispatched', 'arrived', 'in_progress'].includes(request.status)).length
  const unconfirmedHandovers = handoverData.filter((handover) => !handover.confirmed).length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpiData.map((kpi, index) => {
          const Icon = kpiIcons[index]
          const TrendIcon = kpi.trendUp ? ArrowUpRight : ArrowDownRight
          return (
            <Card key={kpi.label} className="border-[#2a3553] bg-[#1a2035]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Icon className="h-4 w-4 text-indigo-400" />
                  <span className={cn('inline-flex items-center gap-1 text-xs font-medium', kpi.trendUp ? 'text-emerald-400' : 'text-rose-400')}>
                    <TrendIcon className="h-3 w-3" />
                    {kpi.trend}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-2xl font-bold text-white">{kpi.value}</p>
                <p className="text-[10px] text-gray-500">{kpi.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-white">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            今すぐ確認したい案件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
              <p className="text-[10px] text-rose-200/80">高優先・対応中</p>
              <p className="mt-1 text-2xl font-bold text-rose-300">{urgentActiveRequests}</p>
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="text-[10px] text-amber-200/80">停滞気味案件</p>
              <p className="mt-1 text-2xl font-bold text-amber-300">{delayedRequests}</p>
            </div>
            <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3">
              <p className="text-[10px] text-indigo-200/80">未割当</p>
              <p className="mt-1 text-2xl font-bold text-indigo-300">{unassignedRequests}</p>
            </div>
            <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3">
              <p className="text-[10px] text-cyan-200/80">未確認申し送り</p>
              <p className="mt-1 text-2xl font-bold text-cyan-300">{unconfirmedHandovers}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-white">
            <Timer className="h-4 w-4 text-indigo-400" />
            SLA達成率（今夜）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-amber-400">{slaRate}%</span>
            <span className="pb-1 text-sm text-gray-500">目標: 95%</span>
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-[#111827]">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400" style={{ width: `${slaRate}%` }} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-white">
            <Stethoscope className="h-4 w-4 text-indigo-400" />
            夜勤スタッフ稼働状況
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {nightStaff.map((staff) => (
            <div key={staff.name} className="flex items-center justify-between rounded-lg border border-[#2a3553] bg-[#0a0e1a] p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-semibold text-indigo-300">
                  {staff.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{staff.name}</p>
                  <p className="text-xs text-gray-500">{staff.assignment}</p>
                </div>
              </div>
              <Badge variant="outline" className={cn('border text-xs', staffStatusClass[staff.status])}>
                {staff.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function SystemAdminDashboard() {
  return (
    <div className="space-y-4">
      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="h-4 w-4 text-indigo-400" />
            システム監視
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-300">
          <div className="flex items-center justify-between rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
            <span>通知ジョブ</span><Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/20 text-emerald-300">正常</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
            <span>夜間監視Cron</span><Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/20 text-emerald-300">正常</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
            <span>地域テナント数</span><span className="font-semibold text-white">3</span>
          </div>
          <p className="text-xs text-gray-500">system_admin は患者情報や依頼本文を見ず、システム稼働と権限設定だけを確認します。</p>
        </CardContent>
      </Card>
    </div>
  )
}

function PharmacyDashboardHeaderCard({
  flowDescription,
  billableReadyCount,
  primarySummaryBadge,
  hasOrderDraft,
  handleSaveOrder,
  handleResetOrderDraft,
  orderDraftBadgeText,
  orderSavedButtonText,
  resetOrderButtonText,
  createPatientButtonText,
  undoTarget,
  handleUndo,
}: {
  flowDescription: string
  billableReadyCount: number
  primarySummaryBadge: string
  hasOrderDraft: boolean
  handleSaveOrder: () => void
  handleResetOrderDraft: () => void
  orderDraftBadgeText: string
  orderSavedButtonText: string
  resetOrderButtonText: string
  createPatientButtonText: string
  undoTarget: { taskId: string; previous: DayTaskItem; expiresAt: number; actionLabel: string } | null
  handleUndo: () => void
}) {
  return (
    <Card className="border-[#2a3553] bg-[#1a2035]">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm font-semibold text-white">日中対応フロー（モック）</p>
          <p className="text-xs text-gray-400">{flowDescription}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-indigo-500/40 bg-indigo-500/20 text-indigo-300">請求連携候補 {billableReadyCount}件</Badge>
          <Badge variant="outline" className="border-cyan-500/40 bg-cyan-500/20 text-cyan-300">{primarySummaryBadge}</Badge>
          {hasOrderDraft ? (
            <>
              <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-200">{orderDraftBadgeText}</Badge>
              <Button size="sm" onClick={handleSaveOrder} className="bg-emerald-600 text-white hover:bg-emerald-500">順番を保存</Button>
              <Button size="sm" variant="outline" onClick={handleResetOrderDraft} className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#1a2035]">{resetOrderButtonText}</Button>
            </>
          ) : (
            <Button size="sm" variant="outline" className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#1a2035]">{orderSavedButtonText}</Button>
          )}
          <Link href="/dashboard/patients/new">
            <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-500">{createPatientButtonText}</Button>
          </Link>
          {undoTarget && (
            <Button size="sm" variant="outline" onClick={handleUndo} className="border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20">
              <RotateCcw className="h-3.5 w-3.5" />
              取り消す
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function PharmacyDashboardSummaryCard({
  summaryTitle,
  pharmacyStaffHandledCounts,
  summarySupportText,
  saveStateBadge,
  adminWarningText,
}: {
  summaryTitle: string
  pharmacyStaffHandledCounts: { name: string; count: number }[]
  summarySupportText: string
  saveStateBadge: string | null
  adminWarningText?: string | null
}) {
  return (
    <Card className="border-[#2a3553] bg-[#1a2035]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-white">{summaryTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {pharmacyStaffHandledCounts.map((item) => (
            <Badge key={item.name} variant="outline" className="border-cyan-500/40 bg-cyan-500/20 text-cyan-200">{item.name}: {item.count}件</Badge>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
          <span className="rounded-full border border-[#2a3553] bg-[#11182c] px-2 py-1">{summarySupportText}</span>
          {adminWarningText && (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-amber-200">{adminWarningText}</span>
          )}
          {saveStateBadge && (
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-200">{saveStateBadge}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function PharmacyDashboardNoticeCard({
  tone,
  message,
  subtext,
}: {
  tone: 'success' | 'warning'
  message: string
  subtext: string
}) {
  const cardClass = tone === 'success' ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10'
  const textClass = tone === 'success' ? 'text-emerald-100' : 'text-amber-100'
  const subtextClass = tone === 'success' ? 'text-emerald-200/80' : 'text-amber-200/80'

  return (
    <Card className={cardClass}>
      <CardContent className={`flex flex-wrap items-center justify-between gap-2 p-3 text-sm ${textClass}`}>
        <span>{message}</span>
        <span className={`text-xs ${subtextClass}`}>{subtext}</span>
      </CardContent>
    </Card>
  )
}

function PharmacyDashboardTabs({ children }: { children: React.ReactNode }) {
  return (
    <Tabs defaultValue="today" className="space-y-3">
      <TabsList className="grid w-full grid-cols-2 bg-[#11182c] text-gray-400">
        <TabsTrigger value="today" className="data-[state=active]:bg-[#1a2035] data-[state=active]:text-white">今日の患者フロー</TabsTrigger>
        <TabsTrigger value="master" className="data-[state=active]:bg-[#1a2035] data-[state=active]:text-white">患者マスタ</TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  )
}

function PharmacyTodaySectionHeading({ countLabel }: { countLabel?: string }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-200">
      <Building2 className="h-4 w-4 text-indigo-400" />
      今日の対応患者
      <span className="text-xs font-normal text-gray-500">{countLabel ?? '自動生成 + 手動追加'}</span>
    </h2>
  )
}

function PharmacyDayTaskCardHeader({
  visit,
  patientName,
  patientAddress,
  statusClassName,
  statusLabel,
}: {
  visit: DayTaskItem & { patient?: { name: string; address: string } | undefined }
  patientName: string
  patientAddress: string
  statusClassName: string
  statusLabel: string
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/dashboard/patients/${visit.patientId}`} className="text-sm font-semibold text-white hover:text-indigo-300">
            {patientName}
          </Link>
          <Badge variant="outline" className={cn('border text-[10px]', statusClassName)}>{statusLabel}</Badge>
          <Badge variant="outline" className={cn('border text-[10px]', visit.source === '手動追加' ? 'border-amber-500/40 bg-amber-500/20 text-amber-300' : 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300')}>
            {visit.source}
          </Badge>
          <Badge variant="outline" className="border-[#2a3553] text-[10px] text-gray-300">{visit.visitType}</Badge>
        </div>
        <p className="mt-1 text-xs text-gray-500">{patientAddress}</p>
        <p className="mt-1 text-[11px] text-gray-400">予定 {visit.scheduledTime} / {visit.note}</p>
      </div>
      <div className="text-right text-xs text-gray-400">
        <p>担当者: {visit.handledBy ?? '未対応'}</p>
        <p>着手: {visit.handledAt ?? '—'}</p>
        <p>完了: {visit.completedAt ?? '—'}</p>
      </div>
    </div>
  )
}

function PharmacyDayTaskCardMetrics({
  handledBy,
  handledAt,
  billable,
  collectionStatus,
  collectionClassName,
}: {
  handledBy: string | null
  handledAt: string | null
  billable: boolean
  collectionStatus: DayTaskItem['collectionStatus']
  collectionClassName: string
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-2.5">
        <p className="text-[10px] text-gray-500">handled-by</p>
        <p className="mt-1 text-sm text-white">{handledBy ?? '未設定'}</p>
      </div>
      <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-2.5">
        <p className="text-[10px] text-gray-500">handled-at</p>
        <p className="mt-1 text-sm text-white">{handledAt ?? '未設定'}</p>
      </div>
      <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-2.5">
        <p className="text-[10px] text-gray-500">billable / 回収連携</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn('border text-[10px]', billable ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' : 'border-gray-500/40 bg-gray-500/20 text-gray-300')}>
            {billable ? '請求対象' : '未計上'}
          </Badge>
          <Badge variant="outline" className={cn('border text-[10px]', collectionClassName)}>{collectionStatus}</Badge>
        </div>
      </div>
    </div>
  )
}

function PharmacyDayTaskCardActions({
  canStart,
  canComplete,
  canMoveUp,
  canMoveDown,
  onPlanToggle,
  onMoveUp,
  onMoveDown,
  onStart,
  onComplete,
  completionHelpText,
  planButtonLabel,
  reorderHintText,
}: {
  canStart: boolean
  canComplete: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onPlanToggle: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onStart: () => void
  onComplete: () => void
  completionHelpText: string
  planButtonLabel: string
  reorderHintText: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" onClick={onPlanToggle} className="border-sky-500/40 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20">
        {planButtonLabel}
      </Button>
      <span className="inline-flex cursor-grab items-center gap-1 rounded-md border border-[#2a3553] bg-[#11182c] px-2 py-1 text-xs text-gray-300 active:cursor-grabbing">
        <GripVertical className="h-3.5 w-3.5 text-gray-500" />
        {reorderHintText}
      </span>
      <Button size="sm" variant="outline" onClick={onMoveUp} disabled={!canMoveUp} className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#1a2035]">↑</Button>
      <Button size="sm" variant="outline" onClick={onMoveDown} disabled={!canMoveDown} className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#1a2035]">↓</Button>
      <Button size="sm" onClick={onStart} disabled={!canStart} className="bg-indigo-500 text-white hover:bg-indigo-500/90">
        対応する
      </Button>
      <Button size="sm" onClick={onComplete} disabled={!canComplete} className="bg-emerald-600 text-white hover:bg-emerald-600/90">
        対応完了
      </Button>
      <span className="text-[11px] text-gray-500">{completionHelpText}</span>
    </div>
  )
}

function PharmacyDayTaskCardMetaChips({
  planningStatus,
  plannedBy,
  updatedAt,
  plannedLabelPrefix,
  updatedLabelPrefix,
}: {
  planningStatus: DayTaskItem['planningStatus']
  plannedBy: string | null
  updatedAt: string | null
  plannedLabelPrefix: string
  updatedLabelPrefix: string
}) {
  if (!(planningStatus === 'planned' || updatedAt)) return null

  return (
    <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
      {planningStatus === 'planned' && <span className="rounded-full border border-sky-500/40 bg-sky-500/10 px-2 py-1 text-sky-200">{plannedLabelPrefix}{plannedBy}</span>}
      {updatedAt && <span className="rounded-full border border-[#2a3553] bg-[#11182c] px-2 py-1 text-gray-400">{updatedLabelPrefix}{updatedAt}</span>}
    </div>
  )
}

function PharmacyDayTaskCard({
  visit,
  patient,
  statusClassName,
  statusLabel,
  collectionClassName,
  draggingTaskId,
  dragOverTaskId,
  setDraggingTaskId,
  setDragOverTaskId,
  onDropReorder,
  canStart,
  canComplete,
  canMoveUp,
  canMoveDown,
  onPlanToggle,
  onMoveUp,
  onMoveDown,
  onStart,
  onComplete,
  completionHelpText,
  plannedLabelPrefix,
  updatedLabelPrefix,
  planButtonLabel,
  reorderHintText,
}: {
  visit: DayTaskItem & { patient?: { name: string; address: string } | undefined }
  patient: { name: string; address: string }
  statusClassName: string
  statusLabel: string
  collectionClassName: string
  draggingTaskId: string | null
  dragOverTaskId: string | null
  setDraggingTaskId: (id: string | null) => void
  setDragOverTaskId: (id: string | null) => void
  onDropReorder: () => void
  canStart: boolean
  canComplete: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onPlanToggle: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onStart: () => void
  onComplete: () => void
  completionHelpText: string
  plannedLabelPrefix: string
  updatedLabelPrefix: string
  planButtonLabel: string
  reorderHintText: string
}) {
  return (
    <Card
      draggable
      onDragStart={() => {
        setDraggingTaskId(visit.id)
        setDragOverTaskId(null)
      }}
      onDragEnd={() => {
        setDraggingTaskId(null)
        setDragOverTaskId(null)
      }}
      onDragOver={(event) => {
        event.preventDefault()
        if (draggingTaskId && draggingTaskId !== visit.id) setDragOverTaskId(visit.id)
      }}
      onDragLeave={() => {
        if (dragOverTaskId === visit.id) setDragOverTaskId(null)
      }}
      onDrop={() => {
        if (!draggingTaskId) return
        onDropReorder()
        setDraggingTaskId(null)
        setDragOverTaskId(null)
      }}
      className={cn(
        'border-[#2a3553] bg-[#1a2035] transition',
        draggingTaskId === visit.id && 'opacity-60 ring-1 ring-indigo-400/60',
        dragOverTaskId === visit.id && 'border-sky-400 ring-2 ring-sky-400/40'
      )}
    >
      <CardContent className="space-y-3 p-4">
        <PharmacyDayTaskCardHeader
          visit={visit}
          patientName={patient.name}
          patientAddress={patient.address}
          statusClassName={statusClassName}
          statusLabel={statusLabel}
        />
        <PharmacyDayTaskCardMetrics
          handledBy={visit.handledBy}
          handledAt={visit.handledAt}
          billable={visit.billable}
          collectionStatus={visit.collectionStatus}
          collectionClassName={collectionClassName}
        />
        <PharmacyDayTaskCardActions
          canStart={canStart}
          canComplete={canComplete}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onPlanToggle={onPlanToggle}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onStart={onStart}
          onComplete={onComplete}
          completionHelpText={completionHelpText}
          planButtonLabel={planButtonLabel}
          reorderHintText={reorderHintText}
        />
        <PharmacyDayTaskCardMetaChips
          planningStatus={visit.planningStatus}
          plannedBy={visit.plannedBy}
          updatedAt={visit.updatedAt}
          plannedLabelPrefix={plannedLabelPrefix}
          updatedLabelPrefix={updatedLabelPrefix}
        />
      </CardContent>
    </Card>
  )
}

function PharmacyDashboard({ isPharmacyStaff = false }: { isPharmacyStaff?: boolean }) {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [dayTasks, setDayTasks] = useState<DayTaskItem[]>(() => mergeDayFlowTasks({ baseTasks: dayTaskData, flowDate: MOCK_FLOW_DATE }))
  const [draftDayTasks, setDraftDayTasks] = useState<DayTaskItem[]>(() => mergeDayFlowTasks({ baseTasks: dayTaskData, flowDate: MOCK_FLOW_DATE }))
  const [undoTarget, setUndoTarget] = useState<{ taskId: string; previous: DayTaskItem; expiresAt: number; actionLabel: string } | null>(null)
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)
  const [saveToast, setSaveToast] = useState<string | null>(null)
  const isPharmacyAdmin = !isPharmacyStaff
  const [hasOrderDraft, setHasOrderDraft] = useState(false)
  const [lastOrderSavedAt, setLastOrderSavedAt] = useState<string | null>(null)
  const [lastOrderSavedBy, setLastOrderSavedBy] = useState<string | null>(null)
  const [registeredPatients, setRegisteredPatients] = useState<RegisteredPatientRecord[]>([])
  const ownPharmacyId = 'PH-01'
  const ownPatients = useMemo(() => getPatientsByPharmacyFromMaster(ownPharmacyId, registeredPatients), [ownPharmacyId, registeredPatients])

  useEffect(() => {
    setRegisteredPatients(loadRegisteredPatients())
  }, [])

  useEffect(() => {
    const syncPatients = () => setRegisteredPatients(loadRegisteredPatients())
    syncPatients()
    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === 'makasete-patient-master:v1') syncPatients()
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useEffect(() => {
    try {
      const sharedRaw = window.localStorage.getItem(DAY_TASK_SHARED_STORAGE_KEY)
      if (sharedRaw) {
        const parsed = JSON.parse(sharedRaw) as { tasks: DayTaskItem[]; savedAt?: string; savedBy?: string }
        if (Array.isArray(parsed.tasks)) {
          const merged = mergeDayFlowTasks({
            baseTasks: dayTaskData,
            flowDate: MOCK_FLOW_DATE,
            registeredPatients,
            persistedTasks: parsed.tasks,
          })
          setDayTasks(merged)
          setDraftDayTasks(merged)
          setLastOrderSavedAt(parsed.savedAt ?? null)
          setLastOrderSavedBy(parsed.savedBy ?? null)
          return
        }
      }

      const raw = window.localStorage.getItem(DAY_TASK_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as DayTaskItem[]
        if (Array.isArray(parsed)) {
          const merged = mergeDayFlowTasks({
            baseTasks: dayTaskData,
            flowDate: MOCK_FLOW_DATE,
            registeredPatients,
            persistedTasks: parsed,
          })
          setDayTasks(merged)
          setDraftDayTasks(merged)
          return
        }
      }

      const merged = mergeDayFlowTasks({ baseTasks: dayTaskData, flowDate: MOCK_FLOW_DATE, registeredPatients })
      setDayTasks(merged)
      setDraftDayTasks(merged)
    } catch {}
  }, [registeredPatients])

  useEffect(() => {
    try {
      window.localStorage.setItem(DAY_TASK_STORAGE_KEY, JSON.stringify(draftDayTasks))
    } catch {}
  }, [draftDayTasks])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'makasete-patient-master:v1') {
        setRegisteredPatients(loadRegisteredPatients())
      }
      if (event.key !== DAY_TASK_SHARED_STORAGE_KEY || !event.newValue) return
      try {
        const parsed = JSON.parse(event.newValue) as { tasks: DayTaskItem[]; savedAt?: string; savedBy?: string }
        if (Array.isArray(parsed.tasks) && parsed.tasks.length > 0) {
          setDayTasks(parsed.tasks)
          setDraftDayTasks(parsed.tasks)
          setHasOrderDraft(false)
          setLastOrderSavedAt(parsed.savedAt ?? null)
          setLastOrderSavedBy(parsed.savedBy ?? null)
        }
      } catch {}
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useEffect(() => {
    if (!undoTarget) return
    const timeout = window.setTimeout(() => setUndoTarget((current) => (current?.taskId === undoTarget.taskId ? null : current)), Math.max(undoTarget.expiresAt - Date.now(), 0))
    return () => window.clearTimeout(timeout)
  }, [undoTarget])

  useEffect(() => {
    if (!saveToast) return
    const timeout = window.setTimeout(() => setSaveToast(null), 2500)
    return () => window.clearTimeout(timeout)
  }, [saveToast])

  const mergedDayTasks = useMemo(() => {
    return mergeDayFlowTasks({
      baseTasks: dayTaskData,
      flowDate: MOCK_FLOW_DATE,
      registeredPatients,
      persistedTasks: draftDayTasks,
    })
  }, [draftDayTasks, registeredPatients])

  const enrichedVisits = useMemo(() => {
    return mergedDayTasks
      .filter((task) => ownPatients.some((p) => p.id === task.patientId))
      .map((task) => {
        const patient = ownPatients.find((p) => p.id === task.patientId)
        return { ...task, patient }
      })
  }, [mergedDayTasks, ownPatients])

  const filteredVisits = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return enrichedVisits
    return enrichedVisits.filter((visit) => {
      const haystacks = [visit.patient?.name ?? '', visit.patient?.address ?? '', visit.note]
      return haystacks.some((value) => value.toLowerCase().includes(query))
    })
  }, [searchQuery, enrichedVisits])

  const filteredMasterPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return ownPatients
    return ownPatients.filter((p) => p.name.toLowerCase().includes(query) || p.address.toLowerCase().includes(query))
  }, [searchQuery, ownPatients])

  const billableReadyCount = draftDayTasks.filter((task) => task.billable).length
  const flowDescription = isPharmacyStaff
    ? `今日対応する患者を確認して、対応完了まで記録します。完了した訪問は請求処理が必要な一覧に上がります。操作後 ${UNDO_WINDOW_MS / 1000} 秒だけ取り消せます。`
    : '自局の日中対応フローを確認します。Pharmacy Admin は完了後の予定変更も可能ですが、注意喚起を出して履歴確認前提で扱います。'
  const summaryTitle = isPharmacyStaff ? 'スタッフ別の本日対応件数（モック）' : '自局運用サマリー（モック）'
  const primarySummaryBadge = isPharmacyStaff
    ? `自分の対応 ${draftDayTasks.filter((task) => task.handledById === 'ST-07').length}件`
    : `全体更新 ${draftDayTasks.filter((task) => task.updatedById).length}件`
  const summarySupportText = '並び順はドラッグハンドル風UI + 保存ボタンで共有反映'
  const saveStateBadge = lastOrderSavedBy && lastOrderSavedAt
    ? `最終保存: ${lastOrderSavedBy} / ${lastOrderSavedAt}`
    : null
  const adminWarningText = isPharmacyAdmin ? '完了後の予定変更は警告付きで許可' : null
  const orderDraftBadgeText = '未保存の順番変更あり'
  const orderSavedButtonText = '他スタッフ反映済み'
  const resetOrderButtonText = '元に戻す'
  const createPatientButtonText = '患者登録'
  const completionHelpText = isPharmacyStaff
    ? '対応完了すると、あとで billing の「請求処理が必要な訪問一覧」に上がります。'
    : 'Admin でも順番確認と完了状況の追跡ができます。完了後の予定変更は警告付きです。'
  const plannedLabelPrefix = isPharmacyStaff ? '対応予定: ' : 'Admin確認予定: '
  const updatedLabelPrefix = isPharmacyStaff ? '更新: ' : '最終更新: '
  const reorderHintText = isPharmacyStaff ? 'ドラッグで並び替え' : 'Adminも並び替え可能'
  const orderedVisits = useMemo(() => {
    return [...filteredVisits].sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1
      if (a.status !== 'completed' && b.status === 'completed') return -1
      if (a.status === 'completed' && b.status === 'completed') {
        return (a.completedAt ?? '').localeCompare(b.completedAt ?? '')
      }
      return a.sortOrder - b.sortOrder
    })
  }, [filteredVisits])
  const pharmacyStaffHandledCounts = useMemo(() => {
    const counts = new Map<string, { name: string; count: number }>()
    draftDayTasks.forEach((task) => {
      if (!task.handledById || !task.handledBy) return
      const current = counts.get(task.handledById) ?? { name: task.handledBy, count: 0 }
      current.count += 1
      counts.set(task.handledById, current)
    })
    return Array.from(counts.values())
  }, [draftDayTasks])

  const commitTaskChange = (taskId: string, updater: (task: DayTaskItem) => DayTaskItem, actionLabel: string) => {
    const current = draftDayTasks.find((task) => task.id === taskId)
    if (!current) return
    const next = updater(current)
    setDraftDayTasks((prev) => prev.map((task) => (task.id === taskId ? next : task)))
    setDayTasks((prev) => prev.map((task) => (task.id === taskId ? next : task)))
    setUndoTarget({ taskId, previous: current, expiresAt: Date.now() + UNDO_WINDOW_MS, actionLabel })
  }

  const handleStartTask = (taskId: string, time: string) => {
    commitTaskChange(taskId, (task) => ({
      ...task,
      status: 'in_progress',
      handledBy: '伊藤 真理',
      handledById: 'ST-07',
      handledAt: formatMockTimestamp(time),
      completedAt: null,
      billable: false,
      collectionStatus: '未着手',
    }), '対応開始を反映しました')
  }

  const handleCompleteTask = (taskId: string, time: string) => {
    commitTaskChange(taskId, (task) => ({
      ...task,
      status: 'completed',
      handledBy: task.handledBy ?? '伊藤 真理',
      handledById: task.handledById ?? 'ST-07',
      handledAt: task.handledAt ?? formatMockTimestamp(time),
      completedAt: formatMockTimestamp(time),
      billable: task.amount > 0,
      collectionStatus: task.amount > 0 ? '請求準備OK' : '未着手',
    }), '対応完了を反映しました')
  }

  const handleUndo = () => {
    if (!undoTarget) return
    setDraftDayTasks((prev) => prev.map((task) => (task.id === undoTarget.taskId ? undoTarget.previous : task)))
    setDayTasks((prev) => prev.map((task) => (task.id === undoTarget.taskId ? undoTarget.previous : task)))
    setUndoTarget(null)
  }

  const handlePlanTask = (taskId: string) => {
    const current = draftDayTasks.find((task) => task.id === taskId)
    if (!current) return

    if (isPharmacyAdmin && current.status === 'completed') {
      const ok = window.confirm('対応完了済みの予定を変更します。完了後の修正は履歴確認前提です。このまま変更しますか？')
      if (!ok) return
    }

    const nextActionLabel = current.planningStatus === 'planned' ? '担当予定を解除しました' : '担当予定に設定しました'
    commitTaskChange(taskId, (task) => ({
      ...task,
      planningStatus: task.planningStatus === 'planned' ? 'unplanned' : 'planned',
      plannedBy: task.planningStatus === 'planned' ? null : (user?.full_name ?? '伊藤 真理'),
      plannedById: task.planningStatus === 'planned' ? null : (user?.id ?? 'ST-07'),
      plannedAt: task.planningStatus === 'planned' ? null : '2026-03-29 13:42',
      updatedAt: '2026-03-29 13:42',
      updatedById: user?.id ?? 'ST-07',
    }), nextActionLabel)
  }

  const moveTask = (taskId: string, direction: 'up' | 'down') => {
    setDraftDayTasks((prev) => {
      const items = [...prev].sort((a, b) => a.sortOrder - b.sortOrder)
      const index = items.findIndex((item) => item.id === taskId)
      if (index === -1) return prev
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= items.length) return prev
      const current = items[index]
      const target = items[targetIndex]
      const temp = current.sortOrder
      current.sortOrder = target.sortOrder
      target.sortOrder = temp
      current.updatedAt = '2026-03-29 12:47'
      current.updatedById = 'ST-07'
      target.updatedAt = '2026-03-29 12:47'
      target.updatedById = 'ST-07'
      setHasOrderDraft(true)
      return [...items]
    })
  }

  const reorderTaskByDrag = (draggedTaskId: string, targetTaskId: string) => {
    if (draggedTaskId === targetTaskId) return
    setDraftDayTasks((prev) => {
      const items = [...prev].sort((a, b) => a.sortOrder - b.sortOrder)
      const fromIndex = items.findIndex((item) => item.id === draggedTaskId)
      const toIndex = items.findIndex((item) => item.id === targetTaskId)
      if (fromIndex === -1 || toIndex === -1) return prev
      const [moved] = items.splice(fromIndex, 1)
      items.splice(toIndex, 0, moved)
      const normalized = items.map((item, index) => ({
        ...item,
        sortOrder: index + 1,
        updatedAt: '2026-03-29 12:54',
        updatedById: 'ST-07',
      }))
      setHasOrderDraft(true)
      return normalized
    })
  }

  const handleSaveOrder = () => {
    const savedAt = '2026-03-29 13:00'
    const savedBy = user?.full_name ?? '伊藤 真理'
    setDayTasks(draftDayTasks)
    setHasOrderDraft(false)
    setLastOrderSavedAt(savedAt)
    setLastOrderSavedBy(savedBy)
    setSaveToast('並び順を保存しました。他スタッフにも反映されます。')
    try {
      window.localStorage.setItem(DAY_TASK_SHARED_STORAGE_KEY, JSON.stringify({ tasks: draftDayTasks, savedAt, savedBy }))
    } catch {}
  }

  const handleResetOrderDraft = () => {
    setDraftDayTasks(dayTasks)
    setHasOrderDraft(false)
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="患者名で検索" className="border-[#2a3553] bg-[#1a2035] pl-9 text-sm" />
      </div>

      <>
        <PharmacyDashboardHeaderCard
          flowDescription={flowDescription}
          billableReadyCount={billableReadyCount}
          primarySummaryBadge={primarySummaryBadge}
          hasOrderDraft={hasOrderDraft}
          handleSaveOrder={handleSaveOrder}
          handleResetOrderDraft={handleResetOrderDraft}
          orderDraftBadgeText={orderDraftBadgeText}
          orderSavedButtonText={orderSavedButtonText}
          resetOrderButtonText={resetOrderButtonText}
          createPatientButtonText={createPatientButtonText}
          undoTarget={undoTarget}
          handleUndo={handleUndo}
        />

        <PharmacyDashboardSummaryCard
          summaryTitle={summaryTitle}
          pharmacyStaffHandledCounts={pharmacyStaffHandledCounts}
          summarySupportText={summarySupportText}
          saveStateBadge={saveStateBadge}
          adminWarningText={adminWarningText}
        />

        {saveToast && (
          <PharmacyDashboardNoticeCard
            tone="success"
            message={saveToast}
            subtext="shared mock save"
          />
        )}

        {undoTarget && (
          <PharmacyDashboardNoticeCard
            tone="warning"
            message={`${undoTarget.actionLabel}。短時間だけ元に戻せます。`}
            subtext="billing / 回収管理に反映する想定の mock 連携です。"
          />
        )}

        <PharmacyDashboardTabs>
          <TabsContent value="today" className="space-y-2">
            <PharmacyTodaySectionHeading countLabel={isPharmacyStaff ? '自動生成 + 手動追加' : '本日の訪問予定ベース'} />
            <div className="space-y-2">
              {draggingTaskId && (
                <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
                  青く光っている患者カードの位置にドロップすると、そこへ順番を移動します。
                </div>
              )}
              {orderedVisits.map((visit) => {
                const patient = visit.patient
                if (!patient) return null
                const status = taskStatusMeta(visit.status)
                const collection = collectionStatusMeta(visit.collectionStatus)
                const canStart = visit.status === 'scheduled'
                const canComplete = visit.status === 'in_progress'
                return (
                  <PharmacyDayTaskCard
                    key={visit.id}
                    visit={visit}
                    patient={patient}
                    statusClassName={status.className}
                    statusLabel={status.label}
                    collectionClassName={collection.className}
                    draggingTaskId={draggingTaskId}
                    dragOverTaskId={dragOverTaskId}
                    setDraggingTaskId={setDraggingTaskId}
                    setDragOverTaskId={setDragOverTaskId}
                    onDropReorder={() => reorderTaskByDrag(draggingTaskId!, visit.id)}
                    canStart={canStart}
                    canComplete={canComplete}
                    canMoveUp={visit.status !== 'completed'}
                    canMoveDown={visit.status !== 'completed'}
                    onPlanToggle={() => handlePlanTask(visit.id)}
                    onMoveUp={() => moveTask(visit.id, 'up')}
                    onMoveDown={() => moveTask(visit.id, 'down')}
                    onStart={() => handleStartTask(visit.id, visit.scheduledTime)}
                    onComplete={() => handleCompleteTask(visit.id, visit.scheduledTime)}
                    completionHelpText={completionHelpText}
                    plannedLabelPrefix={plannedLabelPrefix}
                    updatedLabelPrefix={updatedLabelPrefix}
                    planButtonLabel={visit.planningStatus === 'planned' ? '予定を外す' : '今日対応予定にする'}
                    reorderHintText={reorderHintText}
                  />
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="master" className="space-y-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-200">
              <Users className="h-4 w-4 text-indigo-400" />
              自局患者マスタ
              <span className="text-xs font-normal text-gray-500">PH-01 の患者のみ</span>
            </h2>
            <div className="space-y-2">
              {filteredMasterPatients.map((patient) => {
                const flags = getAttentionFlags(patient)
                return (
                  <Link key={patient.id} href={`/dashboard/patients/${patient.id}`}>
                    <Card className="cursor-pointer border-[#2a3553] bg-[#1a2035] transition hover:border-indigo-500/60">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white">{patient.name}</p>
                            <p className="mt-0.5 text-xs text-gray-500">{patient.address}</p>
                            <p className="mt-1 text-[11px] text-gray-400">次回訪問ルール: {formatVisitRuleSummary(patient)}</p>
                            <p className="mt-1 text-[11px] text-amber-300">visitRules 数: {countVisitRuleTouches(patient)}（超過時も保存可 / 警告表示のみ）</p>
                          </div>
                        </div>
                        {flags.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{flags.slice(0, 3).map((flag) => <Badge key={flag.key} variant="outline" className={cn('border text-[10px]', getAttentionFlagClass(flag.tone))}>{flag.label}</Badge>)}</div>}
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </TabsContent>
        </PharmacyDashboardTabs>
      </>
      {!isPharmacyStaff && (
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-200">
            <FileImage className="h-4 w-4 text-indigo-400" />
            送信済みFAX
          </h2>
          {mockPharmacyRequests.map((req) => (
            <Card key={req.id} className="border-[#2a3553] bg-[#1a2035]">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{req.patientName}</p>
                    <p className="text-xs text-gray-500">{req.id} • {req.time}</p>
                  </div>
                  <Badge variant="outline" className={cn('border text-xs', req.status === '対応完了' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : req.status === '対応中' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-sky-500/20 text-sky-300 border-sky-500/30')}>
                    {req.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isPharmacyStaff && (
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-white">
              <Receipt className="h-4 w-4 text-indigo-400" />
              回収管理への引き渡しメモ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-gray-300">
            {dayTasks.filter((task) => task.billable).map((task) => {
              const patient = ownPatients.find((item) => item.id === task.patientId)
              return (
                <div key={task.id} className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
                  <p className="font-medium text-white">{patient?.name ?? task.patientId}</p>
                  <p className="mt-1 text-gray-400">handled-by: {task.handledBy} / handled-at: {task.completedAt ?? task.handledAt}</p>
                  <p className="mt-1 text-gray-400">billable: {task.amount > 0 ? `${task.amount.toLocaleString('ja-JP')}円` : '対象外'} / status: {task.collectionStatus}</p>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function PharmacistDashboard() {
  return (
    <div className="space-y-4">
      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-white"><Moon className="h-4 w-4 text-indigo-400" />夜間患者検索</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-300">通知を受けたら、夜間患者検索から患者を検索して照合してください。</p>
          <p className="text-xs text-gray-500">Night Pharmacist には全患者一覧を出さず、必要時に検索起点で患者詳細へ進む設計です。</p>
          <Link href="/dashboard/night-patients">
            <Button className="bg-indigo-600 text-white hover:bg-indigo-500">夜間患者検索を開く</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DashboardPage() {
  const { role, loading } = useAuth()

  if (loading) {
    return (
      <div className="text-gray-100">
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardContent className="p-6 text-sm text-gray-400">ダッシュボードを読み込み中...</CardContent>
        </Card>
      </div>
    )
  }

  if (!role) {
    return (
      <div className="text-gray-100">
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-200">
              <AlertTriangle className="h-5 w-5" />
              ロール情報が取得できていません
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-amber-100/90">
            <p>現在のユーザーに role が入っていないため、ダッシュボードの内容を表示できません。</p>
            <div className="rounded-lg border border-amber-500/20 bg-black/10 p-3 text-xs leading-6">
              <p>確認ポイント:</p>
              <ul className="list-disc pl-5">
                <li>デモモードなら上部のロール切替から <strong>Regional Admin</strong> / <strong>Night Pharmacist</strong> / <strong>Pharmacy Admin</strong> などを選ぶ</li>
                <li>本番モードなら users テーブルの role が入っているか確認する</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="text-gray-100">
      {role === 'system_admin' && <SystemAdminDashboard />}
      {role === 'regional_admin' && <RegionalAdminDashboard />}
      {(role === 'pharmacy_admin' || role === 'pharmacy_staff') && <PharmacyDashboard isPharmacyStaff={role === 'pharmacy_staff'} />}
      {role === 'night_pharmacist' && <PharmacistDashboard />}
    </div>
  )
}
