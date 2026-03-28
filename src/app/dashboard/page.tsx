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
  Clock3,
  AlertTriangle,
  Activity,
  CheckCircle2,
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
  Route,
} from 'lucide-react'
import { dayTaskData, getAttentionFlags, getAttentionFlagClass, getPatientsByPharmacy, handoverData, kpiData, nightStaff, requestData, type DayTaskItem } from '@/lib/mock-data'

const mockFaxes = [
  { id: 'FAX-001', requestId: 'RQ-2401', from: '城南みらい薬局', patientName: '田中 優子', receivedAt: '22:15', status: 'confirmed' as const, patientId: 'PT-001' },
  { id: 'FAX-002', requestId: 'RQ-2406', from: '中野しらさぎ薬局', patientName: '清水 恒一', receivedAt: '22:45', status: 'unread' as const, patientId: 'PT-004' },
  { id: 'FAX-003', requestId: 'RQ-2402', from: '港北さくら薬局', patientName: '小川 正子', receivedAt: '23:10', status: 'unread' as const, patientId: 'PT-002' },
]

const mockPharmacyRequests = [
  { id: 'REQ-0308-001', patientName: '田中 優子', status: '対応完了', time: '22:30', pharmacist: '佐藤 健一' },
  { id: 'REQ-0308-002', patientName: '清水 恒一', status: '対応中', time: '23:00', pharmacist: '佐藤 健一' },
  { id: 'REQ-0308-003', patientName: '小川 正子', status: 'FAX送信済', time: '23:10', pharmacist: '未アサイン' },
]

