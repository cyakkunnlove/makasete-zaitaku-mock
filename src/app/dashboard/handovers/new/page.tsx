'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Loader2, Save, Sparkles, XCircle } from 'lucide-react'

import { useAuth } from '@/contexts/auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingState } from '@/components/common/LoadingState'
import { EmptyState } from '@/components/common/EmptyState'

type NightFlowCase = {
  id: string
  patientId: string | null
  sourcePharmacyId: string | null
  acceptedAt: string
  status: 'accepted' | 'in_progress' | 'completed' | 'pharmacy_confirmed' | 'cancelled'
  summary: string | null
  handoffNote: string | null
  morningRequest: string | null
  attentionLevel: '通常' | '要確認' | string | null
  patient: { id: string; fullName: string } | null
  pharmacy: { id: string; name: string } | null
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

function buildHandoverDraft(rawInput: string, patientName: string) {
  return `【申し送り】${patientName || '患者未特定'}様\n\n■ 対応概要\n夜間に状態変化の連絡を受け、対応を実施しました。\n\n■ 対応内容\n${rawInput.trim()}\n\n■ 翌朝への引き継ぎ事項\n・朝の時点で状態再確認をお願いします\n・必要時は主治医連携をお願いします`
}

export default function NewHandoverPage() {
  const { role } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedRequestId = searchParams.get('requestId') ?? ''

  const [cases, setCases] = useState<NightFlowCase[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState(requestedRequestId)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rawInput, setRawInput] = useState('')
  const [draftDoc, setDraftDoc] = useState('')
  const [morningRequest, setMorningRequest] = useState('')
  const [attentionLevel, setAttentionLevel] = useState<'通常' | '要確認'>('通常')
  const [adoptedDraft, setAdoptedDraft] = useState(false)

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

  const writableCases = useMemo(
    () => cases.filter((item) => item.status === 'accepted' || item.status === 'in_progress'),
    [cases],
  )

  const selectedCase = useMemo(
    () => cases.find((item) => item.id === selectedCaseId) ?? null,
    [cases, selectedCaseId],
  )

  useEffect(() => {
    if (selectedCaseId || writableCases.length === 0) return
    setSelectedCaseId(writableCases[0].id)
  }, [selectedCaseId, writableCases])

  useEffect(() => {
    if (!selectedCase) return
    setRawInput((current) => current || selectedCase.summary || '')
    setDraftDoc((current) => current || selectedCase.handoffNote || '')
    setMorningRequest((current) => current || selectedCase.morningRequest || '')
    setAttentionLevel(selectedCase.attentionLevel === '要確認' ? '要確認' : '通常')
  }, [selectedCase])

  const canWriteHandover = role === 'night_pharmacist'

  const handleGenerate = () => {
    if (!rawInput.trim()) return
    setDraftDoc(buildHandoverDraft(rawInput, selectedCase?.patient?.fullName ?? ''))
    setAdoptedDraft(false)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedCase || !draftDoc.trim() || !canWriteHandover) return

    setIsSaving(true)
    setError(null)
    try {
      const startResponse = selectedCase.status === 'accepted'
        ? await fetch(`/api/night-flow/cases/${selectedCase.id}/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
        : null
      if (startResponse && !startResponse.ok) throw new Error('start_failed')

      const response = await fetch(`/api/night-flow/cases/${selectedCase.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: rawInput.trim(),
          handoffNote: draftDoc.trim(),
          handoffResult: '薬局スタッフ確認が必要',
          morningRequest: morningRequest.trim(),
          attentionLevel,
        }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error ?? 'handover_save_failed')
      router.push('/dashboard/night-flow')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'handover_save_failed')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-gray-100">
        <div className="mx-auto max-w-3xl p-4 md:p-6">
          <Card className="border-[#2a3553] bg-[#111827]">
            <CardContent className="p-6">
              <LoadingState message="夜間対応案件を読み込み中です。" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!canWriteHandover) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] p-4 text-gray-100 md:p-6">
        <EmptyState title="権限がありません" description="申し送り作成は 夜間薬剤師 のDB夜間対応フローから実行します。" className="mx-auto max-w-xl border-[#2a3553] bg-[#111827] text-gray-100" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-100">
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/night-flow">
            <Button variant="ghost" size="icon" className="text-gray-300 hover:bg-[#1a2035] hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-white">夜間対応内容を残す</h1>
            <p className="text-xs text-gray-400">DB上の night-flow case に申し送り内容を保存します</p>
          </div>
        </div>

        {writableCases.length === 0 ? (
          <EmptyState title="保存対象の夜間対応がありません" description="受付済みまたは対応中の night-flow case がある場合だけ申し送りを作成できます。" className="border-[#2a3553] bg-[#111827] text-gray-100" />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="border-[#2a3553] bg-[#111827]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-white">夜間対応案件</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="case" className="text-gray-300">保存対象</Label>
                  <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
                    <SelectTrigger className="border-[#2a3553] bg-[#1a2035] text-gray-200">
                      <SelectValue placeholder="夜間対応を選択" />
                    </SelectTrigger>
                    <SelectContent className="border-[#2a3553] bg-[#1a2035] text-gray-200">
                      {writableCases.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.patient?.fullName ?? '患者未特定'} / {item.pharmacy?.name ?? '薬局未設定'} / {formatDateTime(item.acceptedAt)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedCase && (
                  <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
                    <div className="rounded-lg border border-[#2a3553] bg-[#1a2035] p-3">
                      <p className="text-gray-500">患者</p>
                      <p className="mt-1 text-gray-100">{selectedCase.patient?.fullName ?? '未特定'}</p>
                    </div>
                    <div className="rounded-lg border border-[#2a3553] bg-[#1a2035] p-3">
                      <p className="text-gray-500">薬局</p>
                      <p className="mt-1 text-gray-100">{selectedCase.pharmacy?.name ?? '未設定'}</p>
                    </div>
                    <div className="rounded-lg border border-[#2a3553] bg-[#1a2035] p-3">
                      <p className="text-gray-500">受付</p>
                      <p className="mt-1 text-gray-100">{formatDateTime(selectedCase.acceptedAt)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-[#2a3553] bg-[#111827]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-white">対応内容</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={rawInput}
                  onChange={(event) => setRawInput(event.target.value)}
                  placeholder="夜間対応で実施した内容を入力"
                  className="min-h-[140px] border-[#2a3553] bg-[#1a2035] text-gray-200 placeholder:text-gray-500"
                />
                <Button type="button" onClick={handleGenerate} disabled={!rawInput.trim()} className="w-full bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50">
                  <Sparkles className="mr-2 h-4 w-4" />
                  申し送り文面を整形
                </Button>
              </CardContent>
            </Card>

            <Card className="border-[#2a3553] bg-[#111827]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-white">申し送り本文</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={draftDoc}
                  onChange={(event) => {
                    setDraftDoc(event.target.value)
                    setAdoptedDraft(false)
                  }}
                  placeholder="日中スタッフへ共有する申し送り本文"
                  className="min-h-[220px] border-[#2a3553] bg-[#1a2035] text-gray-200 placeholder:text-gray-500"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" onClick={() => setAdoptedDraft(Boolean(draftDoc.trim()))} className="bg-emerald-600 text-white hover:bg-emerald-500">
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    この文面で保存する
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setAdoptedDraft(false)} className="border-[#2a3553] bg-[#1a2035] text-gray-200 hover:bg-[#212b45]">
                    <XCircle className="mr-1.5 h-4 w-4" />
                    未確定に戻す
                  </Button>
                  {adoptedDraft && <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/20 text-emerald-300">保存対象</Badge>}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#2a3553] bg-[#111827]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-white">朝の確認依頼</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={morningRequest}
                  onChange={(event) => setMorningRequest(event.target.value)}
                  placeholder="朝に薬局側で確認してほしいこと"
                  className="min-h-[100px] border-[#2a3553] bg-[#1a2035] text-gray-200 placeholder:text-gray-500"
                />
                <div className="space-y-2">
                  <Label className="text-gray-300">注意レベル</Label>
                  <Select value={attentionLevel} onValueChange={(value) => setAttentionLevel(value as '通常' | '要確認')}>
                    <SelectTrigger className="border-[#2a3553] bg-[#1a2035] text-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-[#2a3553] bg-[#1a2035] text-gray-200">
                      <SelectItem value="通常">通常</SelectItem>
                      <SelectItem value="要確認">要確認</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {error && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                保存に失敗しました: {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <Link href="/dashboard/night-flow">
                <Button type="button" variant="ghost" className="text-gray-300 hover:text-white">キャンセル</Button>
              </Link>
              <Button
                type="submit"
                disabled={isSaving || !selectedCase || !draftDoc.trim() || !adoptedDraft}
                className="bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                申し送りを保存
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
