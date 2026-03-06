'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CalendarCheck2,
  ClipboardList,
  FileOutput,
  Plus,
  Settings,
  Stethoscope,
  Timer,
  Users,
} from 'lucide-react'
import { kpiData, timelineEvents, nightStaff } from '@/lib/mock-data'

const kpiIcons = [ClipboardList, Activity, CalendarCheck2, Building2]

const quickActions = [
  { label: '新規依頼登録', description: '受電内容を即時起票', icon: ClipboardList, gradient: 'from-indigo-600/40 to-sky-500/30' },
  { label: '当番表編集', description: '今週の夜勤シフト調整', icon: CalendarCheck2, gradient: 'from-cyan-600/35 to-indigo-500/30' },
  { label: 'レポート出力', description: '日次実績をCSV出力', icon: FileOutput, gradient: 'from-emerald-600/30 to-cyan-500/25' },
  { label: 'システム設定', description: '通知・SLAの設定管理', icon: Settings, gradient: 'from-slate-600/35 to-indigo-500/30' },
]

const staffStatusClass: Record<string, string> = {
  待機中: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  対応中: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  移動中: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
}

// SLA gauge constants
const slaRate = 94.2
const slaTarget = 15
const avgResponseMin = 11.8

function getSlaColor(rate: number) {
  if (rate >= 95) return { bar: 'from-emerald-500 to-emerald-400', text: 'text-emerald-400', label: '良好' }
  if (rate >= 90) return { bar: 'from-amber-500 to-amber-400', text: 'text-amber-400', label: '注意' }
  return { bar: 'from-rose-500 to-rose-400', text: 'text-rose-400', label: '要改善' }
}

export default function DashboardPage() {
  const { role } = useAuth()
  const [fabOpen, setFabOpen] = useState(false)
  const slaColor = getSlaColor(slaRate)

  return (
    <div className="space-y-6 text-gray-100">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {kpiData.map((kpi, index) => {
          const Icon = kpiIcons[index]
          const TrendIcon = kpi.trendUp ? ArrowUpRight : ArrowDownRight
          return (
            <Card key={kpi.label} className="border-[#2a3553] bg-[#1a2035]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-indigo-400" />
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-xs font-medium',
                      kpi.trendUp ? 'text-emerald-400' : 'text-rose-400'
                    )}
                  >
                    <TrendIcon className="h-3.5 w-3.5" />
                    {kpi.trend}
                  </span>
                </div>
                <CardDescription className="text-xs text-gray-400">{kpi.label}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tracking-tight text-white">{kpi.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </section>

      {/* SLA Gauge */}
      <section>
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-indigo-400" />
              <CardTitle className="text-base text-white">SLA達成状況</CardTitle>
              <span
                className={cn(
                  'ml-auto rounded-md border px-2 py-0.5 text-xs font-semibold',
                  slaRate >= 95
                    ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                    : slaRate >= 90
                      ? 'border-amber-500/40 bg-amber-500/20 text-amber-300'
                      : 'border-rose-500/40 bg-rose-500/20 text-rose-300'
                )}
              >
                {slaColor.label}
              </span>
            </div>
            <CardDescription className="text-gray-400">
              折返し{slaTarget}分以内の達成率（今夜）
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Gauge bar */}
            <div className="space-y-2">
              <div className="flex items-end justify-between">
                <span className={cn('text-3xl font-bold tracking-tight', slaColor.text)}>
                  {slaRate}%
                </span>
                <span className="text-sm text-gray-400">目標: 95%</span>
              </div>
              <div className="relative h-4 w-full overflow-hidden rounded-full bg-[#111827]">
                {/* Filled bar */}
                <div
                  className={cn(
                    'absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-all duration-700',
                    slaColor.bar
                  )}
                  style={{ width: `${slaRate}%` }}
                />
                {/* 95% target marker */}
                <div
                  className="absolute inset-y-0 w-0.5 bg-white/50"
                  style={{ left: '95%' }}
                  title="目標ライン 95%"
                />
              </div>
              {/* Scale labels */}
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>0%</span>
                <span>50%</span>
                <span className="text-white/40">95%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-[#2a3553] bg-[#10172b] p-3">
                <p className="text-xs text-gray-400">今夜の平均応答時間</p>
                <p className="mt-1 text-lg font-bold text-white">
                  {avgResponseMin}
                  <span className="ml-1 text-sm font-normal text-gray-400">分</span>
                </p>
              </div>
              <div className="rounded-lg border border-[#2a3553] bg-[#10172b] p-3">
                <p className="text-xs text-gray-400">SLA目標</p>
                <p className="mt-1 text-lg font-bold text-white">
                  {slaTarget}
                  <span className="ml-1 text-sm font-normal text-gray-400">分以内</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {role === 'admin' && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-200">クイックアクション（管理者）</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.label}
                  className={cn(
                    'rounded-xl border border-[#2a3553] bg-gradient-to-r p-4 text-left transition hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10',
                    action.gradient
                  )}
                >
                  <div className="mb-2 flex items-center gap-2 text-indigo-200">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-semibold">{action.label}</span>
                  </div>
                  <p className="text-xs text-gray-300">{action.description}</p>
                </button>
              )
            })}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="border-[#2a3553] bg-[#1a2035] xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base text-white">リアルタイムタイムライン</CardTitle>
            <CardDescription className="text-gray-400">最新イベントを時系列で表示</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {timelineEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3">
                <span className={cn('mt-1.5 h-2.5 w-2.5 rounded-full', event.color)} />
                <div className="flex-1">
                  <p className="text-sm text-gray-100">{event.title}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                    <span>{event.time}</span>
                    <span>•</span>
                    <span>{event.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader>
            <CardTitle className="text-base text-white">夜勤スタッフ</CardTitle>
            <CardDescription className="text-gray-400">当番薬剤師の稼働状況</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {nightStaff.map((staff) => (
              <div
                key={staff.name}
                className="rounded-lg border border-[#2a3553] bg-[#10172b] p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-indigo-400" />
                    <p className="text-sm font-medium text-white">{staff.name}</p>
                  </div>
                  <span
                    className={cn(
                      'rounded-md border px-2 py-0.5 text-xs font-semibold',
                      staffStatusClass[staff.status]
                    )}
                  >
                    {staff.status}
                  </span>
                </div>
                <p className="flex items-center gap-1 text-xs text-gray-300">
                  <Users className="h-3.5 w-3.5 text-gray-500" />
                  {staff.assignment}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* FAB - Mobile only */}
      <button
        onClick={() => setFabOpen(true)}
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-600 active:scale-95 lg:hidden"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Dialog open={fabOpen} onOpenChange={setFabOpen}>
        <DialogContent className="border-[#2a3553] bg-[#11182c] text-gray-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">新規依頼登録</DialogTitle>
            <DialogDescription className="text-gray-400">夜間受電内容を入力して依頼を起票します。</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <p className="text-xs text-gray-400">薬局名</p>
              <Input placeholder="薬局を選択" className="border-[#2a3553] bg-[#1a2035]" />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-gray-400">患者名</p>
              <Input placeholder="患者名を入力" className="border-[#2a3553] bg-[#1a2035]" />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-gray-400">症状</p>
              <Input placeholder="主訴を入力" className="border-[#2a3553] bg-[#1a2035]" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setFabOpen(false)} className="text-gray-300">キャンセル</Button>
            <Button onClick={() => setFabOpen(false)} className="bg-indigo-500 text-white hover:bg-indigo-500/90">依頼を作成</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
