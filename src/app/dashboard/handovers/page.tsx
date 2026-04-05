'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { CheckCircle2, ChevronDown, ChevronUp, Plus, ShieldCheck, Printer, Pencil } from 'lucide-react'
import { handoverData, sbarStyles } from '@/lib/mock-data'

export default function HandoversPage() {
  const { role } = useAuth()
  const visibleHandovers = useMemo(() => {
    if (role !== 'night_pharmacist') return handoverData
    return handoverData.filter((h) => h.pharmacistName === '佐藤 健一' && h.timestamp.startsWith('2026/03/05'))
  }, [role])

  const [expandedId, setExpandedId] = useState<string | null>(visibleHandovers[0]?.id ?? null)
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(
    () => new Set(visibleHandovers.filter((h) => h.confirmed).map((h) => h.id))
  )
  const [staffConfirmedIds, setStaffConfirmedIds] = useState<Set<string>>(new Set())

  const unconfirmedCount = useMemo(
    () => visibleHandovers.filter((h) => !confirmedIds.has(h.id)).length,
    [confirmedIds, visibleHandovers]
  )

  const handleConfirm = (id: string) => {
    if (role !== 'pharmacy_admin') return
    setConfirmedIds((prev) => new Set(prev).add(id))
  }

  const handleStaffConfirm = (id: string) => {
    if (role !== 'pharmacy_staff') return
    setStaffConfirmedIds((prev) => new Set(prev).add(id))
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print()
  }

  return (
    <div className="space-y-4 text-gray-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-white">申し送り</h1>
          <p className="text-xs text-gray-400">{role === 'night_pharmacist' ? '今日、自分が作成した申し送りだけを表示し、必要に応じて編集します。' : 'SBAR形式で夜間対応内容を共有・確認'}</p>
          {role === 'pharmacy_admin' && (
            <p className="mt-1 text-[11px] text-amber-200">Pharmacy Admin は自局に対する夜間申し送りの最終確認責任者候補です。</p>
          )}
          {role === 'pharmacy_staff' && (
            <p className="mt-1 text-[11px] text-sky-200">Pharmacy Staff は申し送り確認者として閲覧・確認できます。最終確認責任は Pharmacy Admin 側に残します。</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-amber-500/40 bg-amber-500/20 text-amber-300"
          >
            未確認 {unconfirmedCount}件
          </Badge>
          <Button variant="outline" onClick={handlePrint} className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#1a2035]">
            <Printer className="h-4 w-4" />
            印刷
          </Button>
          {role !== 'night_pharmacist' && (
            <Link href="/dashboard/handovers/new">
              <Button className="bg-indigo-500 text-white hover:bg-indigo-500/90">
                <Plus className="h-4 w-4" />
                新規申し送り
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {visibleHandovers.length === 0 && role === 'night_pharmacist' ? (
          <Card className="border-[#2a3553] bg-[#1a2035]">
            <CardContent className="p-6 text-sm text-gray-400">本日、自分が作成した申し送りはありません。</CardContent>
          </Card>
        ) : visibleHandovers.map((handover) => {
          const isExpanded = expandedId === handover.id
          const isConfirmed = confirmedIds.has(handover.id)
          const isStaffConfirmed = staffConfirmedIds.has(handover.id)

          return (
            <Card key={handover.id} className="border-[#2a3553] bg-[#1a2035]">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/dashboard/handovers/${handover.id}`} className="hover:opacity-80">
                    <CardTitle className="text-base text-white">{handover.patientName}</CardTitle>
                    <p className="mt-1 text-xs text-gray-400">
                      担当: {handover.pharmacistName} ・ {handover.pharmacyName}
                    </p>
                    <p className="text-xs text-gray-500">{handover.timestamp}</p>
                  </Link>

                  <div className="flex items-center gap-2">
                    {role === 'night_pharmacist' && (
                      <Link href={`/dashboard/handovers/new?requestId=${handover.requestId ?? ''}`}>
                        <Button variant="outline" size="sm" className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#1a2035]">
                          <Pencil className="mr-1 h-3.5 w-3.5" />
                          編集
                        </Button>
                      </Link>
                    )}
                    <Badge
                      variant="outline"
                      className={cn(
                        'border',
                        isConfirmed
                          ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                          : 'border-amber-500/40 bg-amber-500/20 text-amber-300'
                      )}
                    >
                      {isConfirmed ? '最終確認済み' : '未確認'}
                    </Badge>
                    {isStaffConfirmed && !isConfirmed && (
                      <Badge variant="outline" className="border-sky-500/40 bg-sky-500/20 text-sky-300">
                        staff確認済み
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(isExpanded ? null : handover.id)}
                      className="text-gray-300 hover:bg-[#11182c] hover:text-white"
                    >
                      詳細
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-3 pt-0">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className={cn('rounded-lg border p-3', sbarStyles.situation.className)}>
                      <p className="text-xs font-semibold">{sbarStyles.situation.label}</p>
                      <p className="mt-2 text-sm leading-relaxed">{handover.situation}</p>
                    </div>
                    <div className={cn('rounded-lg border p-3', sbarStyles.background.className)}>
                      <p className="text-xs font-semibold">{sbarStyles.background.label}</p>
                      <p className="mt-2 text-sm leading-relaxed">{handover.background}</p>
                    </div>
                    <div className={cn('rounded-lg border p-3', sbarStyles.assessment.className)}>
                      <p className="text-xs font-semibold">{sbarStyles.assessment.label}</p>
                      <p className="mt-2 text-sm leading-relaxed">{handover.assessment}</p>
                    </div>
                    <div className={cn('rounded-lg border p-3', sbarStyles.recommendation.className)}>
                      <p className="text-xs font-semibold">{sbarStyles.recommendation.label}</p>
                      <p className="mt-2 text-sm leading-relaxed">{handover.recommendation}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
                    <p className="text-xs font-semibold text-gray-300">バイタル</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-200 sm:grid-cols-4">
                      <p>体温: {handover.vitals.temperature}℃</p>
                      <p>血圧: {handover.vitals.bloodPressure}</p>
                      <p>脈拍: {handover.vitals.pulse}/分</p>
                      <p>SpO2: {handover.vitals.spo2}%</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400">
                        {handover.confirmedAt ? `確認日時: ${handover.confirmedAt}` : '未確認の申し送りです'}
                      </p>
                      {role === 'pharmacy_admin' && (
                        <p className="inline-flex items-center gap-1 text-[11px] text-amber-200"><ShieldCheck className="h-3 w-3" />管理者確認の対象</p>
                      )}
                      {role === 'pharmacy_staff' && (
                        <p className="inline-flex items-center gap-1 text-[11px] text-sky-200">staff確認ログ対象</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {role === 'pharmacy_staff' && !isStaffConfirmed && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStaffConfirm(handover.id)}
                          className="border-sky-500/40 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          確認した
                        </Button>
                      )}
                      {role === 'pharmacy_admin' && !isConfirmed && (
                        <Button
                          size="sm"
                          onClick={() => handleConfirm(handover.id)}
                          className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          最終確認する
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
