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
  MapPin,
  AlertTriangle,
  FileText,
  Phone,
  ChevronRight,
  Activity,
  CheckCircle2,
  Users,
  Moon,
} from 'lucide-react'
import { patientData, getRiskClass } from '@/lib/mock-data'

// Mock: today's scheduled visits (subset of patients with visit times)
const todayVisits = [
  { patientId: 'PT-001', scheduledTime: '22:30', status: 'completed' as const, pharmacist: '佐藤 健一' },
  { patientId: 'PT-004', scheduledTime: '23:00', status: 'in_progress' as const, pharmacist: '佐藤 健一' },
  { patientId: 'PT-002', scheduledTime: '23:30', status: 'upcoming' as const, pharmacist: '高橋 直人' },
  { patientId: 'PT-005', scheduledTime: '00:00', status: 'upcoming' as const, pharmacist: '高橋 直人' },
  { patientId: 'PT-009', scheduledTime: '01:00', status: 'upcoming' as const, pharmacist: '佐藤 健一' },
  { patientId: 'PT-006', scheduledTime: '02:00', status: 'upcoming' as const, pharmacist: '高橋 直人' },
]

const statusConfig = {
  completed: { label: '完了', className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: CheckCircle2 },
  in_progress: { label: '対応中', className: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: Activity },
  upcoming: { label: '予定', className: 'bg-sky-500/20 text-sky-300 border-sky-500/30', icon: Clock3 },
}

export default function DashboardPage() {
  useAuth()
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

  return (
    <div className="space-y-4 text-gray-100">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{completedCount}</p>
            <p className="text-[10px] text-gray-500">完了</p>
          </CardContent>
        </Card>
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{inProgressCount}</p>
            <p className="text-[10px] text-gray-500">対応中</p>
          </CardContent>
        </Card>
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-sky-400">{upcomingCount}</p>
            <p className="text-[10px] text-gray-500">予定</p>
          </CardContent>
        </Card>
      </div>

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
            const config = statusConfig[visit.status]
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
                    {/* Top Row: Name + Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-base font-semibold text-white truncate">
                            {patient.name}
                          </p>
                          {hasAlert && (
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-gray-400">{patient.pharmacyName}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="outline"
                          className={cn('border text-xs', config.className)}
                        >
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {config.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Info Row */}
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {visit.scheduledTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {visit.pharmacist}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn('border text-[10px] px-1.5 py-0', getRiskClass(patient.riskScore))}
                      >
                        リスク {patient.riskScore}
                      </Badge>
                    </div>

                    {/* Visit Notes Preview */}
                    {patient.visitNotes && (
                      <div className="mt-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                        <p className="text-xs text-amber-200/80 line-clamp-2">
                          {patient.visitNotes.split('\n')[0]}
                        </p>
                      </div>
                    )}

                    {/* Allergies */}
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
