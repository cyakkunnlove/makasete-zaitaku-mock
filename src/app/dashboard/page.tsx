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
  Settings2,
  FileClock,
  UserCog,
} from 'lucide-react'
import { dayTaskData, getAttentionFlags, getAttentionFlagClass, handoverData, kpiData, pharmacyData, requestData, shiftData, statusMeta, type DayTaskItem } from '@/lib/mock-data'
import { MOCK_FLOW_DATE, generateAutoDayTasksFromVisitRules, mergeDayFlowTasks } from '@/lib/day-flow'
import { countVisitRuleTouches, formatVisitRuleSummary, loadRegisteredPatients, type RegisteredPatientRecord } from '@/lib/patient-master'
import { getScopedPharmacyId } from '@/lib/patient-permissions'
import { mergePatientSources } from '@/lib/patient-read-model'
import { isPatientInPharmacyScope } from '@/lib/patient-scope'
import type { Patient } from '@/types/database'

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

function getDayTaskStorageKey(pharmacyId: string, flowDate: string) {
  return `makasete-day-flow:${pharmacyId}:${flowDate}`
}

function getSharedDayTaskStorageKey(pharmacyId: string, flowDate: string) {
  return `makasete-day-flow:shared:${pharmacyId}:${flowDate}`
}

function isUuidLike(value: string | null | undefined) {
  if (!value) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function shiftDateKey(baseDateKey: string, diffDays: number) {
  const date = new Date(`${baseDateKey}T00:00:00`)
  date.setDate(date.getDate() + diffDays)
  return toDateKey(date)
}

function getTodayDateKey() {
  return toDateKey(new Date())
}

function formatJapanDateTime(value: string | null | undefined) {
  if (!value) return '—'
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
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
  const activePharmacies = pharmacyData.filter((pharmacy) => pharmacy.status === 'active').length
  const forwardingReady = pharmacyData.filter((pharmacy) => pharmacy.forwarding).length
  const patientUnresolved = requestData.filter((request) => !request.patientId && request.status !== 'cancelled' && request.status !== 'completed').length

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
            <Settings2 className="h-4 w-4 text-emerald-400" />
            地域運用・加盟店設定サマリー
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
              <p className="text-[10px] text-emerald-200/80">夜間受託有効</p>
              <p className="mt-1 text-2xl font-bold text-emerald-300">{forwardingReady}</p>
            </div>
            <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3">
              <p className="text-[10px] text-indigo-200/80">地域内 active 加盟店</p>
              <p className="mt-1 text-2xl font-bold text-indigo-300">{activePharmacies}</p>
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="text-[10px] text-amber-200/80">患者未特定</p>
              <p className="mt-1 text-2xl font-bold text-amber-300">{patientUnresolved}</p>
            </div>
            <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3">
              <p className="text-[10px] text-sky-200/80">設定画面</p>
              <Link href="/dashboard/settings/region" className="mt-1 inline-flex text-sm font-medium text-sky-300 hover:text-sky-200">地域設定を開く</Link>
            </div>
          </div>
        </CardContent>
      </Card>

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
            本日の当直スタッフ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(() => {
            const today = MOCK_FLOW_DATE
            const todayShifts = shiftData.filter((shift) => shift.shiftDate === today)
            if (todayShifts.length === 0) {
              return <p className="text-xs text-gray-500">本日の当直データがありません。</p>
            }
            return todayShifts.map((shift) => {
              const activeRequest = requestData.find((req) => req.assigneeId === shift.pharmacistId && ['dispatched', 'arrived', 'in_progress'].includes(req.status))
              const status = activeRequest ? (activeRequest.status === 'dispatched' ? '移動中' : '対応中') : '待機中'
              const assignment = activeRequest ? `${activeRequest.pharmacyName} / ${activeRequest.patientName ?? '患者照合中'}` : '次回アサイン待機'
              return (
                <div key={shift.id} className="flex items-center justify-between rounded-lg border border-[#2a3553] bg-[#0a0e1a] p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-semibold text-indigo-300">
                      {shift.pharmacistName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{shift.pharmacistName}</p>
                      <p className="text-xs text-gray-500">{shift.shiftType === 'primary' ? '主担当' : 'バックアップ'} / {assignment}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn('border text-xs', staffStatusClass[status])}>
                    {status}
                  </Badge>
                </div>
              )
            })
          })()}
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
        <TabsTrigger value="today" className="data-[state=active]:bg-[#1a2035] data-[state=active]:text-white">今日の対応予定</TabsTrigger>
        <TabsTrigger value="master" className="data-[state=active]:bg-[#1a2035] data-[state=active]:text-white">患者一覧（簡易）</TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  )
}

