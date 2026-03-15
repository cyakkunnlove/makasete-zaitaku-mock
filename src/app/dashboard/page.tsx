'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
} from 'lucide-react'
import { getAttentionFlags, getAttentionFlagClass, kpiData, nightStaff, getPatientsByPharmacy } from '@/lib/mock-data'

// ─── Mock Data ───

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

// ─── Regional Admin Dashboard ───

function RegionalAdminDashboard() {
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
          <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3 flex items-center justify-between">
            <span>通知ジョブ</span><Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/20 text-emerald-300">正常</Badge>
          </div>
          <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3 flex items-center justify-between">
            <span>夜間監視Cron</span><Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/20 text-emerald-300">正常</Badge>
          </div>
          <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3 flex items-center justify-between">
            <span>地域テナント数</span><span className="font-semibold text-white">3</span>
          </div>
          <p className="text-xs text-gray-500">system_admin は患者情報や依頼本文を見ず、システム稼働と権限設定だけを確認します。</p>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Pharmacy/Admin Dashboard ───

// Mock: today's scheduled visits for this pharmacy
const pharmacyTodayVisits = [
  { patientId: 'PT-001', scheduledTime: '10:00', visitType: '定期', status: 'completed' as const, source: '自動生成', assignedTo: '小林 薫' },
  { patientId: 'PT-004', scheduledTime: '11:30', visitType: '定期', status: 'completed' as const, source: '自動生成', assignedTo: '小林 薫' },
  { patientId: 'PT-002', scheduledTime: '14:00', visitType: '臨時', status: 'upcoming' as const, source: '手動追加', assignedTo: '小林 薫' },
  { patientId: 'PT-005', scheduledTime: '15:30', visitType: '定期', status: 'upcoming' as const, source: '自動生成', assignedTo: '小林 薫' },
  { patientId: 'PT-003', scheduledTime: '17:30', visitType: '要確認', status: 'upcoming' as const, source: '手動追加', assignedTo: '小林 薫' },
]

const nightSearchCandidates = [
  { id: 'PT-001', patientName: '田中 優子', pharmacyName: '城南みらい薬局', regionName: '東京南部', distanceKm: 4.2, etaMin: 11, matchScore: 96, reason: '加盟店一致 / 生年月日一致 / 処方薬一致' },
  { id: 'PT-007', patientName: '山本 直子', pharmacyName: '世田谷つばさ薬局', regionName: '東京南部', distanceKm: 6.8, etaMin: 17, matchScore: 74, reason: 'リージョン一致 / 氏名類似 / 症状文脈一致' },
  { id: 'PT-006', patientName: '渡辺 美和', pharmacyName: '西新宿いろは薬局', regionName: '東京西部', distanceKm: 12.4, etaMin: 28, matchScore: 42, reason: 'リージョン外候補 / 距離超過気味' },
]

function PharmacyDashboard({ isDayPharmacist = false }: { isDayPharmacist?: boolean }) {
  const [searchQuery, setSearchQuery] = useState('')
  const ownPharmacyId = 'PH-01'
  const ownPatients = useMemo(() => getPatientsByPharmacy(ownPharmacyId), [ownPharmacyId])

  const enrichedVisits = useMemo(() => {
    return pharmacyTodayVisits
      .filter((visit) => ownPatients.some((p) => p.id === visit.patientId))
      .map((visit) => {
        const patient = ownPatients.find((p) => p.id === visit.patientId)
        return { ...visit, patient }
      })
  }, [ownPatients])

  const filteredVisits = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return enrichedVisits
    return enrichedVisits.filter((v) => v.patient?.name.toLowerCase().includes(query))
  }, [searchQuery, enrichedVisits])

  const filteredMasterPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return ownPatients
    return ownPatients.filter((p) => p.name.toLowerCase().includes(query) || p.address.toLowerCase().includes(query))
  }, [searchQuery, ownPatients])

  const completedCount = pharmacyTodayVisits.filter((v) => v.status === 'completed').length
  const upcomingCount = pharmacyTodayVisits.filter((v) => v.status === 'upcoming').length

  return (
    <div className="space-y-4">
      {/* Summary */}
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
            <p className="text-2xl font-bold text-sky-400">{upcomingCount}</p>
            <p className="text-[10px] text-gray-500">未訪問</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="患者名で検索"
          className="border-[#2a3553] bg-[#1a2035] pl-9 text-sm"
        />
      </div>

      {isDayPharmacist ? (
        <Tabs defaultValue="today" className="space-y-3">
          <TabsList className="grid w-full grid-cols-2 bg-[#11182c] text-gray-400">
            <TabsTrigger value="today" className="data-[state=active]:bg-[#1a2035] data-[state=active]:text-white">今日の患者</TabsTrigger>
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
                const isCompleted = visit.status === 'completed'
                return (
                  <Link key={visit.patientId} href={`/dashboard/patients/${visit.patientId}`}>
                    <Card className="cursor-pointer border-[#2a3553] bg-[#1a2035] transition hover:border-indigo-500/60">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={cn('text-sm font-semibold', isCompleted ? 'text-gray-400 line-through' : 'text-white')}>{patient.name}</p>
                              <Badge variant="outline" className={cn('border text-[10px]', visit.source === '手動追加' ? 'border-amber-500/40 bg-amber-500/20 text-amber-300' : 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300')}>
                                {visit.source}
                              </Badge>
                              <Badge variant="outline" className="border-[#2a3553] text-gray-300 text-[10px]">{visit.visitType}</Badge>
                            </div>
                            <p className="mt-0.5 text-xs text-gray-500">{patient.address}</p>
                            <p className="mt-1 text-[11px] text-indigo-300">担当: {visit.assignedTo} / {visit.scheduledTime}</p>
                          </div>
                          {isCompleted ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Clock3 className="h-4 w-4 text-gray-500" />}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
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
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white">{patient.name}</p>
                            <p className="mt-0.5 text-xs text-gray-500">{patient.address}</p>
                            <p className="mt-1 text-[11px] text-gray-400">次回訪問ルール: 毎週 / 隔週の自動生成対象</p>
                          </div>
                        </div>
                        {flags.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{flags.slice(0,3).map((flag)=><Badge key={flag.key} variant="outline" className={cn('border text-[10px]', getAttentionFlagClass(flag.tone))}>{flag.label}</Badge>)}</div>}
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
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
                <Link key={visit.patientId} href={`/dashboard/patients/${visit.patientId}`}>
                  <Card className="cursor-pointer border-[#2a3553] bg-[#1a2035] transition hover:border-indigo-500/60">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={cn('text-sm font-semibold', isCompleted ? 'text-gray-400 line-through' : 'text-white')}>{patient.name}</p>
                            <Badge variant="outline" className={cn('border text-[10px]', visit.visitType === '臨時' ? 'border-amber-500/40 bg-amber-500/20 text-amber-300' : 'border-[#2a3553] text-gray-400')}>{visit.visitType}</Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-gray-500">{patient.address}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
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
                  <Badge variant="outline" className={cn('border text-xs',
                    req.status === '対応完了' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                    req.status === '対応中' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                    'bg-sky-500/20 text-sky-300 border-sky-500/30'
                  )}>
                    {req.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Night Pharmacist Dashboard ───

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
          <Card key={fax.id} className="border-l-4 border-l-rose-500 border-t-[#2a3553] border-r-[#2a3553] border-b-[#2a3553] bg-[#1a2035]">
            <CardContent className="p-4 space-y-1">
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white">{candidate.patientName}</p>
                    <Badge variant="outline" className={cn('border text-[10px]', candidate.matchScore >= 80 ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' : candidate.matchScore >= 60 ? 'border-amber-500/40 bg-amber-500/20 text-amber-300' : 'border-gray-500/40 bg-gray-500/20 text-gray-300')}>
                      一致度 {candidate.matchScore}%
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">{candidate.pharmacyName} / {candidate.regionName}</p>
                  <p className="mt-1 text-[11px] text-gray-500">{candidate.reason}</p>
                </div>
                <div className="text-right text-xs text-gray-400 shrink-0">
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

// ─── Main Dashboard (Role Router) ───

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
      {(role === 'pharmacy_admin' || role === 'pharmacy_staff') && <PharmacyDashboard />}
      {role === 'day_pharmacist' && <PharmacyDashboard isDayPharmacist />}
      {role === 'night_pharmacist' && <PharmacistDashboard />}
    </div>
  )
}
