'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  patientData,
  requestData,
  handoverData,
  pharmacyData,
  getRiskClass,
  statusMeta,
} from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Heart,
  AlertTriangle,
  Pill,
  FileText,
  Stethoscope,
  Clock3,
  ExternalLink,
} from 'lucide-react'
import { VisitSchedule } from '@/components/visit-schedule'

function calculateAge(dob: string): number {
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

function getRiskBarColor(score: number): string {
  if (score <= 3) return 'bg-emerald-500'
  if (score <= 6) return 'bg-amber-500'
  return 'bg-rose-500'
}

function getRiskBarTrack(score: number): string {
  if (score <= 3) return 'bg-emerald-500/20'
  if (score <= 6) return 'bg-amber-500/20'
  return 'bg-rose-500/20'
}

export default function PatientDetailPage() {
  useAuth()
  const params = useParams()
  const id = params.id as string

  const patient = useMemo(() => patientData.find((p) => p.id === id), [id])

  const pharmacy = useMemo(
    () => (patient ? pharmacyData.find((ph) => ph.id === patient.pharmacyId) : undefined),
    [patient]
  )

  const patientRequests = useMemo(
    () => (patient ? requestData.filter((r) => r.patientId === patient.id) : []),
    [patient]
  )

  const patientHandovers = useMemo(
    () => (patient ? handoverData.filter((h) => h.patientId === patient.id) : []),
    [patient]
  )

  if (!patient) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardContent className="p-8 text-center">
            <User className="mx-auto mb-3 h-10 w-10 text-gray-500" />
            <p className="text-sm text-gray-400">患者が見つかりませんでした。</p>
            <Link href="/dashboard/patients">
              <Button variant="outline" className="mt-4 border-[#2a3553] text-gray-300 hover:bg-[#1a2035]">
                <ArrowLeft className="mr-2 h-4 w-4" />
                患者一覧に戻る
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const age = calculateAge(patient.dob)
  const hasAllergies = patient.allergies !== 'なし'
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(patient.address)}`

  return (
    <div className="space-y-4 text-gray-100">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/patients">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:bg-[#1a2035] hover:text-white">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-white">{patient.name}</h1>
              <Badge
                variant="outline"
                className={cn(
                  'border text-xs',
                  patient.status === 'active'
                    ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                    : 'border-gray-500/40 bg-gray-500/20 text-gray-400'
                )}
              >
                {patient.status === 'active' ? '利用中' : '休止'}
              </Badge>
              <Badge variant="outline" className={cn('border text-xs', getRiskClass(patient.riskScore))}>
                リスク {patient.riskScore}
              </Badge>
            </div>
            <p className="text-xs text-gray-400">{patient.id}</p>
          </div>
        </div>
      </div>

      {/* Visit Notes Alert Card - TOP PRIORITY */}
      {patient.visitNotes && (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-300">訪問時注意事項</p>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-amber-100">
                  {patient.visitNotes}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic info */}
      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-white">
            <User className="h-4 w-4 text-indigo-400" />
            基本情報
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500">生年月日</p>
              <p className="mt-0.5 text-sm text-gray-200">{patient.dob}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">年齢</p>
              <p className="mt-0.5 text-sm text-gray-200">{age} 歳</p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="h-3 w-3" />
                住所
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <p className="text-sm text-gray-200">{patient.address}</p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-indigo-500/40 bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-300 transition hover:bg-indigo-500/20"
                >
                  <MapPin className="h-3 w-3" />
                  地図を開く
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            </div>
            <div>
              <p className="flex items-center gap-1 text-xs text-gray-500">
                <Phone className="h-3 w-3" />
                電話番号
              </p>
              <p className="mt-0.5 text-sm text-gray-200">{pharmacy?.phone ?? '-'}</p>
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <p className="text-xs text-gray-500">担当薬局</p>
              <Link
                href={`/dashboard/pharmacies/${patient.pharmacyId}`}
                className="mt-0.5 inline-block text-sm text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                {patient.pharmacyName}
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency contact & Doctor info */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Emergency contact */}
        <Card className="border-l-2 border-l-rose-500/60 border-t-[#2a3553] border-r-[#2a3553] border-b-[#2a3553] bg-[#1a2035]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-white">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              緊急連絡先
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">氏名</p>
              <p className="mt-0.5 text-sm font-medium text-gray-200">{patient.emergencyContact.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">続柄</p>
              <p className="mt-0.5 text-sm text-gray-200">{patient.emergencyContact.relation}</p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-xs text-gray-500">
                <Phone className="h-3 w-3" />
                電話番号
              </p>
              <p className="mt-0.5 text-sm text-indigo-300">{patient.emergencyContact.phone}</p>
            </div>
          </CardContent>
        </Card>

        {/* Doctor info */}
        <Card className="border-l-2 border-l-sky-500/60 border-t-[#2a3553] border-r-[#2a3553] border-b-[#2a3553] bg-[#1a2035]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-white">
              <Stethoscope className="h-4 w-4 text-sky-400" />
              主治医情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">医師名</p>
              <p className="mt-0.5 text-sm font-medium text-gray-200">{patient.doctor.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">医療機関</p>
              <p className="mt-0.5 text-sm text-gray-200">{patient.doctor.clinic}</p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-xs text-gray-500">
                <Phone className="h-3 w-3" />
                夜間連絡先
              </p>
              <p className="mt-0.5 text-sm text-indigo-300">{patient.doctor.phone}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clinical info (without current meds and visit notes) */}
      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-white">
            <Heart className="h-4 w-4 text-rose-400" />
            臨床情報
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-gray-500">既往歴</p>
            <p className="mt-0.5 text-sm text-gray-200">{patient.medicalHistory}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">アレルギー</p>
            <p
              className={cn(
                'mt-0.5 text-sm',
                hasAllergies ? 'font-medium text-rose-300' : 'text-gray-200'
              )}
            >
              {hasAllergies && <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />}
              {patient.allergies}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">保険情報</p>
            <p className="mt-0.5 text-sm text-gray-200">{patient.insuranceInfo}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">主疾患</p>
            <p className="mt-0.5 text-sm text-gray-200">{patient.diseaseName}</p>
          </div>
        </CardContent>
      </Card>

      {/* Visit Schedule */}
      <VisitSchedule patientId={patient.id} />

      {/* Current Medications - moved to bottom with (任意) label */}
      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-white">
            <Pill className="h-4 w-4 text-indigo-400" />
            現在薬
            <span className="text-xs font-normal text-gray-500">（任意）</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-200">{patient.currentMeds}</p>
        </CardContent>
      </Card>

      {/* Risk Score visual */}
      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-white">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            リスクスコア
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <span
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold',
                getRiskBarTrack(patient.riskScore),
                patient.riskScore <= 3
                  ? 'text-emerald-300'
                  : patient.riskScore <= 6
                    ? 'text-amber-300'
                    : 'text-rose-300'
              )}
            >
              {patient.riskScore}
            </span>
            <div className="flex-1">
              <div className={cn('h-3 w-full rounded-full', getRiskBarTrack(patient.riskScore))}>
                <div
                  className={cn('h-3 rounded-full transition-all', getRiskBarColor(patient.riskScore))}
                  style={{ width: `${patient.riskScore * 10}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-gray-500">
                <span>0 (低)</span>
                <span>5 (中)</span>
                <span>10 (高)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request History */}
      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-white">
            <Clock3 className="h-4 w-4 text-indigo-400" />
            依頼履歴
            <Badge variant="outline" className="ml-1 border-[#2a3553] text-xs text-gray-400">
              {patientRequests.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patientRequests.length === 0 ? (
            <p className="py-4 text-center text-xs text-gray-500">依頼履歴はありません。</p>
          ) : (
            <div className="space-y-2">
              {patientRequests.map((req) => {
                const meta = statusMeta[req.status]
                return (
                  <Link key={req.id} href={`/dashboard/requests/${req.id}`} className="block">
                    <div className="flex items-center justify-between rounded-lg border border-[#2a3553] bg-[#111827] p-3 transition hover:border-indigo-500/40">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-300">{req.id}</span>
                          <Badge variant="outline" className={cn('border text-[10px]', meta.className)}>
                            {meta.label}
                          </Badge>
                        </div>
                        <p className="mt-1 truncate text-xs text-gray-400">{req.symptom}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-gray-500">{req.receivedDate}</p>
                        <p className="text-xs text-gray-400">{req.receivedAt}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Handover History */}
      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-white">
            <FileText className="h-4 w-4 text-purple-400" />
            申し送り履歴
            <Badge variant="outline" className="ml-1 border-[#2a3553] text-xs text-gray-400">
              {patientHandovers.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patientHandovers.length === 0 ? (
            <p className="py-4 text-center text-xs text-gray-500">申し送り履歴はありません。</p>
          ) : (
            <div className="space-y-2">
              {patientHandovers.map((ho) => (
                <Link key={ho.id} href={`/dashboard/handovers/${ho.id}`} className="block">
                  <div className="flex items-center justify-between rounded-lg border border-[#2a3553] bg-[#111827] p-3 transition hover:border-indigo-500/40">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-300">{ho.id}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'border text-[10px]',
                            ho.confirmed
                              ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                              : 'border-amber-500/40 bg-amber-500/20 text-amber-300'
                          )}
                        >
                          {ho.confirmed ? '確認済' : '未確認'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">薬剤師: {ho.pharmacistName}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-gray-500">{ho.timestamp}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
