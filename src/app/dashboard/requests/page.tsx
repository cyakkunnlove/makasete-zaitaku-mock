'use client'

import { useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
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
import { AlertTriangle, CheckCircle2, Clock3, Plus } from 'lucide-react'
import {
  requestData,
  statusMeta,
  priorityMeta,
} from '@/lib/mock-data'
import type { RequestStatus } from '@/types/database'

type TabKey = 'received' | 'active' | 'completed' | 'all'

const tabItems: Array<{ key: TabKey; label: string }> = [
  { key: 'received', label: '受付/特定(5)' },
  { key: 'active', label: '対応中(3)' },
  { key: 'completed', label: '完了(24)' },
  { key: 'all', label: '全件' },
]

function getAdminStatus(status: RequestStatus, patientId: string | null) {
  if (status === 'completed') {
    return {
      label: '完了',
      className: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
    }
  }
  if (['dispatched', 'arrived', 'in_progress'].includes(status)) {
    return {
      label: '対応中',
      className: 'border-sky-500/40 bg-sky-500/20 text-sky-300',
    }
  }
  if (patientId) {
    return {
      label: '患者特定済',
      className: 'border-indigo-500/40 bg-indigo-500/20 text-indigo-300',
    }
  }
  return {
    label: '受付',
    className: 'border-amber-500/40 bg-amber-500/20 text-amber-300',
  }
}

function getPharmacyStatus(status: RequestStatus) {
  if (status === 'completed') {
    return {
      label: '完了',
      className: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
    }
  }
  if (['dispatched', 'arrived', 'in_progress'].includes(status)) {
    return {
      label: '対応中',
      className: 'border-sky-500/40 bg-sky-500/20 text-sky-300',
    }
  }
  return {
    label: '対応準備中',
    className: 'border-amber-500/40 bg-amber-500/20 text-amber-300',
  }
}

const terminalStatuses: RequestStatus[] = ['completed', 'cancelled']

function getSlaInfo(slaMet: boolean | null, status: RequestStatus) {
  if (slaMet === true) {
    return {
      label: '達成',
      className: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
      icon: CheckCircle2,
    }
  }
  if (slaMet === false) {
    return {
      label: '違反',
      className: 'border-rose-500/40 bg-rose-500/20 text-rose-300',
      icon: AlertTriangle,
    }
  }
  // slaMet === null
  if (terminalStatuses.includes(status)) {
    return null // no badge for completed/cancelled with null SLA
  }
  return {
    label: '計測中',
    className: 'border-amber-500/40 bg-amber-500/20 text-amber-300',
    icon: Clock3,
  }
}

export default function RequestsPage() {
  const router = useRouter()
  const { role } = useAuth()
  const isAdmin = role === 'regional_admin'
  const isPharmacyAdmin = role === 'pharmacy_admin'
  const ownPharmacyId = 'PH-01'
  const [activeTab, setActiveTab] = useState<TabKey>('received')
  const [newRequestOpen, setNewRequestOpen] = useState(false)
  const [formData, setFormData] = useState({
    pharmacy: '',
    patientName: '',
    symptom: '',
    vitalsChange: '',
    consciousness: '',
    urgency: '',
  })

  const canCreateRequest = role === 'regional_admin'

  const visibleRequests = useMemo(() => {
    if (isPharmacyAdmin) {
      return requestData.filter((request) => request.pharmacyId === ownPharmacyId)
    }
    return requestData
  }, [isPharmacyAdmin])

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
    <div className="space-y-4 text-gray-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-white">依頼管理</h1>
          <p className="text-xs text-gray-400">{isPharmacyAdmin ? '自局依頼の件数と進行状況を確認。薬局側では進行サマリーのみ表示し、起票や内部進行は regional_admin 側で扱います。' : '夜間受電依頼の進行状況をリアルタイムで管理'}</p>
        </div>

        {canCreateRequest && (
          <Button
            onClick={() => setNewRequestOpen(true)}
            className="bg-indigo-500 text-white hover:bg-indigo-500/90"
          >
            <Plus className="h-4 w-4" />
            新規依頼
          </Button>
        )}
      </div>

      {isPharmacyAdmin && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-[#2a3553] bg-[#1a2035]"><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-white">{visibleRequests.length}</p><p className="text-[10px] text-gray-500">今夜の自局依頼</p></CardContent></Card>
          <Card className="border-[#2a3553] bg-[#1a2035]"><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-amber-300">{visibleRequests.filter((request) => !['dispatched', 'arrived', 'in_progress', 'completed', 'cancelled'].includes(request.status)).length}</p><p className="text-[10px] text-gray-500">対応準備中</p></CardContent></Card>
          <Card className="border-[#2a3553] bg-[#1a2035]"><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-sky-300">{visibleRequests.filter((request) => ['dispatched', 'arrived', 'in_progress'].includes(request.status)).length}</p><p className="text-[10px] text-gray-500">対応中</p></CardContent></Card>
        </div>
      )}

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">{isPharmacyAdmin ? '自局依頼ステータス' : '依頼ステータス'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)}>
            <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-lg bg-[#11182c] p-1">
              {tabItems.map((tab) => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="rounded-md border border-[#2a3553] bg-[#11182c] px-3 py-1.5 text-xs text-gray-300 data-[state=active]:border-indigo-500 data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
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
        {filteredRequests.map((request) => {
          const status = isAdmin ? getAdminStatus(request.status, request.patientId) : isPharmacyAdmin ? getPharmacyStatus(request.status) : statusMeta[request.status]
          const priority = priorityMeta[request.priority]
          const slaInfo = getSlaInfo(request.slaMet, request.status)
          const patientLabel = isAdmin
            ? request.patientId
              ? '患者特定済'
              : '患者未特定'
            : isPharmacyAdmin
              ? request.id
              : request.patientName ?? '患者未特定'

          return (
            <Link key={request.id} href={isPharmacyAdmin ? '#' : `/dashboard/requests/${request.id}`} onClick={(event) => { if (isPharmacyAdmin) event.preventDefault() }}>
              <Card
                className={cn(
                  'cursor-pointer border border-[#2a3553] bg-[#1a2035] border-l-4 transition hover:border-indigo-500/60',
                  priority.mobileBorder
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">{patientLabel}</p>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">{request.pharmacyName}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={cn('border text-xs', status.className)}>
                        {status.label}
                      </Badge>
                      {slaInfo && (
                        <Badge variant="outline" className={cn('border text-xs', slaInfo.className)}>
                          <slaInfo.icon className="mr-0.5 h-3 w-3" />
                          {slaInfo.label}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-gray-300">
                    <span className="flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5 text-gray-500" />
                      {request.receivedAt}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className={cn('h-2 w-2 rounded-full', priority.dot)} />
                      優先度 {priority.label}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Desktop table view */}
      <Card className="hidden border-[#2a3553] bg-[#1a2035] lg:block">
        <Table>
          <TableHeader>
            <TableRow className="border-[#2a3553] hover:bg-[#1a2035]">
              <TableHead className="text-gray-400">優先度</TableHead>
              <TableHead className="text-gray-400">受付時刻</TableHead>
              <TableHead className="text-gray-400">{isAdmin ? '患者特定' : isPharmacyAdmin ? '依頼番号' : '患者名'}</TableHead>
              <TableHead className="text-gray-400">薬局名</TableHead>
              <TableHead className="text-gray-400">ステータス</TableHead>
              <TableHead className="text-gray-400">SLA</TableHead>
              <TableHead className="text-gray-400">{isPharmacyAdmin ? '最終状況' : '担当者'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.map((request) => {
              const status = isAdmin ? getAdminStatus(request.status, request.patientId) : isPharmacyAdmin ? getPharmacyStatus(request.status) : statusMeta[request.status]
              const priority = priorityMeta[request.priority]
              const slaInfo = getSlaInfo(request.slaMet, request.status)
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
                  onClick={() => { if (!isPharmacyAdmin) router.push(`/dashboard/requests/${request.id}`) }}
                  className={cn('border-[#2a3553] hover:bg-[#11182c]', !isPharmacyAdmin && 'cursor-pointer')}
                >
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <span className={cn('h-2.5 w-2.5 rounded-full', priority.dot)} />
                      <span className="text-xs text-gray-300">{priority.label}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-200">{request.receivedAt}</TableCell>
                  <TableCell>
                    {isPharmacyAdmin ? (
                      <span className="inline-flex items-center gap-2 text-gray-200">{patientLabel}</span>
                    ) : (
                      <Link href={`/dashboard/requests/${request.id}`} className="text-gray-200 hover:text-indigo-300">
                        <span className="inline-flex items-center gap-2">
                          {patientLabel}
                        </span>
                      </Link>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-300">{request.pharmacyName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('border text-xs', status.className)}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {slaInfo ? (
                      <Badge variant="outline" className={cn('border text-xs', slaInfo.className)}>
                        <slaInfo.icon className="mr-0.5 h-3 w-3" />
                        {slaInfo.label}
                      </Badge>
                    ) : (
                      <span className="text-xs text-gray-500">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-300">{isPharmacyAdmin ? request.timelineEvents[request.timelineEvents.length - 1]?.note ?? '更新待ち' : request.assignee}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={newRequestOpen} onOpenChange={setNewRequestOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-[#2a3553] bg-[#11182c] text-gray-100 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-white">新規依頼登録</DialogTitle>
            <DialogDescription className="text-gray-400">
              夜間受電内容を入力して依頼を起票します。
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmitNewRequest}>
            <div className="space-y-2">
              <Label className="text-gray-200">薬局選択</Label>
              <Select value={formData.pharmacy} onValueChange={(value) => setFormData((prev) => ({ ...prev, pharmacy: value }))}>
                <SelectTrigger className="border-[#2a3553] bg-[#1a2035] text-gray-100">
                  <SelectValue placeholder="薬局を選択" />
                </SelectTrigger>
                <SelectContent className="border-[#2a3553] bg-[#11182c] text-gray-100">
                  <SelectItem value="城南みらい薬局">城南みらい薬局</SelectItem>
                  <SelectItem value="神田中央薬局">神田中央薬局</SelectItem>
                  <SelectItem value="西新宿いろは薬局">西新宿いろは薬局</SelectItem>
                  <SelectItem value="世田谷つばさ薬局">世田谷つばさ薬局</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-200">患者名</Label>
              <Input
                value={formData.patientName}
                onChange={(event) => setFormData((prev) => ({ ...prev, patientName: event.target.value }))}
                className="border-[#2a3553] bg-[#1a2035] text-gray-100"
                placeholder="例: 田中 優子"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-200">症状</Label>
              <Textarea
                value={formData.symptom}
                onChange={(event) => setFormData((prev) => ({ ...prev, symptom: event.target.value }))}
                className="border-[#2a3553] bg-[#1a2035] text-gray-100"
                placeholder="主訴を入力"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-200">バイタル変化</Label>
              <Textarea
                value={formData.vitalsChange}
                onChange={(event) => setFormData((prev) => ({ ...prev, vitalsChange: event.target.value }))}
                className="border-[#2a3553] bg-[#1a2035] text-gray-100"
                placeholder="血圧、体温、SpO2など"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-gray-200">意識レベル</Label>
                <Select
                  value={formData.consciousness}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, consciousness: value }))}
                >
                  <SelectTrigger className="border-[#2a3553] bg-[#1a2035] text-gray-100">
                    <SelectValue placeholder="選択" />
                  </SelectTrigger>
                  <SelectContent className="border-[#2a3553] bg-[#11182c] text-gray-100">
                    <SelectItem value="清明">清明</SelectItem>
                    <SelectItem value="やや傾眠">やや傾眠</SelectItem>
                    <SelectItem value="混濁">混濁</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-200">緊急度</Label>
                <Select value={formData.urgency} onValueChange={(value) => setFormData((prev) => ({ ...prev, urgency: value }))}>
                  <SelectTrigger className="border-[#2a3553] bg-[#1a2035] text-gray-100">
                    <SelectValue placeholder="選択" />
                  </SelectTrigger>
                  <SelectContent className="border-[#2a3553] bg-[#11182c] text-gray-100">
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
                className="border-[#2a3553] bg-[#1a2035] text-gray-200 hover:bg-[#212b45]"
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