const faxStatusConfig = {
  unread: { label: '未確認', className: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  confirmed: { label: '確認済', className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
}

const staffStatusClass: Record<string, string> = {
  待機中: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  対応中: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  移動中: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
}

const kpiIcons = [ClipboardList, Activity, Building2, Timer]
const DAY_PHARMACIST_NAME = '小林 薫'
const DAY_PHARMACIST_ID = 'ST-DAY-01'
const UNDO_WINDOW_MS = 8000
const DAY_TASK_STORAGE_KEY = 'makasete-day-tasks'

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
            <Route className="h-4 w-4 text-indigo-400" />
            導入診断（新規モジュール）
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-300">
            田中社長ヒアリングを反映した導入診断フォームの最小版を実装済み。診断→GO/NOT YET/STOP判定まで確認できます。
          </p>
          <div className="flex items-center justify-between rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
            <div>
              <p className="text-sm font-medium text-white">次の確認ポイント</p>
              <p className="text-xs text-gray-500">質問文・判定理由・ロードマップ接続の妥当性をレビュー</p>
            </div>
            <Link href="/dashboard/onboarding">
              <Button className="bg-indigo-600 text-white hover:bg-indigo-500">開く</Button>
            </Link>
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

const nightSearchCandidates = [
  { id: 'PT-001', patientName: '田中 優子', pharmacyName: '城南みらい薬局', regionName: '東京南部', distanceKm: 4.2, etaMin: 11, matchScore: 96, reason: '加盟店一致 / 生年月日一致 / 処方薬一致' },
  { id: 'PT-007', patientName: '山本 直子', pharmacyName: '世田谷つばさ薬局', regionName: '東京南部', distanceKm: 6.8, etaMin: 17, matchScore: 74, reason: 'リージョン一致 / 氏名類似 / 症状文脈一致' },
  { id: 'PT-006', patientName: '渡辺 美和', pharmacyName: '西新宿いろは薬局', regionName: '東京西部', distanceKm: 12.4, etaMin: 28, matchScore: 42, reason: 'リージョン外候補 / 距離超過気味' },
]

function PharmacyDashboard({ isDayPharmacist = false }: { isDayPharmacist?: boolean }) {
  const { role } = useAuth()
  const isPharmacyAdmin = role === 'pharmacy_admin'
  const [searchQuery, setSearchQuery] = useState('')
  const [dayTasks, setDayTasks] = useState(dayTaskData)
  const [undoTarget, setUndoTarget] = useState<{ taskId: string; previous: DayTaskItem; expiresAt: number; actionLabel: string } | null>(null)
  const ownPharmacyId = 'PH-01'
  const ownPatients = useMemo(() => getPatientsByPharmacy(ownPharmacyId), [ownPharmacyId])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DAY_TASK_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as DayTaskItem[]
        if (Array.isArray(parsed) && parsed.length > 0) setDayTasks(parsed)
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(DAY_TASK_STORAGE_KEY, JSON.stringify(dayTasks))
    } catch {}
  }, [dayTasks])

  useEffect(() => {
    if (!undoTarget) return
    const timeout = window.setTimeout(() => setUndoTarget((current) => (current?.taskId === undoTarget.taskId ? null : current)), Math.max(undoTarget.expiresAt - Date.now(), 0))
    return () => window.clearTimeout(timeout)
  }, [undoTarget])

  const enrichedVisits = useMemo(() => {
    return dayTasks
      .filter((task) => ownPatients.some((p) => p.id === task.patientId))
      .map((task) => {
        const patient = ownPatients.find((p) => p.id === task.patientId)
        return { ...task, patient }
      })
  }, [dayTasks, ownPatients])

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

  const completedCount = dayTasks.filter((task) => task.status === 'completed').length
  const inProgressCount = dayTasks.filter((task) => task.status === 'in_progress').length
  const scheduledCount = dayTasks.filter((task) => task.status === 'scheduled').length
  const billableReadyCount = dayTasks.filter((task) => task.billable).length
  const ownRequests = useMemo(() => requestData.filter((request) => request.pharmacyId === ownPharmacyId), [ownPharmacyId])
  const ownRequestReadyCount = ownRequests.filter((request) => ['received', 'fax_pending', 'fax_received', 'assigning', 'assigned', 'checklist'].includes(request.status)).length
  const ownRequestActiveCount = ownRequests.filter((request) => ['dispatched', 'arrived', 'in_progress'].includes(request.status)).length
  const ownRequestCompletedCount = ownRequests.filter((request) => request.status === 'completed').length
  const ownPendingHandovers = useMemo(() => handoverData.filter((handover) => handover.pharmacyId === ownPharmacyId && !handover.confirmed), [ownPharmacyId])

  const commitTaskChange = (taskId: string, updater: (task: DayTaskItem) => DayTaskItem, actionLabel: string) => {
    const current = dayTasks.find((task) => task.id === taskId)
    if (!current) return
    const next = updater(current)
    setDayTasks((prev) => prev.map((task) => (task.id === taskId ? next : task)))
    setUndoTarget({ taskId, previous: current, expiresAt: Date.now() + UNDO_WINDOW_MS, actionLabel })
  }

  const handleStartTask = (taskId: string, time: string) => {
    commitTaskChange(taskId, (task) => ({
      ...task,
      status: 'in_progress',
      handledBy: DAY_PHARMACIST_NAME,
      handledById: DAY_PHARMACIST_ID,
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
      handledBy: task.handledBy ?? DAY_PHARMACIST_NAME,
      handledById: task.handledById ?? DAY_PHARMACIST_ID,
      handledAt: task.handledAt ?? formatMockTimestamp(time),
      completedAt: formatMockTimestamp(time),
      billable: task.amount > 0,
      collectionStatus: task.amount > 0 ? '請求準備OK' : '未着手',
    }), '対応完了を反映しました')
  }

  const handleUndo = () => {
    if (!undoTarget) return
    setDayTasks((prev) => prev.map((task) => (task.id === undoTarget.taskId ? undoTarget.previous : task)))
    setUndoTarget(null)
  }

  return (
    <div className="space-y-4">
      {isPharmacyAdmin && !isDayPharmacist && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-[#2a3553] bg-[#1a2035]">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-white">{ownRequests.length}</p>
                <p className="text-[10px] text-gray-500">今夜の自局依頼</p>
              </CardContent>
            </Card>
            <Card className="border-[#2a3553] bg-[#1a2035]">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-amber-300">{ownRequestReadyCount}</p>
                <p className="text-[10px] text-gray-500">対応準備中</p>
              </CardContent>
            </Card>
            <Card className="border-[#2a3553] bg-[#1a2035]">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-sky-300">{ownRequestActiveCount}</p>
                <p className="text-[10px] text-gray-500">対応中</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-[#2a3553] bg-[#1a2035]">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-semibold text-white">自局の朝確認</p>
                <p className="text-xs text-gray-400">申し送り・完了件数・未完了件数だけ先に把握できるようにしています。</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/20 text-emerald-300">完了 {ownRequestCompletedCount}件</Badge>
                <Badge variant="outline" className="border-cyan-500/40 bg-cyan-500/20 text-cyan-300">未確認申し送り {ownPendingHandovers.length}件</Badge>
              </div>
            </CardContent>
          </Card>

          {ownPendingHandovers.length > 0 && (
            <Card className="border-[#2a3553] bg-[#1a2035]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white">朝確認が必要な申し送り</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {ownPendingHandovers.map((handover) => (
                  <div key={handover.id} className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-white">{handover.patientName}</p>
                        <p className="text-[11px] text-gray-500">{handover.timestamp} / {handover.pharmacistName}</p>
                      </div>
                      <Badge variant="outline" className="border-cyan-500/40 bg-cyan-500/20 text-cyan-300">未確認</Badge>
                    </div>
                    <p className="mt-2 text-xs text-gray-300">{handover.recommendation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-white">{enrichedVisits.length}</p>
            <p className="text-[10px] text-gray-500">本日合計</p>
          </CardContent>
        </Card>
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{completedCount}</p>
            <p className="text-[10px] text-gray-500">訪問済</p>
          </CardContent>
        </Card>
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-300">{isDayPharmacist ? inProgressCount : scheduledCount}</p>
            <p className="text-[10px] text-gray-500">{isDayPharmacist ? '対応中' : '未訪問'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="患者名で検索" className="border-[#2a3553] bg-[#1a2035] pl-9 text-sm" />
      </div>

      {isDayPharmacist ? (
        <>
          <Card className="border-[#2a3553] bg-[#1a2035]">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-semibold text-white">日中対応フロー（モック）</p>
                <p className="text-xs text-gray-400">今日対応する患者を確認して、対応完了まで記録します。完了した訪問は請求処理が必要な一覧に上がります。操作後 {UNDO_WINDOW_MS / 1000} 秒だけ取り消せます。</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-indigo-500/40 bg-indigo-500/20 text-indigo-300">請求連携候補 {billableReadyCount}件</Badge>
                {undoTarget && (
                  <Button size="sm" variant="outline" onClick={handleUndo} className="border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20">
                    <RotateCcw className="h-3.5 w-3.5" />
                    取り消す
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {undoTarget && (
            <Card className="border-amber-500/30 bg-amber-500/10">
              <CardContent className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm text-amber-100">
                <span>{undoTarget.actionLabel}。短時間だけ元に戻せます。</span>
                <span className="text-xs text-amber-200/80">billing / 回収管理に反映する想定の mock 連携です。</span>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="today" className="space-y-3">
            <TabsList className="grid w-full grid-cols-2 bg-[#11182c] text-gray-400">
              <TabsTrigger value="today" className="data-[state=active]:bg-[#1a2035] data-[state=active]:text-white">今日の患者フロー</TabsTrigger>
              <TabsTrigger value="master" className="data-[state=active]:bg-[#1a2035] data-[state=active]:text-white">患者マスタ</TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="space-y-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                <Building2 className="h-4 w-4 text-indigo-400" />
                今日の対応患者
                <span className="text-xs font-normal text-gray-500">自動生成 + 手動追加</span>
              </h2>
              <div className="space-y-2">
                {filteredVisits.map((visit) => {
                  const patient = visit.patient
                  if (!patient) return null
                  const status = taskStatusMeta(visit.status)
                  const collection = collectionStatusMeta(visit.collectionStatus)
                  const canStart = visit.status === 'scheduled'
                  const canComplete = visit.status === 'in_progress'
                  return (
                    <Card key={visit.id} className="border-[#2a3553] bg-[#1a2035]">
                      <CardContent className="space-y-3 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link href={`/dashboard/patients/${visit.patientId}`} className="text-sm font-semibold text-white hover:text-indigo-300">
                                {patient.name}
                              </Link>
                              <Badge variant="outline" className={cn('border text-[10px]', status.className)}>{status.label}</Badge>
                              <Badge variant="outline" className={cn('border text-[10px]', visit.source === '手動追加' ? 'border-amber-500/40 bg-amber-500/20 text-amber-300' : 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300')}>
                                {visit.source}
                              </Badge>
                              <Badge variant="outline" className="border-[#2a3553] text-[10px] text-gray-300">{visit.visitType}</Badge>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">{patient.address}</p>
                            <p className="mt-1 text-[11px] text-gray-400">予定 {visit.scheduledTime} / {visit.note}</p>
                          </div>
                          <div className="text-right text-xs text-gray-400">
                            <p>担当者: {visit.handledBy ?? '未対応'}</p>
                            <p>着手: {visit.handledAt ?? '—'}</p>
                            <p>完了: {visit.completedAt ?? '—'}</p>
                          </div>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-3">
                          <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-2.5">
                            <p className="text-[10px] text-gray-500">handled-by</p>
                            <p className="mt-1 text-sm text-white">{visit.handledBy ?? '未設定'}</p>
                          </div>
                          <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-2.5">
                            <p className="text-[10px] text-gray-500">handled-at</p>
                            <p className="mt-1 text-sm text-white">{visit.handledAt ?? '未設定'}</p>
                          </div>
                          <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-2.5">
                            <p className="text-[10px] text-gray-500">billable / 回収連携</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className={cn('border text-[10px]', visit.billable ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' : 'border-gray-500/40 bg-gray-500/20 text-gray-300')}>
                                {visit.billable ? '請求対象' : '未計上'}
                              </Badge>
                              <Badge variant="outline" className={cn('border text-[10px]', collection.className)}>{visit.collectionStatus}</Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button size="sm" onClick={() => handleStartTask(visit.id, visit.scheduledTime)} disabled={!canStart} className="bg-indigo-500 text-white hover:bg-indigo-500/90">
                            対応する
                          </Button>
                          <Button size="sm" onClick={() => handleCompleteTask(visit.id, visit.scheduledTime)} disabled={!canComplete} className="bg-emerald-600 text-white hover:bg-emerald-600/90">
                            対応完了
                          </Button>
                          <span className="text-[11px] text-gray-500">対応完了すると、あとで billing の「請求処理が必要な訪問一覧」に上がります。</span>
                        </div>
                      </CardContent>
                    </Card>
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
                              <p className="mt-1 text-[11px] text-gray-400">次回訪問ルール: 毎週 / 隔週の自動生成対象</p>
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
          </Tabs>
        </>
      ) : (
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-200">
            <Building2 className="h-4 w-4 text-indigo-400" />
            本日の訪問予定
            <span className="text-xs font-normal text-gray-500">{enrichedVisits.length}件</span>
          </h2>
          <div className="space-y-2">
            {filteredVisits.map((visit) => {
              const patient = visit.patient
              if (!patient) return null
              const isCompleted = visit.status === 'completed'
              return (
                <Link key={visit.id} href={`/dashboard/patients/${visit.patientId}`}>
                  <Card className="cursor-pointer border-[#2a3553] bg-[#1a2035] transition hover:border-indigo-500/60">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className={cn('text-sm font-semibold', isCompleted ? 'text-gray-400 line-through' : 'text-white')}>{patient.name}</p>
                            <Badge variant="outline" className={cn('border text-[10px]', visit.visitType === '臨時' ? 'border-amber-500/40 bg-amber-500/20 text-amber-300' : 'border-[#2a3553] text-gray-400')}>{visit.visitType}</Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-gray-500">{patient.address}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-sm font-medium text-gray-300">{visit.scheduledTime}</span>
                          {isCompleted ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Clock3 className="h-4 w-4 text-gray-500" />}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {!isDayPharmacist && (
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

      {isDayPharmacist && (
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
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCandidates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return nightSearchCandidates
    return nightSearchCandidates.filter((c) =>
      c.patientName.toLowerCase().includes(query) ||
      c.pharmacyName.toLowerCase().includes(query) ||
      c.regionName.toLowerCase().includes(query)
    )
  }, [searchQuery])

  const unreadFaxCount = mockFaxes.filter((f) => f.status === 'unread').length
  const matchedCount = nightSearchCandidates.filter((c) => c.matchScore >= 80).length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-[#2a3553] bg-[#1a2035]"><CardContent className="p-2 text-center"><p className="text-xl font-bold text-rose-400">{unreadFaxCount}</p><p className="text-[10px] text-gray-500">未確認FAX</p></CardContent></Card>
        <Card className="border-[#2a3553] bg-[#1a2035]"><CardContent className="p-2 text-center"><p className="text-xl font-bold text-indigo-300">{filteredCandidates.length}</p><p className="text-[10px] text-gray-500">候補患者</p></CardContent></Card>
        <Card className="border-[#2a3553] bg-[#1a2035]"><CardContent className="p-2 text-center"><p className="text-xl font-bold text-emerald-400">{matchedCount}</p><p className="text-[10px] text-gray-500">高一致候補</p></CardContent></Card>
      </div>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-white"><Moon className="h-4 w-4 text-indigo-400" />夜間専用患者検索</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-gray-400">通常の患者マスタ一覧は表示しません。FAX内容をもとに、加盟店・リージョン・距離条件で候補を絞り込みます。</p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="患者名 / 加盟店 / リージョンで候補検索" className="border-[#2a3553] bg-[#11182c] pl-9 text-sm" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-rose-300"><FileImage className="h-4 w-4" />未確認の処方箋FAX</h2>
        {mockFaxes.filter((f) => f.status === 'unread').map((fax) => (
          <Card key={fax.id} className="border-b-[#2a3553] border-l-4 border-l-rose-500 border-r-[#2a3553] border-t-[#2a3553] bg-[#1a2035]">
            <CardContent className="space-y-1 p-4">
              <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-white">{fax.from}</p><Badge variant="outline" className={cn('border text-xs', faxStatusConfig[fax.status].className)}>{faxStatusConfig[fax.status].label}</Badge></div>
              <p className="text-xs text-gray-400">{fax.receivedAt}受信 / 照合前</p>
              <p className="text-[11px] text-gray-500">このFAXを起点に患者候補を検索して確定します。</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-200"><Users className="h-4 w-4 text-indigo-400" />候補患者一覧</h2>
        {filteredCandidates.map((candidate) => (
          <Card key={candidate.id} className={cn('border-[#2a3553] bg-[#1a2035]', candidate.matchScore >= 80 && 'border-l-4 border-l-emerald-500')}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-white">{candidate.patientName}</p>
                    <Badge variant="outline" className={cn('border text-[10px]', candidate.matchScore >= 80 ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' : candidate.matchScore >= 60 ? 'border-amber-500/40 bg-amber-500/20 text-amber-300' : 'border-gray-500/40 bg-gray-500/20 text-gray-300')}>
                      一致度 {candidate.matchScore}%
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">{candidate.pharmacyName} / {candidate.regionName}</p>
                  <p className="mt-1 text-[11px] text-gray-500">{candidate.reason}</p>
                </div>
                <div className="shrink-0 text-right text-xs text-gray-400">
                  <p>{candidate.distanceKm}km</p>
                  <p>約{candidate.etaMin}分</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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
                <li>デモモードなら上部のロール切替から <strong>regional_admin</strong> / <strong>night_pharmacist</strong> / <strong>pharmacy_admin</strong> などを選ぶ</li>
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
      {(role === 'pharmacy_admin' || role === 'pharmacy_staff') && <PharmacyDashboard isDayPharmacist={role === 'pharmacy_staff'} />}
      {role === 'night_pharmacist' && <PharmacistDashboard />}
    </div>
  )
}
