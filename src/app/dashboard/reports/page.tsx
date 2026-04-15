'use client'

import { useMemo, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download } from 'lucide-react'
import { pharmacyPerformanceData, hourlyDistributionData } from '@/lib/mock-data'

interface MonthReport {
  totalRequests: number
  avgResponseMinutes: number
  slaRate: number
  completionRate: number
  technicalFees: Array<{
    label: string
    count: number
    points: number
  }>
  chart: Array<{
    label: string
    value: number
  }>
}

const reportByMonth: Record<string, MonthReport> = {
  '2026-03': {
    totalRequests: 186,
    avgResponseMinutes: 11.8,
    slaRate: 95.2,
    completionRate: 98.4,
    technicalFees: [
      { label: '訪問指導料', count: 129, points: 151200 },
      { label: '緊急訪問加算', count: 38, points: 68400 },
      { label: '夜間加算', count: 57, points: 102600 },
    ],
    chart: [
      { label: '1週目', value: 41 },
      { label: '2週目', value: 47 },
      { label: '3週目', value: 38 },
      { label: '4週目', value: 52 },
      { label: '5週目', value: 8 },
    ],
  },
  '2026-02': {
    totalRequests: 172,
    avgResponseMinutes: 12.4,
    slaRate: 93.7,
    completionRate: 97.8,
    technicalFees: [
      { label: '訪問指導料', count: 121, points: 141900 },
      { label: '緊急訪問加算', count: 34, points: 61200 },
      { label: '夜間加算', count: 49, points: 88200 },
    ],
    chart: [
      { label: '1週目', value: 39 },
      { label: '2週目', value: 43 },
      { label: '3週目', value: 46 },
      { label: '4週目', value: 44 },
      { label: '5週目', value: 0 },
    ],
  },
  '2026-01': {
    totalRequests: 159,
    avgResponseMinutes: 13.1,
    slaRate: 92.1,
    completionRate: 96.9,
    technicalFees: [
      { label: '訪問指導料', count: 112, points: 131200 },
      { label: '緊急訪問加算', count: 31, points: 55800 },
      { label: '夜間加算', count: 44, points: 79200 },
    ],
    chart: [
      { label: '1週目', value: 37 },
      { label: '2週目', value: 35 },
      { label: '3週目', value: 41 },
      { label: '4週目', value: 39 },
      { label: '5週目', value: 7 },
    ],
  },
}

const monthOptions = [
  { value: '2026-03', label: '2026年3月' },
  { value: '2026-02', label: '2026年2月' },
  { value: '2026-01', label: '2026年1月' },
]

