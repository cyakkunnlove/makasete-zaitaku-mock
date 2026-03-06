'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
} from 'lucide-react'
import { patientData, getRiskClass, kpiData, nightStaff } from '@/lib/mock-data'

// ─── Mock Data ───

const todayVisits = [
  { patientId: 'PT-001', scheduledTime: '22:30', status: 'completed' as const, pharmacist: '佐藤 健一' },
  { patientId: 'PT-004', scheduledTime: '23:00', status: 'in_progress' as const, pharmacist: '佐藤 健一' },
  { patientId: 'PT-002', scheduledTime: '23:30', status: 'upcoming' as const, pharmacist: '高橋 直人' },
  { patientId: 'PT-005', scheduledTime: '00:00', status: 'upcoming' as const, pharmacist: '高橋 直人' },
  { patientId: 'PT-009', scheduledTime: '01:00', status: 'upcoming' as const, pharmacist: '佐藤 健一' },
  { patientId: 'PT-006', scheduledTime: '02:00', status: 'upcoming' as const, pharmacist: '高橋 直人' },
]

const mockFaxes = [
  { id: 'FAX-001', from: '城南みらい薬局', patientName: '田中 優子', receivedAt: '22:15', status: 'confirmed' as const, patientId: 'PT-001' },
  { id: 'FAX-002', from: '中野しらさぎ薬局', patientName: '清水 恒一', receivedAt: '22:45', status: 'unread' as const, patientId: 'PT-004' },
  { id: 'FAX-003', from: '港北さくら薬局', patientName: '小川 正子', receivedAt: '23:10', status: 'unread' as const, patientId: 'PT-002' },
]

const mockPharmacyRequests = [
  { id: 'REQ-0308-001', patientName: '田中 優子', status: '対応完了', time: '22:30', pharmacist: '佐藤 健一' },
  { id: 'REQ-0308-002', patientName: '清水 恒一', status: '対応中', time: '23:00', pharmacist: '佐藤 健一' },
  { id: 'REQ-0308-003', patientName: '小川 正子', status: 'FAX送信済', time: '23:10', pharmacist: '未アサイン' },
]

const visitStatusConfig = {
  completed: { label: '完了', className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: CheckCircle2 },
  in_progress: { label: '対応中', className: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: Activity },
  upcoming: { label: '予定', className: 'bg-sky-500/20 text-sky-300 border-sky-500/30', icon: Clock3 },
}

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

// ─── Admin Dashboard ───

