'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { CheckCircle2, ChevronDown, ChevronUp, Plus, ShieldCheck, Printer } from 'lucide-react'
import { handoverData, sbarStyles } from '@/lib/mock-data'

export default function HandoversPage() {
  const { role } = useAuth()
  const [expandedId, setExpandedId] = useState<string | null>(handoverData[0]?.id ?? null)
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(
    () => new Set(handoverData.filter((h) => h.confirmed).map((h) => h.id))
  )

  const unconfirmedCount = useMemo(
    () => handoverData.filter((h) => !confirmedIds.has(h.id)).length,
    [confirmedIds]
  )

  const handleConfirm = (id: string) => {
    if (role !== 'pharmacy_admin') return
    setConfirmedIds((prev) => new Set(prev).add(id))
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print()
  }

  return (
    <div className="space-y-4 text-gray-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-white">申し送り</h1>
          <p className="text-xs text-gray-400">SBAR形式で夜間対応内容を共有・確認</p>
          {role === 'pharmacy_admin' && (
            <p className="mt-1 text-[11px] text-amber-200">Pharmacy Admin は自局に対する夜間申し送りの最終確認責任者候補です。</p>
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
          <Link href="/dashboard/handovers/new">
            <Button className="bg-indigo-500 text-white hover:bg-indigo-500/90">
              <Plus className="h-4 w-4" />
              新規申し送り
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {handoverData.map((handover) => {
          const isExpanded = expandedId === handover.id
          const isConfirmed = confirmedIds.has(handover.id)

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
                    <Badge
                      variant="outline"
                      className={cn(
                        'border',
                        isConfirmed
                          ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                          : 'border-amber-500/40 bg-amber-500/20 text-amber-300'
                      )}
                    >
                      {isConfirmed ? '確認済み' : '未確認'}
                    </Badge>
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
                    </div>

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
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
