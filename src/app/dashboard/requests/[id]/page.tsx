'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock3, FileText, User, Building2, AlertTriangle, ExternalLink } from 'lucide-react'

import { useAuth } from '@/contexts/auth-context'
import { adminCardClass, adminPageClass } from '@/components/admin-ui'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingState } from '@/components/common/LoadingState'
import { cn } from '@/lib/utils'

type NightFlowCase = {
  id: string
  patientId: string | null
  sourcePharmacyId: string | null
  acceptedChannel: 'phone' | 'fax'
  acceptedAt: string
  status: 'accepted' | 'in_progress' | 'completed' | 'pharmacy_confirmed' | 'cancelled'
  startedAt: string | null
  completedAt: string | null
  summary: string | null
  handoffNote: string | null
  handoffResult: string | null
  morningRequest: string | null
  attentionLevel: '通常' | '要確認' | string | null
  patient: { id: string; fullName: string; dateOfBirth?: string | null; phone?: string | null } | null
  pharmacy: { id: string; name: string; phone?: string | null; fax?: string | null } | null
  handledBy: { id: string; displayName: string; role: string } | null
  fax: { id: string; attachmentUrl: string | null; linkedAt: string | null } | null
}

type NightFlowResponse = {
  visibleDashboardCases?: NightFlowCase[]
  cases?: NightFlowCase[]
}

const statusLabel: Record<NightFlowCase['status'], string> = {
  accepted: '受付済み',
  in_progress: '対応中',
  completed: '対応完了',
  pharmacy_confirmed: '薬局確認済み',
  cancelled: '取消',
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function RequestDetailPage() {
  const params = useParams()
  const { role } = useAuth()
  const id = params.id as string
  const [cases, setCases] = useState<NightFlowCase[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    fetch('/api/night-flow', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => null) as NightFlowResponse | null
        if (!response.ok || !data) throw new Error('night_flow_fetch_failed')
        if (active) setCases(data.visibleDashboardCases ?? data.cases ?? [])
      })
      .catch(() => {
        if (active) setCases([])
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const requestCase = useMemo(() => cases.find((item) => item.id === id) ?? null, [cases, id])
  const isAdmin = role === 'regional_admin' || role === 'system_admin'
  const showPatientDetails = role === 'night_pharmacist' || role === 'pharmacy_admin' || role === 'pharmacy_staff'

  if (isLoading) {
    return (
      <div className={`${adminPageClass} space-y-4`}>
        <Card className={adminCardClass}>
          <CardContent className="p-6">
            <LoadingState message="夜間依頼を読み込み中です。" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!requestCase) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          title="DB上の夜間依頼が見つかりません"
          description={`ID: ${id} は現在の権限範囲で表示できる night-flow case ではありません。旧mock依頼詳細は実患者POC対象外です。`}
          className={`${adminCardClass} w-full max-w-xl`}
          action={(
            <Link href="/dashboard/requests">
              <Button variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                <ArrowLeft className="mr-2 h-4 w-4" />
                依頼一覧へ戻る
              </Button>
            </Link>
          )}
        />
      </div>
    )
  }

  return (
    <div className={`${adminPageClass} space-y-4`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/requests">
            <Button variant="outline" size="icon" className="h-8 w-8 border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{requestCase.id}</h1>
            <p className="text-xs text-slate-500">DB-backed night-flow case</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
            {requestCase.acceptedChannel === 'fax' ? 'FAX' : '電話'}受付
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              'border text-xs',
              requestCase.status === 'completed' || requestCase.status === 'pharmacy_confirmed'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : requestCase.status === 'cancelled'
                  ? 'border-slate-200 bg-slate-100 text-slate-500'
                  : 'border-amber-200 bg-amber-50 text-amber-700',
            )}
          >
            {statusLabel[requestCase.status]}
          </Badge>
        </div>
      </div>

      {isAdmin && (
        <Card className="border-amber-200 bg-amber-50 shadow-sm">
          <CardContent className="flex items-start gap-2 p-4 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            運営管理ロールでは、夜間対応の監督に必要な範囲だけを表示します。患者個票・FAX原本の詳細閲覧は例外条件に限定します。
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className={adminCardClass}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-900">
              <Clock3 className="h-4 w-4 text-indigo-500" />
              受付・対応状況
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-slate-500">受付</p>
                <p className="mt-1 text-slate-900">{formatDateTime(requestCase.acceptedAt)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-slate-500">対応開始</p>
                <p className="mt-1 text-slate-900">{formatDateTime(requestCase.startedAt)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-slate-500">完了</p>
                <p className="mt-1 text-slate-900">{formatDateTime(requestCase.completedAt)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-slate-500">担当</p>
                <p className="mt-1 text-slate-900">{requestCase.handledBy?.displayName ?? '未割当'}</p>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">受付概要</p>
              <p className="mt-1 text-slate-900">{requestCase.summary || '未入力'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className={adminCardClass}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-900">
              <User className="h-4 w-4 text-indigo-500" />
              {showPatientDetails ? '患者・薬局' : '患者特定状況'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">薬局</p>
              <p className="mt-1 flex items-center gap-1 text-slate-900">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                {requestCase.pharmacy?.name ?? '未設定'}
              </p>
            </div>
            {showPatientDetails ? (
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs text-slate-500">患者</p>
                <p className="mt-1 text-slate-900">{requestCase.patient?.fullName ?? '未特定'}</p>
                {requestCase.patient?.dateOfBirth && <p className="mt-1 text-xs text-slate-500">生年月日: {requestCase.patient.dateOfBirth}</p>}
                {requestCase.patient?.phone && <p className="mt-1 text-xs text-slate-500">電話: {requestCase.patient.phone}</p>}
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
                患者は {requestCase.patientId ? '特定済み' : '未特定'} です。氏名・住所・連絡先はこのロールでは表示しません。
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className={adminCardClass}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm text-slate-900">
            <FileText className="h-4 w-4 text-indigo-500" />
            申し送り
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">対応メモ</p>
            <p className="mt-1 whitespace-pre-wrap text-slate-900">{requestCase.handoffNote || '未入力'}</p>
          </div>
          {requestCase.morningRequest && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs text-amber-700">朝の確認依頼</p>
              <p className="mt-1 whitespace-pre-wrap text-slate-900">{requestCase.morningRequest}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/night-flow">
              <Button className="bg-indigo-600 text-white hover:bg-indigo-500">夜間対応を開く</Button>
            </Link>
            {requestCase.fax?.attachmentUrl && (
              <Link href={`/dashboard/requests/${requestCase.id}/fax`}>
                <Button variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                  FAX確認
                  <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