function PharmacyTodaySectionHeading({ countLabel }: { countLabel?: string }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-200">
      <Building2 className="h-4 w-4 text-indigo-400" />
      今日の対応予定
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
        <p>着手: {formatJapanDateTime(visit.handledAt)}</p>
        <p>完了: {formatJapanDateTime(visit.completedAt)}</p>
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
        <p className="mt-1 text-sm text-white">{handledAt ? formatJapanDateTime(handledAt) : '未設定'}</p>
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
  canPlanToggle,
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
  canPlanToggle: boolean
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
      <Button size="sm" variant="outline" onClick={onPlanToggle} disabled={!canPlanToggle} className="border-sky-500/40 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20">
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
      {updatedAt && <span className="rounded-full border border-[#2a3553] bg-[#11182c] px-2 py-1 text-gray-400">{updatedLabelPrefix}{formatJapanDateTime(updatedAt)}</span>}
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
  canPlanToggle,
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
  canPlanToggle: boolean
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
          canPlanToggle={canPlanToggle}
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
  const [flowDate, setFlowDate] = useState(getTodayDateKey())
  const [dayTasks, setDayTasks] = useState<DayTaskItem[]>([])
  const [draftDayTasks, setDraftDayTasks] = useState<DayTaskItem[]>([])
  const [undoTarget, setUndoTarget] = useState<{ taskId: string; previous: DayTaskItem; expiresAt: number; actionLabel: string } | null>(null)
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)
  const [saveToast, setSaveToast] = useState<string | null>(null)
  const isPharmacyAdmin = !isPharmacyStaff
  const [hasOrderDraft, setHasOrderDraft] = useState(false)
  const [lastOrderSavedAt, setLastOrderSavedAt] = useState<string | null>(null)
  const [lastOrderSavedBy, setLastOrderSavedBy] = useState<string | null>(null)
  const [registeredPatients, setRegisteredPatients] = useState<RegisteredPatientRecord[]>([])
  const [databasePatients, setDatabasePatients] = useState<Patient[]>([])
  const [isPatientsLoading, setIsPatientsLoading] = useState(true)
  const [isDayFlowLoading, setIsDayFlowLoading] = useState(true)
  const ownPharmacyId = getScopedPharmacyId(user)
  const dayTaskStorageKey = useMemo(() => getDayTaskStorageKey(ownPharmacyId, flowDate), [ownPharmacyId, flowDate])
  const sharedDayTaskStorageKey = useMemo(() => getSharedDayTaskStorageKey(ownPharmacyId, flowDate), [ownPharmacyId, flowDate])
  const ownPatients = useMemo(() => {
    const merged = mergePatientSources({ databasePatients, registeredPatients })
    return merged.filter((patient) => isPatientInPharmacyScope(patient, ownPharmacyId))
  }, [databasePatients, ownPharmacyId, registeredPatients])
  const dayFlowPatients = useMemo(() => ownPatients.filter((patient) => isUuidLike(patient.id)), [ownPatients])

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
    if (!ownPharmacyId) return

    let cancelled = false
    async function fetchPatients() {
      if (!cancelled) setIsPatientsLoading(true)
      try {
        const response = await fetch(`/api/patients/by-pharmacy/${ownPharmacyId}`, { cache: 'no-store' })
        const result = await response.json()
        if (!cancelled && response.ok && result?.ok && Array.isArray(result.patients)) {
          setDatabasePatients(result.patients)
        }
      } catch {
        if (!cancelled) setDatabasePatients([])
      } finally {
        if (!cancelled) setIsPatientsLoading(false)
      }
    }

    fetchPatients()
    return () => {
      cancelled = true
    }
  }, [ownPharmacyId])

  const [flowLoadKey, setFlowLoadKey] = useState(0)
  useEffect(() => { setFlowLoadKey((prev) => prev + 1) }, [flowDate])

  const scopedBaseDayTasks = useMemo(() => {
    const ownPatientIds = new Set(dayFlowPatients.map((patient) => patient.id))
    return dayTaskData.filter((task) => ownPatientIds.has(task.patientId))
  }, [dayFlowPatients])

  useEffect(() => {
    const patients = dayFlowPatients
    let cancelled = false

    async function loadFlow() {
      if (!cancelled) setIsDayFlowLoading(true)
      try {
        const response = await fetch(`/api/day-flow/${flowDate}/tasks`, { cache: 'no-store' })
        const result = await response.json().catch(() => null)
        const persistedTasks = response.ok && result?.ok && Array.isArray(result.tasks)
          ? (result.tasks as Array<Record<string, unknown>>).map((task) => ({
              id: String(task.id),
              patientId: String(task.patient_id ?? ''),
              pharmacyId: String(task.pharmacy_id ?? ''),
              flowDate: String(task.flow_date),
              sortOrder: Number(task.sort_order ?? 1),
              scheduledTime: String(task.scheduled_time ?? '10:00'),
              visitType: (task.visit_type as DayTaskItem['visitType']) ?? '定期',
              source: (task.source as DayTaskItem['source']) ?? '自動生成',
              status: (task.status as DayTaskItem['status']) ?? 'scheduled',
              planningStatus: (task.planning_status as DayTaskItem['planningStatus']) ?? 'unplanned',
              plannedBy: (task.planned_by as string | null) ?? null,
              plannedById: (task.planned_by_id as string | null) ?? null,
              plannedAt: (task.planned_at as string | null) ?? null,
              handledBy: (task.handled_by as string | null) ?? null,
              handledById: (task.handled_by_id as string | null) ?? null,
              handledAt: (task.handled_at as string | null) ?? null,
              completedAt: (task.completed_at as string | null) ?? null,
              billable: Boolean(task.billable),
              collectionStatus: (task.collection_status as DayTaskItem['collectionStatus']) ?? '未着手',
              amount: Number(task.amount ?? 0),
              note: String(task.note ?? ''),
              updatedAt: (task.updated_at as string | null) ?? null,
              updatedById: (task.updated_by_id as string | null) ?? null,
            }))
          : []

        const merged = mergeDayFlowTasks({ baseTasks: scopedBaseDayTasks, flowDate, registeredPatients: patients, persistedTasks })
        if (!cancelled) {
          setDayTasks(merged)
          setDraftDayTasks(merged)
        }
      } catch {
        const merged = mergeDayFlowTasks({ baseTasks: scopedBaseDayTasks, flowDate, registeredPatients: patients })
        if (!cancelled) {
          setDayTasks(merged)
          setDraftDayTasks(merged)
        }
      } finally {
        if (!cancelled) setIsDayFlowLoading(false)
      }
    }

    loadFlow()
    return () => {
      cancelled = true
    }
  }, [dayFlowPatients, flowDate, flowLoadKey, scopedBaseDayTasks])

  useEffect(() => {
    try {
      window.localStorage.setItem(dayTaskStorageKey, JSON.stringify(draftDayTasks))
    } catch {}
  }, [dayTaskStorageKey, draftDayTasks])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'makasete-patient-master:v1') {
        setRegisteredPatients(loadRegisteredPatients())
        setFlowLoadKey((prev) => prev + 1)
      }
      if (event.key !== sharedDayTaskStorageKey || !event.newValue) return
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
  }, [sharedDayTaskStorageKey])

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

  const enrichedVisits = useMemo(() => {
    return draftDayTasks
      .filter((task) => dayFlowPatients.some((p) => p.id === task.patientId))
      .map((task) => {
        const patient = dayFlowPatients.find((p) => p.id === task.patientId)
        return { ...task, patient }
      })
  }, [dayFlowPatients, draftDayTasks])

  const filteredVisits = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return enrichedVisits
    return enrichedVisits.filter((visit) => {
      const haystacks = [visit.patient?.name ?? '', visit.patient?.address ?? '', visit.note]
      return haystacks.some((value) => value.toLowerCase().includes(query))
    })
  }, [searchQuery, enrichedVisits])

  const helperCandidatePatientIds = useMemo(() => {
    const nearDates = [shiftDateKey(flowDate, -1), flowDate, shiftDateKey(flowDate, 1)]
    const idSet = new Set<string>()

    nearDates.forEach((dateKey) => {
      generateAutoDayTasksFromVisitRules(dayFlowPatients, dateKey, [...dayTaskData, ...draftDayTasks]).forEach((task) => {
        if (task.patientId) idSet.add(task.patientId)
      })
    })

    draftDayTasks.forEach((task) => {
      if (task.patientId) idSet.add(task.patientId)
    })

    return idSet
  }, [dayFlowPatients, draftDayTasks, flowDate])

  const filteredMasterPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      return ownPatients.filter((patient) => helperCandidatePatientIds.has(patient.id))
    }
    return ownPatients.filter((p) => p.name.toLowerCase().includes(query) || p.address.toLowerCase().includes(query))
  }, [helperCandidatePatientIds, ownPatients, searchQuery])

  const billableReadyCount = draftDayTasks.filter((task) => task.billable).length
  const ownRequests = requestData.filter((request) => request.pharmacyId === ownPharmacyId)
  const ownUnconfirmedHandovers = handoverData.filter((handover) => handover.pharmacyId === ownPharmacyId && !handover.confirmed)
  const ownOvernightPatients = new Set(ownRequests.filter((request) => request.receivedDate === '2026-03-05' || request.receivedDate === '2026-03-06').map((request) => request.patientId).filter(Boolean)).size
  const ownActiveRequests = ownRequests.filter((request) => ['received', 'fax_pending', 'fax_received', 'assigning', 'assigned', 'checklist', 'dispatched', 'arrived', 'in_progress'].includes(request.status)).length
  const ownConfigStatus = {
    nightDelegation: '有効',
    regionLabel: '世田谷・城南リージョン',
    emergencyRoute: 'Regional Admin 受付',
  }
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

  const upsertTask = async (task: DayTaskItem) => {
    const response = await fetch(`/api/day-flow/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task }),
    })

    if (!response.ok) {
      let message = '保存に失敗しました'
      try {
        const result = await response.json()
        if (result?.details) message = `保存に失敗しました: ${result.details}`
      } catch {}
      throw new Error(message)
    }
  }

  const persistTaskChange = async (taskId: string, updater: (task: DayTaskItem) => DayTaskItem, actionLabel: string) => {
    const current = draftDayTasks.find((task) => task.id === taskId)
    if (!current) return
    const next = updater(current)
    setDraftDayTasks((prev) => prev.map((task) => (task.id === taskId ? next : task)))
    setDayTasks((prev) => prev.map((task) => (task.id === taskId ? next : task)))
    setUndoTarget({ taskId, previous: current, expiresAt: Date.now() + UNDO_WINDOW_MS, actionLabel })

    try {
      await upsertTask(next)
    } catch (error) {
      setDraftDayTasks((prev) => prev.map((task) => (task.id === taskId ? current : task)))
      setDayTasks((prev) => prev.map((task) => (task.id === taskId ? current : task)))
      setSaveToast(error instanceof Error ? error.message : '保存に失敗しました')
    }
  }

  const handleAddPatientToTodayFlow = async (patient: RegisteredPatientRecord) => {
    const existing = draftDayTasks.find((task) => task.patientId === patient.id && task.flowDate === flowDate && task.status !== 'completed')
    if (existing) {
      setSaveToast('この患者はすでに本日のフローに入っています')
      return
    }

    const nextTask: DayTaskItem = {
      id: `DT-MANUAL-${flowDate.replaceAll('-', '')}-${patient.id}`,
      patientId: patient.id,
      pharmacyId: patient.pharmacyId,
      flowDate,
      sortOrder: draftDayTasks.length + 1,
      scheduledTime: patient.visitRules?.find((rule) => rule.active && rule.preferredTime)?.preferredTime ?? '10:00',
      visitType: '臨時',
      source: '手動追加',
      status: 'scheduled',
      planningStatus: 'planned',
      plannedBy: user?.full_name ?? null,
      plannedById: user?.id ?? null,
      plannedAt: new Date().toISOString(),
      handledBy: null,
      handledById: null,
      handledAt: null,
      completedAt: null,
      billable: false,
      collectionStatus: '未着手',
      amount: 0,
      note: '患者マスタから本日対応へ追加',
      updatedAt: new Date().toISOString(),
      updatedById: user?.id ?? null,
    }

    setDraftDayTasks((prev) => [...prev, nextTask])
    setDayTasks((prev) => [...prev, nextTask])

    try {
      await upsertTask(nextTask)
      setSaveToast('本日の対応フローに追加しました')
      setFlowLoadKey((prev) => prev + 1)
    } catch (error) {
      setDraftDayTasks((prev) => prev.filter((task) => task.id !== nextTask.id))
      setDayTasks((prev) => prev.filter((task) => task.id !== nextTask.id))
      setSaveToast(error instanceof Error ? error.message : '保存に失敗しました')
    }
  }

  const handleStartTask = async (taskId: string) => {
    const now = new Date().toISOString()
    await persistTaskChange(taskId, (task) => ({
      ...task,
      status: 'in_progress',
      planningStatus: 'planned',
      plannedBy: task.plannedBy ?? user?.full_name ?? '伊藤 真理',
      plannedById: task.plannedById ?? user?.id ?? 'ST-07',
      plannedAt: task.plannedAt ?? now,
      handledBy: user?.full_name ?? '伊藤 真理',
      handledById: user?.id ?? 'ST-07',
      handledAt: now,
      completedAt: null,
      billable: false,
      collectionStatus: '未着手',
      updatedAt: now,
      updatedById: user?.id ?? 'ST-07',
    }), '対応開始を反映しました')
  }

  const handleCompleteTask = async (taskId: string) => {
    const now = new Date().toISOString()
    await persistTaskChange(taskId, (task) => ({
      ...task,
      status: 'completed',
      handledBy: task.handledBy ?? user?.full_name ?? '伊藤 真理',
      handledById: task.handledById ?? user?.id ?? 'ST-07',
      handledAt: task.handledAt ?? now,
      completedAt: now,
      billable: task.amount > 0,
      collectionStatus: task.amount > 0 ? '請求準備OK' : '未着手',
      updatedAt: now,
      updatedById: user?.id ?? 'ST-07',
    }), '対応完了を反映しました')
  }

  const handleUndo = () => {
    if (!undoTarget) return
    setDraftDayTasks((prev) => prev.map((task) => (task.id === undoTarget.taskId ? undoTarget.previous : task)))
    setDayTasks((prev) => prev.map((task) => (task.id === undoTarget.taskId ? undoTarget.previous : task)))
    setUndoTarget(null)
  }

  const handlePlanTask = async (taskId: string) => {
    const current = draftDayTasks.find((task) => task.id === taskId)
    if (!current) return

    if (isPharmacyAdmin && current.status === 'completed') {
      const ok = window.confirm('対応完了済みの予定を変更します。完了後の修正は履歴確認前提です。このまま変更しますか？')
      if (!ok) return
    }

    const nextActionLabel = current.planningStatus === 'planned' ? '担当予定を解除しました' : '担当予定に設定しました'
    await persistTaskChange(taskId, (task) => ({
      ...task,
      planningStatus: task.planningStatus === 'planned' ? 'unplanned' : 'planned',
      plannedBy: task.planningStatus === 'planned' ? null : (user?.full_name ?? '伊藤 真理'),
      plannedById: task.planningStatus === 'planned' ? null : (user?.id ?? 'ST-07'),
      plannedAt: task.planningStatus === 'planned' ? null : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
      window.localStorage.setItem(sharedDayTaskStorageKey, JSON.stringify({ tasks: draftDayTasks, savedAt, savedBy }))
    } catch {}
  }

  const handleResetOrderDraft = () => {
    setDraftDayTasks(dayTasks)
    setHasOrderDraft(false)
  }

  const flowDateLabel = useMemo(() => {
    const d = new Date(`${flowDate}T00:00:00`)
    return `${d.getMonth() + 1}/${d.getDate()} (${['日','月','火','水','木','金','土'][d.getDay()]})`
  }, [flowDate])

  const shiftFlowDate = (days: number) => {
    const d = new Date(`${flowDate}T00:00:00`)
    d.setDate(d.getDate() + days)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    setFlowDate(`${y}-${m}-${day}`)
  }

  return (
    <div className="space-y-4">
      {(() => {
        const unconfirmed = handoverData.filter((ho) => !ho.confirmed)
        if (unconfirmed.length === 0) return null
        return (
          <Card className="border-amber-500/40 bg-amber-500/10">
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-200">
                <AlertTriangle className="h-4 w-4" />
                夜間対応の確認待ち（{unconfirmed.length}件）
              </div>
              {unconfirmed.map((ho) => (
                <div key={ho.id} className="rounded-lg border border-amber-500/20 bg-black/10 p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-amber-100">{ho.patientName} — 夜間対応 {ho.pharmacistName}</p>
                      <p className="mt-1 text-amber-200/80">{ho.situation}</p>
                      <p className="mt-1 text-amber-200/60">{ho.recommendation}</p>
                    </div>
                    <Link href={`/dashboard/patients/${ho.patientId}`}>
                      <Button size="sm" variant="outline" className="border-amber-500/40 text-amber-200 hover:bg-amber-500/20">患者情報で確認</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )
      })()}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="患者名で検索" className="border-[#2a3553] bg-[#1a2035] pl-9 text-sm" />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-[#2a3553] bg-[#1a2035] px-3 py-2 text-sm text-gray-200">
        <button onClick={() => shiftFlowDate(-1)} className="rounded px-2 py-1 text-gray-400 hover:bg-[#11182c] hover:text-white">前日</button>
        <div className="text-center">
          <p className="text-xs text-gray-500">表示中のday flow</p>
          <p className="font-medium text-white">{flowDateLabel}</p>
        </div>
        <button onClick={() => shiftFlowDate(1)} className="rounded px-2 py-1 text-gray-400 hover:bg-[#11182c] hover:text-white">翌日</button>
      </div>

      <>
        {isPharmacyAdmin && (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
            <Card className="border-[#2a3553] bg-[#1a2035]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <FileClock className="h-4 w-4 text-amber-300" />
                  <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-200">最優先</Badge>
                </div>
                <p className="mt-3 text-2xl font-bold text-white">{ownUnconfirmedHandovers.length}</p>
                <p className="text-[11px] text-gray-500">夜間対応の確認待ち</p>
              </CardContent>
            </Card>
            <Card className="border-[#2a3553] bg-[#1a2035]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Moon className="h-4 w-4 text-indigo-300" />
                  <Badge variant="outline" className="border-indigo-500/40 bg-indigo-500/10 text-indigo-200">昨夜</Badge>
                </div>
                <p className="mt-3 text-2xl font-bold text-white">{ownOvernightPatients}</p>
                <p className="text-[11px] text-gray-500">昨夜対応あり患者</p>
              </CardContent>
            </Card>
            <Card className="border-[#2a3553] bg-[#1a2035]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <ClipboardList className="h-4 w-4 text-sky-300" />
                  <Badge variant="outline" className="border-sky-500/40 bg-sky-500/10 text-sky-200">自局</Badge>
                </div>
                <p className="mt-3 text-2xl font-bold text-white">{ownActiveRequests}</p>
                <p className="text-[11px] text-gray-500">進行中の夜間依頼</p>
              </CardContent>
            </Card>
            <Card className="border-[#2a3553] bg-[#1a2035]">
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <Settings2 className="h-4 w-4 text-emerald-300" />
                  <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-200">{ownConfigStatus.nightDelegation}</Badge>
                </div>
                <p className="text-xs text-gray-400">夜間受託設定</p>
                <p className="text-sm font-medium text-white">{ownConfigStatus.regionLabel}</p>
                <p className="text-[11px] text-gray-500">連絡経路: {ownConfigStatus.emergencyRoute}</p>
                <Link href="/dashboard/settings/pharmacy" className="inline-flex text-[11px] text-indigo-300 hover:text-indigo-200">薬局設定を開く</Link>
              </CardContent>
            </Card>
          </div>
        )}

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

        {isPharmacyAdmin && ownUnconfirmedHandovers.length > 0 && (
          <Card className="border-[#2a3553] bg-[#1a2035]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-white">
                <UserCog className="h-4 w-4 text-indigo-400" />
                管理者向け朝確認（夜間対応）
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ownUnconfirmedHandovers.slice(0, 3).map((handover) => (
                <div key={handover.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
                  <div>
                    <p className="text-sm font-medium text-white">{handover.patientName}</p>
                    <p className="text-xs text-gray-400">夜間担当: {handover.pharmacistName} / {handover.timestamp}</p>
                    <p className="mt-1 text-[11px] text-amber-200">夜間対応の確認待ち・朝の優先度確認が必要です</p>
                  </div>
                  <Link href={`/dashboard/patients/${handover.patientId}`}>
                    <Button size="sm" variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20">患者情報で確認</Button>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <PharmacyDashboardSummaryCard
          summaryTitle={summaryTitle}
          pharmacyStaffHandledCounts={pharmacyStaffHandledCounts}
          summarySupportText={summarySupportText}
          saveStateBadge={saveStateBadge}
          adminWarningText={adminWarningText}
        />

        {(isPatientsLoading || isDayFlowLoading) && (
          <Card className="border-sky-500/30 bg-sky-500/10">
            <CardContent className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm text-sky-100">
              <span>データベースから最新データを読み込み中です...</span>
              <span className="text-xs text-sky-200/80">
                {isPatientsLoading && isDayFlowLoading ? '患者情報と今日の対応予定を読み込み中' : isPatientsLoading ? '患者情報を読み込み中' : '今日の対応予定を読み込み中'}
              </span>
            </CardContent>
          </Card>
        )}

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
            <PharmacyTodaySectionHeading countLabel={`${flowDateLabel} / ${isPharmacyStaff ? '自動生成 + 手動追加' : '本日の訪問予定ベース'}`} />
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
                const isCompleted = visit.status === 'completed'
                const canPlanToggle = !isCompleted
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
                    canMoveUp={!isCompleted}
                    canMoveDown={!isCompleted}
                    canPlanToggle={canPlanToggle}
                    onPlanToggle={() => handlePlanTask(visit.id)}
                    onMoveUp={() => moveTask(visit.id, 'up')}
                    onMoveDown={() => moveTask(visit.id, 'down')}
                    onStart={() => handleStartTask(visit.id)}
                    onComplete={() => handleCompleteTask(visit.id)}
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
              患者一覧（簡易）
              <span className="text-xs font-normal text-gray-500">昨日・今日・明日の対応候補を表示。その他は検索して探せます</span>
            </h2>
            <div className="space-y-2">
              {!searchQuery.trim() && filteredMasterPatients.length === 0 && (
                <Card className="border-[#2a3553] bg-[#11182c]">
                  <CardContent className="p-4 text-sm text-gray-400">昨日・今日・明日の対応候補はいま表示対象にありません。必要な患者は上の検索から探せます。</CardContent>
                </Card>
              )}
              {searchQuery.trim() && filteredMasterPatients.length === 0 && (
                <Card className="border-[#2a3553] bg-[#11182c]">
                  <CardContent className="p-4 text-sm text-gray-400">該当する患者が見つかりませんでした。患者情報ページでの確認もできます。</CardContent>
                </Card>
              )}
              {filteredMasterPatients.map((patient) => {
                const flags = getAttentionFlags(patient)
                const hasOvernightRequest = ownRequests.some((request) => request.patientId === patient.id)
                const unconfirmedHandover = handoverData.find((handover) => handover.patientId === patient.id && handover.pharmacyId === ownPharmacyId && !handover.confirmed)
                const hasTodayFlowTask = draftDayTasks.some((task) => task.patientId === patient.id && task.flowDate === flowDate && task.status !== 'completed')
                return (
                  <Card key={patient.id} className="border-[#2a3553] bg-[#1a2035] transition hover:border-indigo-500/60">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link href={`/dashboard/patients/${patient.id}`} className="text-sm font-semibold text-white hover:text-indigo-300">{patient.name}</Link>
                            {hasOvernightRequest && <Badge variant="outline" className="border-indigo-500/40 bg-indigo-500/10 text-[10px] text-indigo-200">昨夜対応あり</Badge>}
                            {unconfirmedHandover && <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-[10px] text-amber-200">夜間対応確認待ち</Badge>}
                            {hasTodayFlowTask && <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-200">本日フローに追加済み</Badge>}
                          </div>
                          <p className="mt-0.5 text-xs text-gray-500">{patient.address}</p>
                          <p className="mt-1 text-[11px] text-gray-400">次回訪問ルール: {formatVisitRuleSummary(patient)}</p>
                          <p className="mt-1 text-[11px] text-amber-300">visitRules 数: {countVisitRuleTouches(patient)}（超過時も保存可 / 警告表示のみ）</p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button size="sm" variant="outline" className="border-[#2a3553] text-xs text-gray-200 hover:bg-[#11182c]" asChild>
                            <Link href={`/dashboard/patients/${patient.id}`}>詳細を見る</Link>
                          </Button>
                          <Button size="sm" className="bg-indigo-600 text-xs text-white hover:bg-indigo-500 disabled:bg-indigo-900" disabled={hasTodayFlowTask} onClick={() => handleAddPatientToTodayFlow(patient)}>
                            今日対応予定にする
                          </Button>
                        </div>
                      </div>
                      {flags.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{flags.slice(0, 3).map((flag) => <Badge key={flag.key} variant="outline" className={cn('border text-[10px]', getAttentionFlagClass(flag.tone))}>{flag.label}</Badge>)}</div>}
                    </CardContent>
                  </Card>
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
                  <p className="mt-1 text-gray-400">handled-by: {task.handledBy} / handled-at: {formatJapanDateTime(task.completedAt ?? task.handledAt)}</p>
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
  const ownAssignments = requestData.filter((request) => request.assigneeId === 'ST-02' || request.assignee === '佐藤 健一')
  const waitingCount = ownAssignments.filter((request) => ['received', 'fax_pending', 'fax_received', 'assigning', 'assigned', 'checklist'].includes(request.status)).length
  const inProgressCount = ownAssignments.filter((request) => ['dispatched', 'arrived', 'in_progress'].includes(request.status)).length
  const completedCount = ownAssignments.filter((request) => request.status === 'completed').length
  const faxCount = ownAssignments.filter((request) => ['fax_pending', 'fax_received'].includes(request.status)).length
  const intakeRequests = ownAssignments.filter((request) => ['received', 'fax_pending', 'fax_received', 'assigning', 'assigned', 'checklist'].includes(request.status))
  const newestIntakeRequest = intakeRequests[0] ?? null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="border-[#2a3553] bg-[#1a2035]"><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-white">{ownAssignments.length}</p><p className="text-[10px] text-gray-500">夜間受付案件</p></CardContent></Card>
        <Card className="border-[#2a3553] bg-[#1a2035]"><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-amber-300">{waitingCount}</p><p className="text-[10px] text-gray-500">患者確認前 / 対応待ち</p></CardContent></Card>
        <Card className="border-[#2a3553] bg-[#1a2035]"><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-sky-300">{inProgressCount}</p><p className="text-[10px] text-gray-500">対応中</p></CardContent></Card>
        <Card className="border-[#2a3553] bg-[#1a2035]"><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-indigo-300">{faxCount}</p><p className="text-[10px] text-gray-500">FAX確認待ち</p></CardContent></Card>
      </div>

      {newestIntakeRequest && (
        <Card className="border-rose-500/30 bg-rose-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-rose-100">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-rose-400" />
              新規あり
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-100">新規受付</span>
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-100">{newestIntakeRequest.status === 'fax_pending' ? 'FAX受信待ち' : 'FAX受信済み'}</span>
                  <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-1 text-[11px] text-indigo-100">{newestIntakeRequest.receivedAt}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">患者・薬局は未特定</p>
                  <p className="mt-1 text-xs text-gray-300">{newestIntakeRequest.symptom}</p>
                  <p className="mt-1 text-[11px] text-gray-400">電子FAXの添付処方箋を確認し、内容を見ながら患者と薬局を特定します。</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Link href={`/dashboard/night-patients?requestId=${newestIntakeRequest.id}&source=fax`}>
                  <Button className="w-full bg-rose-600 text-white hover:bg-rose-500">内容を確認する</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-white"><Moon className="h-4 w-4 text-indigo-400" />夜間受付ワークスペース</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-300">ナイトファーマシストは夜間の受付担当です。新規受付はまずダッシュボードで検知し、電子FAXの添付処方箋を確認してから患者特定へ進みます。</p>
          <div className="grid gap-3 md:grid-cols-2">
            <Link href="/dashboard/requests">
              <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-4 transition hover:border-indigo-400">
                <p className="text-sm font-medium text-white">依頼管理</p>
                <p className="mt-1 text-xs text-gray-400">受けた後の案件一覧と進行状況を確認</p>
              </div>
            </Link>
            <Link href="/dashboard/night-patients">
              <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-4 transition hover:border-sky-400">
                <p className="text-sm font-medium text-white">患者特定</p>
                <p className="mt-1 text-xs text-gray-400">新規受付またはFAX確認後に患者を検索して確定</p>
              </div>
            </Link>
          </div>
          <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3 text-xs text-gray-300">
            患者検索範囲はリージョンアドミン管轄内に限定。全患者一覧は表示せず、検索→患者選択→確認→対応→申し送りの順で進む想定です。
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-white">受付ルール</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 text-sm">
          <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
            <p className="text-xs text-gray-500">受付起点</p>
            <p className="mt-1 text-white">受電後にFAX受信まで含めた受付フロー</p>
          </div>
          <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
            <p className="text-xs text-gray-500">受付時間</p>
            <p className="mt-1 text-white">患者確認ボタン押下時刻</p>
          </div>
          <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
            <p className="text-xs text-gray-500">次アクション</p>
            <p className="mt-1 text-white">対応開始 → 申し送り作成</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-white">直近の自分案件（モック）</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {ownAssignments.slice(0, 3).map((request) => (
            <Link key={request.id} href={`/dashboard/requests/${request.id}`}>
              <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3 transition hover:border-indigo-500/40">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-white">{request.id} / {request.patientName ?? '患者照合中'}</p>
                    <p className="text-xs text-gray-400">{request.pharmacyName} ・ {request.receivedAt}</p>
                  </div>
                  <Badge variant="outline" className={cn('border text-xs', statusMeta[request.status].className)}>{statusMeta[request.status].label}</Badge>
                </div>
              </div>
            </Link>
          ))}
          <p className="text-[11px] text-gray-500">完了済み案件 {completedCount} 件。申し送りは案件詳細から作成する想定です。</p>
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