export default function ReportsPage() {
  useAuth()
  const [selectedMonth, setSelectedMonth] = useState('2026-03')
  const [message, setMessage] = useState('')

  const report = useMemo(() => reportByMonth[selectedMonth], [selectedMonth])

  const maxChartValue = Math.max(...report.chart.map((item) => item.value), 1)

  return (
    <div className="space-y-4 text-slate-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">実績レポート</h1>
          <p className="text-xs text-slate-500">月次の運用指標・技術料実績を確認</p>
        </div>

        <div className="flex w-full gap-2 sm:w-auto">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full border-slate-200 bg-white text-slate-900 sm:w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-slate-200 bg-white text-slate-900">
              {monthOptions.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => setMessage(`${selectedMonth} のCSVを出力しました（モック）`)}
            className="bg-indigo-500 text-white hover:bg-indigo-500/90"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {message && (
        <Card className="border-indigo-200 bg-indigo-50 shadow-sm">
          <CardContent className="p-3 text-sm text-indigo-700">{message}</CardContent>
        </Card>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500">総依頼件数</CardDescription>
            <CardTitle className="text-2xl text-slate-900">{report.totalRequests}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500">平均応答時間</CardDescription>
            <CardTitle className="text-2xl text-indigo-600">{report.avgResponseMinutes}分</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500">SLA達成率</CardDescription>
            <CardTitle className="text-2xl text-emerald-600">{report.slaRate}%</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500">完了率</CardDescription>
            <CardTitle className="text-2xl text-sky-600">{report.completionRate}%</CardTitle>
          </CardHeader>
        </Card>
      </section>

      {/* Store-level performance */}
      <section>
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-slate-900">薬局別パフォーマンス</CardTitle>
            <CardDescription className="text-slate-500">加盟薬局ごとの主要指標</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop table */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200">
                    <TableHead className="text-slate-500">薬局名</TableHead>
                    <TableHead className="text-right text-slate-500">依頼数</TableHead>
                    <TableHead className="text-right text-slate-500">平均応答(分)</TableHead>
                    <TableHead className="text-right text-slate-500">SLA達成率(%)</TableHead>
                    <TableHead className="text-right text-slate-500">完了率(%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pharmacyPerformanceData.map((p) => (
                    <TableRow key={p.pharmacyId} className="border-slate-200">
                      <TableCell className="text-sm font-medium text-slate-900">{p.pharmacyName}</TableCell>
                      <TableCell className="text-right text-sm text-slate-700">{p.requestCount}</TableCell>
                      <TableCell className="text-right text-sm text-slate-700">{p.avgResponseMin}</TableCell>
                      <TableCell
                        className={`text-right text-sm font-medium ${
                          p.slaRate < 90
                            ? 'text-rose-300'
                            : p.slaRate <= 95
                              ? 'text-amber-300'
                              : 'text-emerald-300'
                        }`}
                      >
                        {p.slaRate}
                      </TableCell>
                      <TableCell className="text-right text-sm text-slate-700">{p.completionRate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-2 sm:hidden">
              {pharmacyPerformanceData.map((p) => (
                <div
                  key={p.pharmacyId}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  <p className="mb-2 text-sm font-medium text-slate-900">{p.pharmacyName}</p>
                  <div className="grid grid-cols-2 gap-y-1 text-xs">
                    <span className="text-slate-500">依頼数</span>
                    <span className="text-right text-slate-700">{p.requestCount}</span>
                    <span className="text-slate-500">平均応答</span>
                    <span className="text-right text-slate-700">{p.avgResponseMin}分</span>
                    <span className="text-gray-400">SLA達成率</span>
                    <span
                      className={`text-right font-medium ${
                        p.slaRate < 90
                          ? 'text-rose-300'
                          : p.slaRate <= 95
                            ? 'text-amber-300'
                            : 'text-emerald-300'
                      }`}
                    >
                      {p.slaRate}%
                    </span>
                    <span className="text-slate-500">完了率</span>
                    <span className="text-right text-slate-700">{p.completionRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader>
            <CardTitle className="text-base text-white">技術料サマリー</CardTitle>
            <CardDescription className="text-gray-400">訪問関連の算定件数と合計点数</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {report.technicalFees.map((fee) => (
              <div
                key={fee.label}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#2a3553] bg-[#11182c] p-3"
              >
                <p className="text-sm font-medium text-white">{fee.label}</p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-300">件数: {fee.count}件</span>
                  <span className="text-indigo-300">点数: {fee.points.toLocaleString('ja-JP')}点</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader>
            <CardTitle className="text-base text-white">月内推移（依頼件数）</CardTitle>
            <CardDescription className="text-gray-400">シンプルバー表示（週次）</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-[220px] items-end gap-3">
              {report.chart.map((item) => {
                const height = Math.max(18, (item.value / maxChartValue) * 180)

                return (
                  <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-md border border-indigo-500/30 bg-gradient-to-t from-indigo-500/70 to-indigo-400/20"
                      style={{ height }}
                    />
                    <p className="text-xs text-gray-300">{item.value}件</p>
                    <p className="text-[11px] text-gray-500">{item.label}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Hourly distribution bar chart */}
      <section>
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader>
            <CardTitle className="text-base text-white">時間帯別依頼分布</CardTitle>
            <CardDescription className="text-gray-400">夜間帯（22時〜5時）の依頼件数</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-[220px] items-end gap-3">
              {hourlyDistributionData.map((item) => {
                const maxHourly = Math.max(...hourlyDistributionData.map((d) => d.count), 1)
                const height = Math.max(18, (item.count / maxHourly) * 180)

                return (
                  <div key={item.hour} className="flex flex-1 flex-col items-center gap-2">
                    <p className="text-xs font-medium text-emerald-300">{item.count}</p>
                    <div
                      className="w-full rounded-md border border-emerald-500/30 bg-gradient-to-t from-emerald-500/70 to-emerald-400/20"
                      style={{ height }}
                    />
                    <p className="text-[11px] text-gray-400">{item.hour}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
