'use client'

import { useMemo, useState, type FormEvent } from 'react'
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
import { CircleAlert, Clock3, Plus } from 'lucide-react'

interface RequestItem {
  id: string
  receivedAt: string
  patientName: string
  pharmacyName: string
  status: RequestStatus
  priority: RequestPriority
  assignee: string
  symptom: string
  vitalsChange: string
  consciousness: string
  urgency: string
}

type TabKey = 'received' | 'active' | 'completed' | 'all'

const tabItems: Array<{ key: TabKey; label: string }> = [
  { key: 'received', label: '受付中(5)' },
  { key: 'active', label: '対応中(3)' },
  { key: 'completed', label: '完了(24)' },
  { key: 'all', label: '全件' },
]

const requestFlow = ['受付', 'FAX', 'アサイン', '出発', '到着', '対応中', '完了']

const requestStepIndex: Record<RequestStatus, number> = {
  received: 0,
  fax_pending: 0,
  fax_received: 1,
  assigning: 2,
  assigned: 2,
  checklist: 2,
  dispatched: 3,
  arrived: 4,
  in_progress: 5,
  completed: 6,
  cancelled: 0,
}

const statusMeta: Record<RequestStatus, { label: string; className: string }> = {
  received: { label: '受付', className: 'border-sky-500/40 bg-sky-500/20 text-sky-300' },
  fax_pending: { label: 'FAX待ち', className: 'border-purple-500/40 bg-purple-500/20 text-purple-300' },
  fax_received: { label: 'FAX受領', className: 'border-indigo-500/40 bg-indigo-500/20 text-indigo-300' },
  assigning: { label: 'アサイン中', className: 'border-amber-500/40 bg-amber-500/20 text-amber-300' },
  assigned: { label: 'アサイン済', className: 'border-cyan-500/40 bg-cyan-500/20 text-cyan-300' },
  checklist: { label: '確認中', className: 'border-cyan-500/40 bg-cyan-500/20 text-cyan-300' },
  dispatched: { label: '出動中', className: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' },
  arrived: { label: '到着', className: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' },
  in_progress: { label: '対応中', className: 'border-amber-500/40 bg-amber-500/20 text-amber-300' },
  completed: { label: '完了', className: 'border-gray-500/50 bg-gray-500/20 text-gray-300' },
  cancelled: { label: 'キャンセル', className: 'border-rose-500/40 bg-rose-500/20 text-rose-300' },
}

const priorityMeta: Record<RequestPriority, { label: string; dot: string; mobileBorder: string }> = {
  high: { label: '高', dot: 'bg-rose-400', mobileBorder: 'border-l-rose-500' },
  normal: { label: '中', dot: 'bg-amber-400', mobileBorder: 'border-l-amber-400' },
  low: { label: '低', dot: 'bg-sky-400', mobileBorder: 'border-l-sky-400' },
}

const requestData: RequestItem[] = [
  {
    id: 'RQ-2401',
    receivedAt: '22:14',
    patientName: '田中 優子',
    pharmacyName: '城南みらい薬局',
    status: 'received',
    priority: 'high',
    assignee: '未割当',
    symptom: '悪寒と発熱（38.5℃）',
    vitalsChange: '体温上昇、脈拍110/分',
    consciousness: '清明',
    urgency: '高',
  },
  {
    id: 'RQ-2402',
    receivedAt: '22:28',
    patientName: '小川 正子',
    pharmacyName: '港北さくら薬局',
    status: 'fax_pending',
    priority: 'normal',
    assignee: '未割当',
    symptom: '吐き気と食欲低下',
    vitalsChange: '血圧100/60まで低下',
    consciousness: 'やや傾眠',
    urgency: '中',
  },
  {
    id: 'RQ-2403',
    receivedAt: '22:46',
    patientName: '林 恒一',
    pharmacyName: '神田中央薬局',
    status: 'assigning',
    priority: 'high',
    assignee: '佐藤 健一',
    symptom: '呼吸苦の訴え',
    vitalsChange: 'SpO2 91%へ低下',
    consciousness: '清明',
    urgency: '高',
  },
  {
    id: 'RQ-2404',
    receivedAt: '23:05',
    patientName: '渡辺 美和',
    pharmacyName: '西新宿いろは薬局',
    status: 'assigned',
    priority: 'normal',
    assignee: '高橋 奈央',
    symptom: '疼痛コントロール不良',
    vitalsChange: '痛みスコア上昇',
    consciousness: '清明',
    urgency: '中',
  },
  {
    id: 'RQ-2405',
    receivedAt: '23:22',
    patientName: '山本 直子',
    pharmacyName: '世田谷つばさ薬局',
    status: 'fax_received',
    priority: 'normal',
    assignee: '未割当',
    symptom: '下痢・脱水傾向',
    vitalsChange: '尿量減少',
    consciousness: '清明',
    urgency: '中',
  },
  {
    id: 'RQ-2406',
    receivedAt: '23:31',
    patientName: '清水 恒一',
    pharmacyName: '中野しらさぎ薬局',
    status: 'in_progress',
    priority: 'high',
    assignee: '佐藤 健一',
    symptom: 'せん妄症状の増悪',
    vitalsChange: '脈拍増加、発汗',
    consciousness: '混濁',
    urgency: '高',
  },
  {
    id: 'RQ-2407',
    receivedAt: '23:40',
    patientName: '橋本 和子',
    pharmacyName: '池袋みどり薬局',
    status: 'arrived',
    priority: 'normal',
    assignee: '高橋 奈央',
    symptom: '嘔吐後のふらつき',
    vitalsChange: '血圧92/54',
    consciousness: '清明',
    urgency: '中',
  },
  {
    id: 'RQ-2408',
    receivedAt: '23:52',
    patientName: '井上 恒一',
    pharmacyName: '江東あおぞら薬局',
    status: 'dispatched',
    priority: 'normal',
    assignee: '山口 美咲',
    symptom: '血糖コントロール悪化',
    vitalsChange: '血糖値312mg/dL',
    consciousness: '清明',
    urgency: '中',
  },
  {
    id: 'RQ-2409',
    receivedAt: '00:03',
    patientName: '高田 恒一',
    pharmacyName: '渋谷ひまわり薬局',
    status: 'completed',
    priority: 'low',
    assignee: '山口 美咲',
    symptom: '軽度発熱',
    vitalsChange: '体温37.5℃',
    consciousness: '清明',
    urgency: '低',
  },
  {
    id: 'RQ-2410',
    receivedAt: '00:11',
    patientName: '森田 恒一',
    pharmacyName: '吉祥寺つばめ薬局',
    status: 'completed',
    priority: 'normal',
    assignee: '佐々木 翔',
    symptom: '夜間痛の増強',
    vitalsChange: '疼痛スケール 8/10',
    consciousness: '清明',
    urgency: '中',
  },
]

export default function RequestsPage() {
  const { role } = useAuth()
  const [activeTab, setActiveTab] = useState<TabKey>('received')
  const [newRequestOpen, setNewRequestOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null)
  const [formData, setFormData] = useState({
    pharmacy: '',
    patientName: '',
    symptom: '',
    vitalsChange: '',
    consciousness: '',
    urgency: '',
  })

  const canCreateRequest = role !== 'pharmacist'

  const filteredRequests = useMemo(() => {
    switch (activeTab) {
      case 'received':
        return requestData.filter((request) =>
          ['received', 'fax_pending', 'fax_received', 'assigning', 'assigned', 'checklist'].includes(
            request.status
          )
        )
      case 'active':
        return requestData.filter((request) => ['dispatched', 'arrived', 'in_progress'].includes(request.status))
      case 'completed':
        return requestData.filter((request) => request.status === 'completed')
      default:
        return requestData
    }
  }, [activeTab])

  const selectedStep = selectedRequest ? requestStepIndex[selectedRequest.status] : 0

  const handleSubmitNewRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNewRequestOpen(false)
  }

  return (
    <div className="space-y-4 text-gray-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-white">依頼管理</h1>
          <p className="text-xs text-gray-400">夜間受電依頼の進行状況をリアルタイムで管理</p>
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

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">依頼ステータス</CardTitle>
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

      <div className="lg:hidden space-y-3">
        {filteredRequests.map((request) => {
          const status = statusMeta[request.status]
          const priority = priorityMeta[request.priority]

          return (
            <Card
              key={request.id}
              onClick={() => setSelectedRequest(request)}
              className={cn(
                'cursor-pointer border border-[#2a3553] bg-[#1a2035] border-l-4 transition hover:border-indigo-500/60',
                priority.mobileBorder
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{request.patientName}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{request.pharmacyName}</p>
                  </div>
                  <Badge variant="outline" className={cn('border text-xs', status.className)}>
                    {status.label}
                  </Badge>
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
          )
        })}
      </div>

      <Card className="hidden border-[#2a3553] bg-[#1a2035] lg:block">
        <Table>
          <TableHeader>
            <TableRow className="border-[#2a3553] hover:bg-[#1a2035]">
              <TableHead className="text-gray-400">優先度</TableHead>
              <TableHead className="text-gray-400">受付時刻</TableHead>
              <TableHead className="text-gray-400">患者名</TableHead>
              <TableHead className="text-gray-400">薬局名</TableHead>
              <TableHead className="text-gray-400">ステータス</TableHead>
              <TableHead className="text-gray-400">担当者</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.map((request) => {
              const status = statusMeta[request.status]
              const priority = priorityMeta[request.priority]

              return (
                <TableRow
                  key={request.id}
                  onClick={() => setSelectedRequest(request)}
                  className="cursor-pointer border-[#2a3553] hover:bg-[#11182c]"
                >
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <span className={cn('h-2.5 w-2.5 rounded-full', priority.dot)} />
                      <span className="text-xs text-gray-300">{priority.label}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-200">{request.receivedAt}</TableCell>
                  <TableCell className="text-gray-200">{request.patientName}</TableCell>
                  <TableCell className="text-gray-300">{request.pharmacyName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('border text-xs', status.className)}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-300">{request.assignee}</TableCell>
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

      <Dialog open={Boolean(selectedRequest)} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-[#2a3553] bg-[#11182c] text-gray-100 sm:max-w-3xl">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">依頼詳細: {selectedRequest.id}</DialogTitle>
                <DialogDescription className="text-gray-400">
                  {selectedRequest.pharmacyName} / {selectedRequest.patientName}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div className="overflow-x-auto pb-1">
                  <div className="flex min-w-[680px] items-center gap-2">
                    {requestFlow.map((step, index) => {
                      const reached = index <= selectedStep
                      return (
                        <div key={step} className="flex items-center gap-2">
                          <div className="flex flex-col items-center gap-1">
                            <div
                              className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold',
                                reached
                                  ? 'border-indigo-500 bg-indigo-500 text-white'
                                  : 'border-[#2a3553] bg-[#1a2035] text-gray-400'
                              )}
                            >
                              {index + 1}
                            </div>
                            <span className={cn('text-[11px]', reached ? 'text-indigo-300' : 'text-gray-500')}>
                              {step}
                            </span>
                          </div>
                          {index < requestFlow.length - 1 && (
                            <div
                              className={cn(
                                'h-px w-8',
                                index < selectedStep ? 'bg-indigo-500' : 'bg-[#2a3553]'
                              )}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <Card className="border-[#2a3553] bg-[#1a2035]">
                  <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-gray-400">受付時刻</p>
                      <p className="mt-1 text-sm text-white">{selectedRequest.receivedAt}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">担当者</p>
                      <p className="mt-1 text-sm text-white">{selectedRequest.assignee}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">症状</p>
                      <p className="mt-1 text-sm text-white">{selectedRequest.symptom}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">バイタル変化</p>
                      <p className="mt-1 text-sm text-white">{selectedRequest.vitalsChange}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">意識レベル</p>
                      <p className="mt-1 text-sm text-white">{selectedRequest.consciousness}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">緊急度</p>
                      <p className="mt-1 flex items-center gap-1 text-sm text-white">
                        <CircleAlert className="h-4 w-4 text-amber-400" />
                        {selectedRequest.urgency}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
