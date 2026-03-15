'use client'

import { useMemo, useState } from 'react'
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
import { CheckCircle, FileText, Layers, Link2 } from 'lucide-react'

import { billingData, dayTaskData, patientData, type BillingRecord } from '@/lib/mock-data'

const statusClass: Record<BillingStatus, string> = {
  paid: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
  unpaid: 'border-amber-500/40 bg-amber-500/20 text-amber-300',
  overdue: 'border-rose-500/40 bg-rose-500/20 text-rose-300',
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

const initialPatientCollectionRecords = [
  { id: 'COL-01', patientName: '田中 優子', month: '2026-03', amount: 12800, status: 'paid' as BillingStatus, dueDate: '2026-03-10', note: '口座振替完了', linkedTaskId: 'DT-260315-01', handledBy: '小林 薫', handledAt: '2026-03-15 10:28', billable: true },
  { id: 'COL-02', patientName: '清水 恒一', month: '2026-03', amount: 9400, status: 'unpaid' as BillingStatus, dueDate: '2026-03-12', note: '電話フォロー予定', linkedTaskId: 'DT-260315-02', handledBy: '小林 薫', handledAt: '2026-03-15 11:58', billable: true },
  { id: 'COL-03', patientName: '小川 正子', month: '2026-03', amount: 15600, status: 'overdue' as BillingStatus, dueDate: '2026-03-05', note: '再請求書送付待ち', linkedTaskId: 'DT-260315-03', handledBy: null, handledAt: null, billable: false },
]

export default function BillingPage() {
  const { role } = useAuth()
  const [records, setRecords] = useState<BillingRecord[]>(billingData)
  const [collectionRecords, setCollectionRecords] = useState(initialPatientCollectionRecords)
  const [selectedRecord, setSelectedRecord] = useState<BillingRecord | null>(null)
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)
  const [batchMonth, setBatchMonth] = useState('2026-03')
  const [generatedLabel, setGeneratedLabel] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const ownPharmacyId = 'PH-01'

  const ownPatients = useMemo(() => patientData.filter((patient) => patient.pharmacyId === ownPharmacyId), [ownPharmacyId])
  const ownPatientNames = useMemo(() => new Set(ownPatients.map((patient) => patient.name)), [ownPatients])

  const dayTaskCollectionRecords = useMemo(() => {
    return dayTaskData
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
  }, [ownPatientNames, ownPharmacyId])

  const mergedCollectionRecords = useMemo(() => {
    const manualOnly = collectionRecords.filter((record) => !dayTaskCollectionRecords.some((taskRecord) => taskRecord.linkedTaskId === record.linkedTaskId))
    return [...dayTaskCollectionRecords, ...manualOnly]
  }, [collectionRecords, dayTaskCollectionRecords])

  const summary = useMemo(() => {
    const source = role === 'pharmacy_staff'
      ? mergedCollectionRecords.filter((r) => r.billable).map((r) => ({ total: r.amount, status: r.status }))
      : records.map((r) => ({ total: r.total, status: r.status }))
    const totalBilled = source.reduce((sum, record) => sum + record.total, 0)
    const collected = source.filter((record) => record.status === 'paid').reduce((sum, record) => sum + record.total, 0)
    const outstanding = source.filter((record) => record.status !== 'paid').reduce((sum, record) => sum + record.total, 0)

    return { totalBilled, collected, outstanding }
  }, [records, mergedCollectionRecords, role])

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

  if (role === 'pharmacy_staff') {
    return (
      <div className="space-y-4 text-gray-100">
        <div>
          <h1 className="text-lg font-semibold text-white">回収管理</h1>
          <p className="text-xs text-gray-400">day task の handled-by / handled-at / billable と紐づいた回収候補を管理</p>
        </div>
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="border-[#2a3553] bg-[#1a2035]"><CardHeader className="pb-2"><CardDescription className="text-gray-400">請求総額</CardDescription><CardTitle className="text-xl text-white">{yen.format(summary.totalBilled)}</CardTitle></CardHeader></Card>
          <Card className="border-[#2a3553] bg-[#1a2035]"><CardHeader className="pb-2"><CardDescription className="text-gray-400">回収済み</CardDescription><CardTitle className="text-xl text-emerald-300">{yen.format(summary.collected)}</CardTitle></CardHeader></Card>
          <Card className="border-[#2a3553] bg-[#1a2035]"><CardHeader className="pb-2"><CardDescription className="text-gray-400">未回収</CardDescription><CardTitle className="text-xl text-amber-300">{yen.format(summary.outstanding)}</CardTitle></CardHeader></Card>
        </section>

        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4 text-xs text-gray-300">
            <span>day_pharmacist の完了タスクが billable になると、ここで linked task として見える想定です。</span>
            <Badge variant="outline" className="border-indigo-500/40 bg-indigo-500/20 text-indigo-300">mock linkage</Badge>
          </CardContent>
        </Card>

        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2a3553] hover:bg-[#1a2035]">
                  <TableHead className="text-gray-400">患者名</TableHead>
                  <TableHead className="text-gray-400">day task</TableHead>
                  <TableHead className="text-gray-400">handled-by / at</TableHead>
                  <TableHead className="text-gray-400">billable</TableHead>
                  <TableHead className="text-right text-gray-400">請求額</TableHead>
                  <TableHead className="text-gray-400">状態</TableHead>
                  <TableHead className="text-right text-gray-400">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mergedCollectionRecords.map((record) => (
                  <TableRow key={record.id} className="border-[#2a3553] hover:bg-[#11182c]">
                    <TableCell className="font-medium text-white">{record.patientName}</TableCell>
                    <TableCell className="text-xs text-gray-300">
                      <div className="flex items-center gap-1">
                        <Link2 className="h-3.5 w-3.5 text-indigo-300" />
                        {record.linkedTaskId}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-300">
                      <p>{record.handledBy ?? '未対応'}</p>
                      <p className="text-gray-500">{record.handledAt ?? '—'}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('border text-xs', record.billable ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' : 'border-gray-500/40 bg-gray-500/20 text-gray-300')}>
                        {record.billable ? '請求対象' : '未計上'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-gray-300">
                      <Input type="number" value={record.amount} onChange={(e) => setCollectionRecords((prev) => prev.map((r) => r.id === record.id ? { ...r, amount: Number(e.target.value) || 0 } : r))} className="h-8 w-28 border-[#2a3553] bg-[#11182c] text-right" disabled={!record.billable} />
                    </TableCell>
                    <TableCell><Badge variant="outline" className={cn('border text-xs', statusClass[record.status])}>{statusLabel[record.status]}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {record.billable && record.status !== 'paid' && <Button size="sm" variant="ghost" onClick={() => updateCollectionStatus(record.id, 'paid')} className="text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200">入金確認</Button>}
                        {record.billable && record.status === 'unpaid' && <Button size="sm" variant="ghost" onClick={() => updateCollectionStatus(record.id, 'overdue')} className="text-amber-300 hover:bg-amber-500/10 hover:text-amber-200">期限超過へ</Button>}
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
    <div className="space-y-4 text-gray-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-white">請求管理</h1>
          <p className="text-xs text-gray-400">加盟店ごとの月次請求と回収状況を確認</p>
        </div>

        {role === 'regional_admin' && (
          <Button onClick={() => setBatchDialogOpen(true)} className="bg-indigo-500 text-white hover:bg-indigo-500/90">
            <Layers className="h-4 w-4" />
            一括請求書生成
          </Button>
        )}
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-[#2a3553] bg-[#1a2035]"><CardHeader className="pb-2"><CardDescription className="text-gray-400">請求総額</CardDescription><CardTitle className="text-xl text-white">{yen.format(summary.totalBilled)}</CardTitle></CardHeader></Card>
        <Card className="border-[#2a3553] bg-[#1a2035]"><CardHeader className="pb-2"><CardDescription className="text-gray-400">回収済み</CardDescription><CardTitle className="text-xl text-emerald-300">{yen.format(summary.collected)}</CardTitle></CardHeader></Card>
        <Card className="border-[#2a3553] bg-[#1a2035]"><CardHeader className="pb-2"><CardDescription className="text-gray-400">未回収</CardDescription><CardTitle className="text-xl text-amber-300">{yen.format(summary.outstanding)}</CardTitle></CardHeader></Card>
      </section>

      {generatedLabel && <Card className="border-[#2a3553] bg-[#11182c]"><CardContent className="p-3 text-sm text-indigo-300">{generatedLabel}</CardContent></Card>}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-4 py-3 text-sm font-medium text-emerald-300 shadow-lg backdrop-blur-sm">
          <CheckCircle className="h-4 w-4" />
          {toastMessage}
        </div>
      )}

      <div className="space-y-3 lg:hidden">
        {records.map((record) => (
          <Card key={record.id} className="border-[#2a3553] bg-[#1a2035]">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-semibold text-white">{record.pharmacyName}</p>
                  <p className="text-xs text-gray-400">{record.month} 請求</p>
                </div>
                <Badge variant="outline" className={cn('border text-xs', statusClass[record.status])}>{statusLabel[record.status]}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                <div><p>請求書番号</p><p className="mt-1 text-gray-200">{record.invoiceNumber}</p></div>
                <div><p>合計</p><p className="mt-1 text-gray-200">{yen.format(record.total)}</p></div>
                <div><p>SaaS</p><p className="mt-1 text-gray-200">{yen.format(record.saasFee)}</p></div>
                <div><p>夜間連携</p><p className="mt-1 text-gray-200">{yen.format(record.nightFee)}</p></div>
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

      <Card className="hidden border-[#2a3553] bg-[#1a2035] lg:block">
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
                      {record.status !== 'paid' && <Button size="sm" onClick={() => handlePaymentConfirm(record.id, record.pharmacyName)} className="bg-emerald-600 text-white hover:bg-emerald-600/90">入金確認</Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent className="border-[#2a3553] bg-[#11182c] text-gray-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">一括請求書生成</DialogTitle>
            <DialogDescription className="text-gray-400">対象月を選ぶとモック請求書を生成します。</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-xs text-gray-400">対象月</p>
            <Input value={batchMonth} onChange={(e) => setBatchMonth(e.target.value)} className="border-[#2a3553] bg-[#1a2035]" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setBatchDialogOpen(false)}>キャンセル</Button>
            <Button type="button" onClick={handleBatchGenerate} className="bg-indigo-500 text-white hover:bg-indigo-500/90">生成する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="border-[#2a3553] bg-[#11182c] text-gray-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">請求詳細</DialogTitle>
            <DialogDescription className="text-gray-400">{selectedRecord?.pharmacyName} / {selectedRecord?.month}</DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-3 text-sm text-gray-300">
              <div className="rounded-lg border border-[#2a3553] bg-[#1a2035] p-4">
                <p>請求書番号: <span className="text-white">{selectedRecord.invoiceNumber}</span></p>
                <p className="mt-1">SaaS: <span className="text-white">{yen.format(selectedRecord.saasFee)}</span></p>
                <p className="mt-1">夜間連携: <span className="text-white">{yen.format(selectedRecord.nightFee)}</span></p>
                <p className="mt-1">消費税: <span className="text-white">{yen.format(selectedRecord.tax)}</span></p>
                <p className="mt-1">合計: <span className="text-white">{yen.format(selectedRecord.total)}</span></p>
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