function AdminDashboard() {
  const slaRate = 94.2

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
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

      {/* SLA */}
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
            <span className="text-sm text-gray-500 pb-1">目標: 95%</span>
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-[#111827]">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400" style={{ width: `${slaRate}%` }} />
          </div>
        </CardContent>
      </Card>

      {/* Night Staff */}
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

// ─── Pharmacy Staff Dashboard ───

function PharmacyDashboard() {
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">1</p>
            <p className="text-[10px] text-gray-500">対応完了</p>
          </CardContent>
        </Card>
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">1</p>
            <p className="text-[10px] text-gray-500">対応中</p>
          </CardContent>
        </Card>
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-sky-400">1</p>
            <p className="text-[10px] text-gray-500">FAX送信済</p>
          </CardContent>
        </Card>
      </div>

      {/* My Pharmacy Requests */}
      <div className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-200">
          <Building2 className="h-4 w-4 text-indigo-400" />
          自店舗の依頼状況
        </h2>
        {mockPharmacyRequests.map((req) => (
          <Card key={req.id} className="border-[#2a3553] bg-[#1a2035]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{req.patientName}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{req.id} • {req.time}</p>
                </div>
                <Badge variant="outline" className={cn('border text-xs',
                  req.status === '対応完了' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                  req.status === '対応中' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                  'bg-sky-500/20 text-sky-300 border-sky-500/30'
                )}>
                  {req.status}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-gray-400">担当: {req.pharmacist}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── Night Pharmacist Dashboard ───

function PharmacistDashboard() {
  const [searchQuery, setSearchQuery] = useState('')

  const enrichedVisits = useMemo(() => {
    return todayVisits.map((visit) => {
      const patient = patientData.find((p) => p.id === visit.patientId)
      return { ...visit, patient }
    })
  }, [])

  const filteredVisits = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return enrichedVisits
    return enrichedVisits.filter(
      (v) =>
        v.patient?.name.toLowerCase().includes(query) ||
        v.patient?.pharmacyName.toLowerCase().includes(query) ||
        v.pharmacist.toLowerCase().includes(query)
    )
  }, [searchQuery, enrichedVisits])

  const completedCount = todayVisits.filter((v) => v.status === 'completed').length
  const inProgressCount = todayVisits.filter((v) => v.status === 'in_progress').length
  const upcomingCount = todayVisits.filter((v) => v.status === 'upcoming').length
  const unreadFaxCount = mockFaxes.filter((f) => f.status === 'unread').length

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardContent className="p-2 text-center">
            <p className="text-xl font-bold text-emerald-400">{completedCount}</p>
            <p className="text-[10px] text-gray-500">完了</p>
          </CardContent>
        </Card>
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardContent className="p-2 text-center">
            <p className="text-xl font-bold text-amber-400">{inProgressCount}</p>
            <p className="text-[10px] text-gray-500">対応中</p>
          </CardContent>
        </Card>
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardContent className="p-2 text-center">
            <p className="text-xl font-bold text-sky-400">{upcomingCount}</p>
            <p className="text-[10px] text-gray-500">予定</p>
          </CardContent>
        </Card>
        <Card className={cn('border-[#2a3553] bg-[#1a2035]', unreadFaxCount > 0 && 'border-rose-500/40')}>
          <CardContent className="p-2 text-center">
            <p className={cn('text-xl font-bold', unreadFaxCount > 0 ? 'text-rose-400' : 'text-gray-400')}>{unreadFaxCount}</p>
            <p className="text-[10px] text-gray-500">未読FAX</p>
          </CardContent>
        </Card>
      </div>

      {/* Unread FAX Alert */}
      {unreadFaxCount > 0 && (
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-rose-300">
            <FileImage className="h-4 w-4" />
            未確認の処方箋FAX
          </h2>
          {mockFaxes.filter((f) => f.status === 'unread').map((fax) => (
            <Link key={fax.id} href={`/dashboard/patients/${fax.patientId}`}>
              <Card className="cursor-pointer border-l-4 border-l-rose-500 border-t-[#2a3553] border-r-[#2a3553] border-b-[#2a3553] bg-[#1a2035] transition hover:border-r-indigo-500/60">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/30">
                    <FileImage className="h-5 w-5 text-rose-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{fax.patientName}</p>
                    <p className="text-xs text-gray-400">{fax.from} • {fax.receivedAt}受信</p>
                  </div>
                  <Badge variant="outline" className={cn('border text-xs shrink-0', faxStatusConfig[fax.status].className)}>
                    {faxStatusConfig[fax.status].label}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="患者名・薬局名・担当者で検索"
          className="border-[#2a3553] bg-[#1a2035] pl-9 text-sm"
        />
      </div>

      {/* Today's Visit List */}
      <div className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-200">
          <Moon className="h-4 w-4 text-indigo-400" />
          今夜の訪問患者
          <span className="text-xs font-normal text-gray-500">{todayVisits.length}件</span>
        </h2>

        {filteredVisits.length === 0 && (
          <Card className="border-[#2a3553] bg-[#1a2035]">
            <CardContent className="p-6 text-center text-sm text-gray-400">
              該当する訪問予定が見つかりません。
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {filteredVisits.map((visit) => {
            const patient = visit.patient
            if (!patient) return null
            const config = visitStatusConfig[visit.status]
            const StatusIcon = config.icon
            const hasAlert = patient.riskScore >= 7 || (patient.allergies && patient.allergies !== 'なし')

            return (
              <Link key={visit.patientId} href={`/dashboard/patients/${visit.patientId}`}>
                <Card
                  className={cn(
                    'cursor-pointer border-[#2a3553] bg-[#1a2035] transition hover:border-indigo-500/60',
                    visit.status === 'in_progress' && 'border-l-4 border-l-amber-500'
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-base font-semibold text-white truncate">{patient.name}</p>
                          {hasAlert && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />}
                        </div>
                        <p className="mt-0.5 text-xs text-gray-400">{patient.pharmacyName}</p>
                      </div>
                      <Badge variant="outline" className={cn('border text-xs shrink-0', config.className)}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {config.label}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {visit.scheduledTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {visit.pharmacist}
                      </span>
                      <Badge variant="outline" className={cn('border text-[10px] px-1.5 py-0', getRiskClass(patient.riskScore))}>
                        リスク {patient.riskScore}
                      </Badge>
                    </div>

                    {patient.visitNotes && (
                      <div className="mt-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                        <p className="text-xs text-amber-200/80 line-clamp-2">{patient.visitNotes.split('\n')[0]}</p>
                      </div>
                    )}

                    {patient.allergies && patient.allergies !== 'なし' && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-300">
                        <AlertTriangle className="h-3 w-3" />
                        アレルギー: {patient.allergies}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard (Role Router) ───

export default function DashboardPage() {
  const { role } = useAuth()

  return (
    <div className="text-gray-100">
      {role === 'admin' && <AdminDashboard />}
      {(role === 'pharmacy_admin' || role === 'pharmacy_staff') && <PharmacyDashboard />}
      {role === 'pharmacist' && <PharmacistDashboard />}
    </div>
  )
}
