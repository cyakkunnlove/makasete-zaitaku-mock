'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, ExternalLink, FileImage, ShieldCheck } from 'lucide-react'

import { adminCardClass, adminPageClass } from '@/components/admin-ui'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingState } from '@/components/common/LoadingState'

type NightFlowCase = {
  id: string
  acceptedAt: string
  acceptedChannel: 'phone' | 'fax'
  patient: { id: string; fullName: string } | null
  pharmacy: { id: string; name: string } | null
  fax: { id: string; title: string; attachmentUrl: string | null; receivedAt: string; linkedAt: string | null; status: string } | null
}

type NightFlowResponse = {
  visibleDashboardCases?: NightFlowCase[]
  cases?: NightFlowCase[]
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

export default function RequestFaxReviewPage() {
  const params = useParams()
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

  if (isLoading) {
    return (
      <div className={`${adminPageClass} space-y-4`}>
        <Card className={adminCardClass}>
          <CardContent className="p-6">
            <LoadingState message="FAX情報を読み込み中です。" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!requestCase) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          title="DB上のFAX確認対象が見つかりません"
          description={`ID: ${id} は現在の権限範囲で表示できる night-flow case ではありません。旧mock FAX画面は実患者POC対象外です。`}
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
          <Link href={`/dashboard/requests/${requestCase.id}`}>
            <Button variant="outline" size="icon" className="h-8 w-8 border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">FAX確認</h1>
            <p className="text-xs text-slate-500">{requestCase.id} ・ DB-backed night-flow case</p>
          </div>
        </div>
      </div>

      <Card className="border-amber-200 bg-amber-50 shadow-sm">
        <CardContent className="flex items-start gap-2 p-4 text-xs text-amber-800">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          実患者POCではFAX添付は非公開Storageとsigned URLを前提に扱います。この画面はDBに紐づいたFAXだけを表示し、mock原本は表示しません。
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className={adminCardClass}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <FileImage className="h-4 w-4 text-indigo-500" />
              FAX添付
            </CardTitle>
            <CardDescription className="text-slate-500">
              fax_attachments に紐づいた添付情報だけを表示します。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {requestCase.fax ? (
              <>
                <div className="grid gap-3 text-xs md:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-slate-500">受信</p>
                    <p className="mt-1 text-slate-900">{formatDateTime(requestCase.fax.receivedAt)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-slate-500">紐付け</p>
                    <p className="mt-1 text-slate-900">{formatDateTime(requestCase.fax.linkedAt)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-slate-500">状態</p>
                    <p className="mt-1 text-slate-900">{requestCase.fax.status}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">{requestCase.fax.title}</p>
                  <p className="mt-1 break-all text-xs text-slate-500">{requestCase.fax.attachmentUrl ?? '添付URL未設定'}</p>
                  {requestCase.fax.attachmentUrl && (
                    <a href={requestCase.fax.attachmentUrl} target="_blank" rel="noreferrer">
                      <Button className="mt-3 bg-indigo-600 text-white hover:bg-indigo-500">
                        添付を開く
                        <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </a>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                この夜間依頼には、DB上で紐づいたFAX添付がまだありません。
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={adminCardClass}>
          <CardHeader>
            <CardTitle className="text-slate-900">紐付け先</CardTitle>
            <CardDescription className="text-slate-500">FAX確認後に扱う患者・薬局のDB情報です。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">患者</p>
              <p className="mt-1 text-slate-900">{requestCase.patient?.fullName ?? '未特定'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">薬局</p>
              <p className="mt-1 text-slate-900">{requestCase.pharmacy?.name ?? '未設定'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard/requests/${requestCase.id}`}>
                <Button variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">依頼詳細へ戻る</Button>
              </Link>
              <Link href="/dashboard/night-flow">
                <Button className="bg-indigo-600 text-white hover:bg-indigo-500">夜間対応を開く</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
