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
import { adminCardClass, adminPageClass, adminTableClass } from '@/components/admin-ui'
import { Clock3, Plus } from 'lucide-react'
import {
  requestData,
  statusMeta,
  priorityMeta,
} from '@/lib/mock-data'
import type { RequestStatus } from '@/types/database'

type TabKey = 'received' | 'active' | 'completed' | 'all'


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

function getNightNextAction(request: (typeof requestData)[number]) {
  if (request.status === 'fax_pending') {
    return { label: 'FAX受信待ち', href: `/dashboard/requests/${request.id}`, tone: 'muted' as const }
  }
  if (!request.patientId || ['fax_received', 'assigning', 'assigned', 'checklist'].includes(request.status)) {
    return { label: 'FAX確認・患者特定', href: `/dashboard/night-patients?requestId=${request.id}&source=fax`, tone: 'primary' as const }
  }
  if (['dispatched', 'arrived', 'in_progress'].includes(request.status)) {
    return { label: '対応中を確認', href: `/dashboard/requests/${request.id}`, tone: 'secondary' as const }
  }
  return { label: '依頼詳細を開く', href: `/dashboard/requests/${request.id}`, tone: 'secondary' as const }
}

function getNightPharmacistStatus(status: RequestStatus, patientId: string | null) {
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
      label: '受付済み',
      className: 'border-indigo-500/40 bg-indigo-500/20 text-indigo-300',
    }
  }
  if (status === 'fax_received') {
    return {
      label: '患者特定待ち',
      className: 'border-amber-500/40 bg-amber-500/20 text-amber-300',
    }
  }
  if (status === 'fax_pending') {
    return {
      label: 'FAX受信待ち',
      className: 'border-purple-500/40 bg-purple-500/20 text-purple-300',
    }
  }
  return {
    label: '受電済み',
    className: 'border-cyan-500/40 bg-cyan-500/20 text-cyan-300',
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

export default function RequestsPage() {
  const router = useRouter()
  const { role } = useAuth()
  const isAdmin = role === 'regional_admin'
  const isPharmacyAdmin = role === 'pharmacy_admin'
  const isNightPharmacist = role === 'night_pharmacist'
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
    if (isNightPharmacist) {
      return requestData.filter((request) => (request.assigneeId === 'ST-02' || request.assignee === '佐藤 健一') && request.receivedDate === '2026-03-05')
    }
    return requestData
  }, [isNightPharmacist, isPharmacyAdmin])

  const tabItems = useMemo<Array<{ key: TabKey; label: string }>>(() => {
    const receivedCount = visibleRequests.filter((request) =>
      ['received', 'fax_pending', 'fax_received', 'assigning', 'assigned', 'checklist'].includes(request.status)
    ).length
    const activeCount = visibleRequests.filter((request) => ['dispatched', 'arrived', 'in_progress'].includes(request.status)).length
    const completedCount = visibleRequests.filter((request) => request.status === 'completed').length

    return [
      { key: 'received', label: `受付処理中(${receivedCount})` },
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
          <p className="text-xs text-slate-500">{isPharmacyAdmin ? '自局依頼の件数と進行状況を確認。薬局側では進行サマリーのみ表示し、起票や内部進行は regional_admin 側で扱います。' : isNightPharmacist ? '当日分のみ表示します。依頼管理では受付概要だけを確認し、患者特定画面でFAX内容を見ながら患者を確定します。' : '夜間受電依頼の進行状況をリアルタイムで管理'}</p>
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="border-slate-200 bg-white shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-slate-900">{visibleRequests.length}</p><p className="mt-1 text-[11px] text-slate-500">今夜の自局依頼</p></CardContent></Card>
          <Card className="border-amber-200 bg-white shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{visibleRequests.filter((request) => !['dispatched', 'arrived', 'in_progress', 'completed', 'cancelled'].includes(request.status)).length}</p><p className="mt-1 text-[11px] text-slate-500">対応準備中</p></CardContent></Card>
          <Card className="border-sky-200 bg-white shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-sky-600">{visibleRequests.filter((request) => ['dispatched', 'arrived', 'in_progress'].includes(request.status)).length}</p><p className="mt-1 text-[11px] text-slate-500">対応中</p></CardContent></Card>
        </div>
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
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)}>
            <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-lg border border-slate-200 bg-slate-100 p-1">
              {tabItems.map((tab) => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 data-[state=active]:border-indigo-500 data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
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
          const status = isAdmin ? getAdminStatus(request.status, request.patientId) : isPharmacyAdmin ? getPharmacyStatus(request.status) : isNightPharmacist ? getNightPharmacistStatus(request.status, request.patientId) : statusMeta[request.status]
          const priority = priorityMeta[request.priority]
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
                  `${adminCardClass} cursor-pointer border-l-4 transition hover:border-indigo-400`,
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
                  {isNightPharmacist && (
                    <div className="mt-2 space-y-2 text-[11px] text-gray-400">
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
                                    ? 'bg-[#1a2035] text-gray-100 hover:bg-[#24304e]'
                                    : 'bg-[#11182c] text-gray-400 hover:bg-[#1a2035]'
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
              {isNightPharmacist && <TableHead className="text-gray-400">次の操作</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.map((request) => {
              const status = isAdmin ? getAdminStatus(request.status, request.patientId) : isPharmacyAdmin ? getPharmacyStatus(request.status) : isNightPharmacist ? getNightPharmacistStatus(request.status, request.patientId) : statusMeta[request.status]
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
                  onClick={() => { if (!isPharmacyAdmin) router.push(`/dashboard/requests/${request.id}`) }}
                  className={cn('border-slate-200 hover:bg-slate-50', !isPharmacyAdmin && 'cursor-pointer')}
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
                  <TableCell className="max-w-[260px] text-xs text-gray-300">
                    <div className="space-y-1">
                      <p className="truncate">{request.symptom}</p>
                      <div className="flex gap-2 text-[10px]">
                        <span className={request.status === 'fax_pending' ? 'text-purple-300' : 'text-gray-500'}>FAX{request.status === 'fax_pending' ? '待ち' : 'あり'}</span>
                        <span className={request.patientId ? 'text-indigo-300' : 'text-amber-300'}>{request.patientId ? '患者特定済み' : '患者特定待ち'}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-gray-300">{isPharmacyAdmin ? request.timelineEvents[request.timelineEvents.length - 1]?.note ?? '更新待ち' : '詳細は患者特定画面で確認'}</TableCell>
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
                                    ? 'bg-[#1a2035] text-gray-100 hover:bg-[#24304e]'
                                    : 'bg-[#11182c] text-gray-400 hover:bg-[#1a2035]'
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
