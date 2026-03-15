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
import { CheckCircle, FileText, Layers } from 'lucide-react'

import { billingData, type BillingRecord } from '@/lib/mock-data'

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

const patientCollectionRecords = [
  { id: 'COL-01', patientName: '田中 優子', month: '2026-03', amount: 12800, status: 'paid' as BillingStatus, dueDate: '2026-03-10', note: '口座振替完了' },
  { id: 'COL-02', patientName: '清水 恒一', month: '2026-03', amount: 9400, status: 'unpaid' as BillingStatus, dueDate: '2026-03-12', note: '電話フォロー予定' },
  { id: 'COL-03', patientName: '小川 正子', month: '2026-03', amount: 15600, status: 'overdue' as BillingStatus, dueDate: '2026-03-05', note: '再請求書送付待ち' },
]

export default function BillingPage() {
  const { role } = useAuth()
  const [records, setRecords] = useState<BillingRecord[]>(billingData)
  const [collectionRecords, setCollectionRecords] = useState(patientCollectionRecords)
  const [selectedRecord, setSelectedRecord] = useState<BillingRecord | null>(null)
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)
  const [batchMonth, setBatchMonth] = useState('2026-03')
  const [generatedLabel, setGeneratedLabel] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  const summary = useMemo(() => {
    const source = role === 'pharmacy_staff'
      ? collectionRecords.map((r) => ({ total: r.amount, status: r.status }))
      : records.map((r) => ({ total: r.total, status: r.status }))
    const totalBilled = source.reduce((sum, record) => sum + record.total, 0)
    const collected = source.filter((record) => record.status === 'paid').reduce((sum, record) => sum + record.total, 0)
    const outstanding = source.filter((record) => record.status !== 'paid').reduce((sum, record) => sum + record.total, 0)

    return { totalBilled, collected, outstanding }
  }, [records, collectionRecords, role])

  const handleBatchGenerate = () => {
    setGeneratedLabel(`${batchMonth} の請求書を ${records.length} 件生成しました（モック）`)
    setBatchDialogOpen(false)
  }

  const handlePaymentConfirm = (recordId: string, pharmacyName: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, status: 'paid' as BillingStatus } : r))
    )
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
          <p className="text-xs text-gray-400">患者への請求・未回収・入金確認を管理</p>
        </div>
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="border-[#2a3553] bg-[#1a2035]"><CardHeader className="pb-2"><CardDescription className="text-gray-400">請求総額</CardDescription><CardTitle className="text-xl text-white">{yen.format(summary.totalBilled)}</CardTitle></CardHeader></Card>
          <Card className="border-[#2a3553] bg-[#1a2035]"><CardHeader className="pb-2"><CardDescription className="text-gray-400">回収済み</CardDescription><CardTitle className="text-xl text-emerald-300">{yen.format(summary.collected)}</CardTitle></CardHeader></Card>
          <Card className="border-[#2a3553] bg-[#1a2035]"><CardHeader className="pb-2"><CardDescription className="text-gray-400">未回収</CardDescription><CardTitle className="text-xl text-amber-300">{yen.format(summary.outstanding)}</CardTitle></CardHeader></Card>
        </section>
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2a3553] hover:bg-[#1a2035]">
                  <TableHead className="text-gray-400">患者名</TableHead>
                  <TableHead className="text-gray-400">対象月</TableHead>
                  <TableHead className="text-right text-gray-400">請求額</TableHead>
                  <TableHead className="text-gray-400">期限</TableHead>
                  <TableHead className="text-gray-400">状態</TableHead>
                  <TableHead className="text-right text-gray-400">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collectionRecords.map((record) => (
                  <TableRow key={record.id} className="border-[#2a3553] hover:bg-[#11182c]">
                    <TableCell className="font-medium text-white">{record.patientName}</TableCell>
                    <TableCell className="text-gray-300">{record.month}</TableCell>
                    <TableCell className="text-right text-gray-300">{yen.format(record.amount)}</TableCell>
                    <TableCell className="text-gray-300">{record.dueDate}</TableCell>
                    <TableCell><Badge variant="outline" className={cn('border text-xs', statusClass[record.status])}>{statusLabel[record.status]}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {record.status !== 'paid' && <Button size="sm" variant="ghost" onClick={() => updateCollectionStatus(record.id, 'paid')} className="text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200">入金確認</Button>}
                        {record.status === 'unpaid' && <Button size="sm" variant="ghost" onClick={() => updateCollectionStatus(record.id, 'overdue')} className="text-amber-300 hover:bg-amber-500/10 hover:text-amber-200">期限超過へ</Button>}
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
          <Button
            onClick={() => setBatchDialogOpen(true)}
            className="bg-indigo-500 text-white hover:bg-indigo-500/90"
          >
            <Layers className="h-4 w-4" />
            一括請求書生成
          </Button>
        )}
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-400">請求総額</CardDescription>
            <CardTitle className="text-xl text-white">{yen.format(summary.totalBilled)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-400">回収済み</CardDescription>
            <CardTitle className="text-xl text-emerald-300">{yen.format(summary.collected)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-400">未回収</CardDescription>
            <CardTitle className="text-xl text-amber-300">{yen.format(summary.outstanding)}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      {generatedLabel && (
        <Card className="border-[#2a3553] bg-[#11182c]">
          <CardContent className="p-3 text-sm text-indigo-300">{generatedLabel}</CardContent>
        </Card>
      )}

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-4 py-3 text-sm font-medium text-emerald-300 shadow-lg backdrop-blur-sm">
          <CheckCircle className="h-4 w-4" />
          {toastMessage}
        </div>
      )}

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {records.map((record) => (
          <Card key={record.id} className="border-[#2a3553] bg-[#1a2035]">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-semibold text-white">{record.pharmacyName}</p>
                  <p className="text-xs text-gray-400">{record.month} 請求</p>
                </div>
                <Badge variant="outline" className={cn('border text-xs', statusClass[record.status])}>
                  {statusLabel[record.status]}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                <p>SaaS料: {yen.format(record.saasFee)}</p>
                <p>夜間連携: {yen.format(record.nightFee)}</p>
                <p>税: {yen.format(record.tax)}</p>
                <p className="font-semibold text-gray-100">合計: {yen.format(record.total)}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => setSelectedRecord(record)}
                  className="flex-1 bg-[#2a3553] text-white hover:bg-[#334166]"
                >
                  <FileText className="h-4 w-4" />
                  請求書PDFプレビュー
                </Button>
                {role === 'regional_admin' && record.status !== 'paid' && (
                  <Button
                    size="sm"
                    onClick={() => handlePaymentConfirm(record.id, record.pharmacyName)}
                    className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                  >
                    <CheckCircle className="h-4 w-4" />
                    入金確認
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop table */}
      <Card className="hidden border-[#2a3553] bg-[#1a2035] lg:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[#2a3553] hover:bg-[#1a2035]">
                <TableHead className="text-gray-400">薬局名</TableHead>
                <TableHead className="text-gray-400">請求月</TableHead>
                <TableHead className="text-right text-gray-400">SaaS料金</TableHead>
                <TableHead className="text-right text-gray-400">夜間連携</TableHead>
                <TableHead className="text-right text-gray-400">税</TableHead>
                <TableHead className="text-right text-gray-400">合計</TableHead>
                <TableHead className="text-gray-400">状態</TableHead>
                <TableHead className="text-right text-gray-400">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id} className="border-[#2a3553] hover:bg-[#11182c]">
                  <TableCell className="font-medium text-white">{record.pharmacyName}</TableCell>
                  <TableCell className="text-gray-300">{record.month}</TableCell>
                  <TableCell className="text-right text-gray-300">{yen.format(record.saasFee)}</TableCell>
                  <TableCell className="text-right text-gray-300">{yen.format(record.nightFee)}</TableCell>
                  <TableCell className="text-right text-gray-300">{yen.format(record.tax)}</TableCell>
                  <TableCell className="text-right font-semibold text-gray-100">
                    {yen.format(record.total)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('border text-xs', statusClass[record.status])}>
                      {statusLabel[record.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedRecord(record)}
                        className="text-indigo-300 hover:bg-indigo-500/10 hover:text-indigo-200"
                      >
                        PDFプレビュー
                      </Button>
                      {role === 'regional_admin' && record.status !== 'paid' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePaymentConfirm(record.id, record.pharmacyName)}
                          className="text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200"
                        >
                          入金確認
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Batch generation dialog */}
      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent className="border-[#2a3553] bg-[#11182c] text-gray-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">請求書一括生成</DialogTitle>
            <DialogDescription className="text-gray-400">
              対象月を選択して全加盟店の請求書を生成します。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <label className="block space-y-2 text-sm">
              <span className="text-gray-300">対象月</span>
              <Input
                type="month"
                value={batchMonth}
                onChange={(event) => setBatchMonth(event.target.value)}
                className="border-[#2a3553] bg-[#1a2035]"
              />
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setBatchDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleBatchGenerate} className="bg-indigo-500 text-white hover:bg-indigo-500/90">
              生成する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF preview dialog */}
      <Dialog open={Boolean(selectedRecord)} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-[#2a3553] bg-[#11182c] text-gray-100 sm:max-w-2xl">
          {selectedRecord && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">請求書PDFプレビュー（モック）</DialogTitle>
                <DialogDescription className="text-gray-400">
                  請求書番号: {selectedRecord.invoiceNumber}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 rounded-lg border border-[#2a3553] bg-[#1a2035] p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2a3553] pb-2">
                  <p className="font-semibold text-white">{selectedRecord.pharmacyName} 御中</p>
                  <p className="text-xs text-gray-400">請求月: {selectedRecord.month}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-gray-200">
                    <span>SaaS月額利用料</span>
                    <span>{yen.format(selectedRecord.saasFee)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-200">
                    <span>夜間連携利用料</span>
                    <span>{yen.format(selectedRecord.nightFee)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-200">
                    <span>消費税</span>
                    <span>{yen.format(selectedRecord.tax)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-md border border-indigo-500/30 bg-indigo-500/10 p-2 font-semibold text-indigo-100">
                  <span>ご請求金額</span>
                  <span>{yen.format(selectedRecord.total)}</span>
                </div>

                <div className="rounded-md border border-[#2a3553] bg-[#11182c] p-3 text-xs text-gray-300">
                  <p>振込先: みずほ銀行 渋谷支店 普通 1234567</p>
                  <p>口座名義: マカセテ在宅株式会社</p>
                  <p>支払期限: 2026/03/31</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
