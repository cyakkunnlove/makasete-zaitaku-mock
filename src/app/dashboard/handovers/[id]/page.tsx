'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock3, User, Building2, Stethoscope, FileText as FileTextIcon, Printer, Download, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { handoverData, sbarStyles } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/common/EmptyState'

export default function HandoverDetailPage() {
  const { role, user } = useAuth()
  const params = useParams()
  const id = params.id as string

  const handover = handoverData.find((h) => h.id === id)

  const [confirmed, setConfirmed] = useState(handover?.confirmed ?? false)
  const [confirmedAt, setConfirmedAt] = useState(handover?.confirmedAt ?? null)
  const [confirmedBy, setConfirmedBy] = useState(handover?.confirmedBy ?? null)
  const [staffConfirmed, setStaffConfirmed] = useState(false)
  const [staffConfirmedAt, setStaffConfirmedAt] = useState<string | null>(null)
  const [staffConfirmedBy, setStaffConfirmedBy] = useState<string | null>(null)

  if (!handover) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 text-slate-900">
        <div className="mx-auto max-w-3xl">
          <EmptyState
            title="申し送りが見つかりませんでした"
            description="一覧に戻って、対象の申し送りを選び直してください。"
            action={(
              <Link href="/dashboard/handovers">
                <Button variant="ghost" className="text-indigo-400 hover:text-indigo-300">
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  一覧に戻る
                </Button>
              </Link>
            )}
          />
        </div>
      </div>
    )
  }

  const formatNow = () => new Date().toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const handleConfirm = () => {
    const now = formatNow()
    setConfirmed(true)
    setConfirmedAt(now)
    setConfirmedBy(user?.full_name ?? '不明')
  }

  const handleStaffConfirm = () => {
    const now = formatNow()
    setStaffConfirmed(true)
    setStaffConfirmedAt(now)
    setStaffConfirmedBy(user?.full_name ?? '不明')
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print()
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/handovers">
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{handover.id}</h1>
              <p className="text-xs text-slate-500">申し送り詳細</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(role === 'pharmacy_admin' || role === 'pharmacy_staff') && (
              <Button variant="outline" size="sm" onClick={handlePrint} className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                <Printer className="mr-1 h-4 w-4" />
                印刷
              </Button>
            )}
            {handover.reportFileUrl && (
              <a href={handover.reportFileUrl} download className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                <Download className="mr-1 h-4 w-4" />
                保存
              </a>
            )}
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
        </div>

        {/* Meta card */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="grid grid-cols-1 gap-4 pt-5 sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
              <div>
                <p className="text-xs text-slate-500">担当夜間薬剤師</p>
                <p className="text-sm text-slate-900">{handover.pharmacistName}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
              <div>
                <p className="text-xs text-slate-500">患者</p>
                <Link
                  href={`/dashboard/patients/${handover.patientId}`}
                  className="text-sm text-indigo-600 hover:underline"
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
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-900">バイタルサイン</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-xs text-slate-500">体温</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
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
          <CardContent className="space-y-4 pt-5">
            {role === 'pharmacy_admin' && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
                <p className="inline-flex items-center gap-2 font-medium"><ShieldCheck className="h-4 w-4" />Pharmacy Admin は自局申し送りの最終確認責任者候補です</p>
                <p className="mt-1 text-xs text-amber-200/80">Pharmacy Staff が閲覧していても、管理者としての確認導線を残します。</p>
              </div>
            )}
            {role === 'pharmacy_staff' && (
              <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-100">
                <p className="font-medium">Pharmacy Staff は確認者として記録されます</p>
                <p className="mt-1 text-xs text-sky-200/80">最終確認責任は Pharmacy Admin 側に残しつつ、誰が確認したかを個人単位で残します。</p>
              </div>
            )}
            <div className="space-y-3">
              {staffConfirmed && (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-sky-400" />
                  <div>
                    <p className="text-sm font-medium text-sky-300">staff確認済み</p>
                    <p className="text-xs text-gray-400">
                      {staffConfirmedAt} - {staffConfirmedBy}
                    </p>
                  </div>
                </div>
              )}

              {confirmed ? (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-emerald-300">最終確認済み</p>
                    <p className="text-xs text-gray-400">
                      {confirmedAt} - {confirmedBy}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-amber-300">この申し送りはまだ最終確認されていません</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {role === 'pharmacy_staff' && !staffConfirmed && (
                      <Button
                        variant="outline"
                        onClick={handleStaffConfirm}
                        className="border-sky-500/40 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20"
                      >
                        <CheckCircle2 className="mr-1.5 h-4 w-4" />
                        確認した
                      </Button>
                    )}
                    {(role === 'pharmacy_admin' || role === 'regional_admin') && (
                      <Button
                        onClick={handleConfirm}
                        className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                      >
                        <CheckCircle2 className="mr-1.5 h-4 w-4" />
                        {role === 'pharmacy_admin' ? '最終確認する' : '確認する'}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
