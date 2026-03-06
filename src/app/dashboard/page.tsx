'use client'

import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CalendarCheck2,
  ClipboardList,
  FileOutput,
  Settings,
  Stethoscope,
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

export default function DashboardPage() {
  const { role } = useAuth()

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
    </div>
  )
}
