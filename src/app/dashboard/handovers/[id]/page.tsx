'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock3, User, Building2, Stethoscope, FileText as FileTextIcon } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { handoverData, patientData, sbarStyles } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function HandoverDetailPage() {
  const { role, user } = useAuth()
  const params = useParams()
  const id = params.id as string

  const handover = handoverData.find((h) => h.id === id)
  const _patient = handover ? patientData.find((p) => p.id === handover.patientId) : null
  void _patient

  const [confirmed, setConfirmed] = useState(handover?.confirmed ?? false)
  const [confirmedAt, setConfirmedAt] = useState(handover?.confirmedAt ?? null)
  const [confirmedBy, setConfirmedBy] = useState(handover?.confirmedBy ?? null)

  if (!handover) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] p-4 text-gray-100">
        <div className="mx-auto max-w-3xl">
          <Card className="border-[#2a3553] bg-[#111827]">
            <CardContent className="py-12 text-center">
              <p className="text-gray-400">申し送りが見つかりませんでした</p>
              <Link href="/dashboard/handovers">
                <Button variant="ghost" className="mt-4 text-indigo-400 hover:text-indigo-300">
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  一覧に戻る
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const handleConfirm = () => {
    const now = new Date().toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    setConfirmed(true)
    setConfirmedAt(now)
    setConfirmedBy(user?.full_name ?? '不明')
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-100">
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/handovers">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-300 hover:bg-[#1a2035] hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-white">{handover.id}</h1>
              <p className="text-xs text-gray-400">申し送り詳細</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'border',
              confirmed
                ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                : 'border-amber-500/40 bg-amber-500/20 text-amber-300'
            )}
          >
            {confirmed ? '確認済み' : '未確認'}
          </Badge>
        </div>

        {/* Meta card */}
        <Card className="border-[#2a3553] bg-[#111827]">
          <CardContent className="grid grid-cols-1 gap-4 pt-5 sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
              <div>
                <p className="text-xs text-gray-400">担当夜間薬剤師</p>
                <p className="text-sm text-white">{handover.pharmacistName}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
              <div>
                <p className="text-xs text-gray-400">患者</p>
                <Link
                  href={`/dashboard/patients/${handover.patientId}`}
                  className="text-sm text-indigo-400 hover:underline"
                >
                  {handover.patientName}
                </Link>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
              <div>
                <p className="text-xs text-gray-400">薬局</p>
                <Link
                  href={`/dashboard/pharmacies/${handover.pharmacyId}`}
                  className="text-sm text-indigo-400 hover:underline"
                >
                  {handover.pharmacyName}
                </Link>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
              <div>
                <p className="text-xs text-gray-400">作成日時</p>
                <p className="text-sm text-white">{handover.timestamp}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SBAR display */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white">SBAR</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className={cn('rounded-lg border p-4', sbarStyles.situation.className)}>
              <p className="text-xs font-semibold">{sbarStyles.situation.label}</p>
              <p className="mt-2 text-sm leading-relaxed">{handover.situation}</p>
            </div>
            <div className={cn('rounded-lg border p-4', sbarStyles.background.className)}>
              <p className="text-xs font-semibold">{sbarStyles.background.label}</p>
              <p className="mt-2 text-sm leading-relaxed">{handover.background}</p>
            </div>
            <div className={cn('rounded-lg border p-4', sbarStyles.assessment.className)}>
              <p className="text-xs font-semibold">{sbarStyles.assessment.label}</p>
              <p className="mt-2 text-sm leading-relaxed">{handover.assessment}</p>
            </div>
            <div className={cn('rounded-lg border p-4', sbarStyles.recommendation.className)}>
              <p className="text-xs font-semibold">{sbarStyles.recommendation.label}</p>
              <p className="mt-2 text-sm leading-relaxed">{handover.recommendation}</p>
            </div>
          </div>
        </div>

        {/* Vitals card */}
        <Card className="border-[#2a3553] bg-[#111827]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white">バイタルサイン</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-[#2a3553] bg-[#1a2035] p-3 text-center">
                <p className="text-xs text-gray-400">体温</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {handover.vitals.temperature}
                  <span className="text-sm font-normal text-gray-400">℃</span>
                </p>
              </div>
              <div className="rounded-lg border border-[#2a3553] bg-[#1a2035] p-3 text-center">
                <p className="text-xs text-gray-400">血圧</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {handover.vitals.bloodPressure}
                </p>
              </div>
              <div className="rounded-lg border border-[#2a3553] bg-[#1a2035] p-3 text-center">
                <p className="text-xs text-gray-400">脈拍</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {handover.vitals.pulse}
                  <span className="text-sm font-normal text-gray-400">/分</span>
                </p>
              </div>
              <div className="rounded-lg border border-[#2a3553] bg-[#1a2035] p-3 text-center">
                <p className="text-xs text-gray-400">SpO2</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {handover.vitals.spo2}
                  <span className="text-sm font-normal text-gray-400">%</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional info card */}
        <Card className="border-[#2a3553] bg-[#111827]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white">追加情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-gray-400">投与薬剤</p>
              <p className="mt-1 text-sm text-gray-200">{handover.medicationAdministered}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">患者の状態</p>
              <p className="mt-1 text-sm text-gray-200">{handover.patientCondition}</p>
            </div>
          </CardContent>
        </Card>

        {/* Attached Report */}
        {handover.reportFileUrl && (
          <Card className="border-[#2a3553] bg-[#111827]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-white">
                <FileTextIcon className="h-4 w-4 text-indigo-400" />
                添付報告書
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border border-[#2a3553] bg-[#1a2035] p-4">
                <div className="flex items-center gap-3">
                  <FileTextIcon className="h-8 w-8 text-indigo-400" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {handover.reportFileUrl.split('/').pop()}
                    </p>
                    <p className="text-xs text-gray-400">PDF報告書</p>
                  </div>
                </div>
                <a
                  href={handover.reportFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-sm text-indigo-300 transition hover:bg-indigo-500/20"
                >
                  報告書を表示
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confirm section */}
        <Card className="border-[#2a3553] bg-[#111827]">
          <CardContent className="pt-5">
            {confirmed ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-emerald-300">確認済み</p>
                  <p className="text-xs text-gray-400">
                    {confirmedAt} - {confirmedBy}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-amber-300">この申し送りはまだ確認されていません</p>
                {(role === 'pharmacy_admin' || role === 'regional_admin') && (
                  <Button
                    onClick={handleConfirm}
                    className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    確認する
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
