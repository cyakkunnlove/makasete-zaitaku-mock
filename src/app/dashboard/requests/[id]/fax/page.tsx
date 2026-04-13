'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { patientData, requestData, getAttentionFlags, getAttentionFlagClass } from '@/lib/mock-data'
import { ArrowLeft, FileImage, CheckCircle2, AlertTriangle, User, CalendarDays, Building2, MapPin, ArrowRight, ExternalLink } from 'lucide-react'

const requestCandidateMap: Record<string, string[]> = {
  'RQ-2401': ['PT-001'],
  'RQ-2402': ['PT-002'],
  'RQ-2403': ['PT-009'],
  'RQ-2404': ['PT-006'],
  'RQ-2405': ['PT-007'],
}

export default function RequestFaxReviewPage() {
  const params = useParams()
  const id = params.id as string
  const request = requestData.find((r) => r.id === id)
  const linkedPatient = request && request.patientId ? patientData.find((p) => p.id === request.patientId) : null

  const candidates = useMemo(() => {
    const candidateIds = requestCandidateMap[id] ?? []
    return candidateIds
      .map((patientId) => patientData.find((patient) => patient.id === patientId))
      .filter((patient): patient is NonNullable<typeof patient> => Boolean(patient))
  }, [id])

  const [selectedPatientId, setSelectedPatientId] = useState(linkedPatient?.id ?? candidates[0]?.id ?? '')
  const selectedPatient = candidates.find((patient) => patient.id === selectedPatientId) ?? linkedPatient ?? null

  if (!request) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="border-slate-200 bg-white text-slate-900 shadow-sm">
          <CardHeader>
            <CardTitle>依頼が見つかりません</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/requests">
              <Button variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                <ArrowLeft className="mr-2 h-4 w-4" />依頼一覧へ戻る
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 text-slate-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/requests/${request.id}`}>
            <Button variant="outline" size="icon" className="h-8 w-8 border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">FAX確認・患者確認</h1>
            <p className="text-xs text-slate-500">{request.id} ・ {request.receivedDate} {request.receivedAt} 受信</p>
          </div>
        </div>
        <Badge variant="outline" className="w-fit border-amber-500/40 bg-amber-500/20 text-amber-300">
          患者・薬局 未特定
        </Badge>
      </div>

      <Card className="border-amber-500/30 bg-amber-500/10">
        <CardContent className="space-y-2 p-4 text-xs text-amber-100">
          <p>この画面は患者検索ページではなく、FAX内容を確認して候補患者を照合するための画面です。</p>
          <p>患者を確定した時刻が受付時間として記録され、そのまま対応ページへ進む想定です。</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <FileImage className="h-4 w-4 text-indigo-500" />
              FAX原本確認（依頼と共通）
            </CardTitle>
            <CardDescription className="text-slate-500">
              このFAX原本は関連画面と同じ request.faxImageUrl を参照します。まずは原本を見て、患者候補との一致を確認します。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3 text-xs text-gray-300">
              <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
                <p className="text-gray-500">受信時刻</p>
                <p className="mt-1 text-white">{request.receivedDate} {request.receivedAt}</p>
              </div>
              <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
                <p className="text-gray-500">FAX状況</p>
                <p className="mt-1 text-white">{request.status === 'fax_pending' ? 'FAX受信待ち' : 'FAX受信済み'}</p>
              </div>
              <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
                <p className="text-gray-500">現在の状態</p>
                <p className="mt-1 text-white">患者・薬局 未特定</p>
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-[#3a4563] bg-[#11182c] p-6">
              <div className="aspect-[3/4] w-full rounded-lg border border-[#2a3553] bg-gradient-to-b from-white to-slate-100 p-6 text-slate-900 shadow-inner">
                <div className="flex items-start justify-between border-b border-slate-300 pb-3">
                  <div>
                    <p className="text-xs text-slate-500">受信FAX</p>
                    <p className="text-base font-bold">処方箋 / 夜間受付資料（共通FAX原本）</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">受信 {request.receivedDate} {request.receivedAt}</p>
                    {request.faxImageUrl && (
                      <a href={request.faxImageUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-700 hover:text-indigo-900">
                        原本を開く
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="mt-4 space-y-3 text-sm leading-6">
                  <p><span className="font-semibold">患者名:</span> （手書き・要確認）</p>
                  <p><span className="font-semibold">生年月日:</span> （要確認）</p>
                  <p><span className="font-semibold">薬局名:</span> （要確認）</p>
                  <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                    この時点では患者・薬局は未特定です。関連画面と同じFAX原本を見ている前提で、内容を優先して照合してください。
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-[#2a3553] bg-[#1a2035]">
            <CardHeader>
              <CardTitle className="text-white">確認患者</CardTitle>
              <CardDescription className="text-gray-400">
                FAX内容を見て絞り込まれた候補患者を確認します。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {candidates.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  まだ候補患者がありません。FAX内容の確認後に候補が表示されます。
                </div>
              ) : (
                candidates.map((patient) => {
                  const flags = getAttentionFlags(patient)
                  const selected = selectedPatientId === patient.id
                  return (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => setSelectedPatientId(patient.id)}
                      className={cn(
                        'w-full rounded-lg border p-4 text-left transition',
                        selected
                          ? 'border-indigo-300 bg-indigo-50'
                          : 'border-slate-200 bg-white hover:border-indigo-200'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{patient.name}</p>
                          <div className="mt-1 space-y-1 text-xs text-slate-500">
                            <p className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{patient.dob}</p>
                            <p className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{patient.pharmacyName}</p>
                            <p className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{patient.address}</p>
                          </div>
                        </div>
                        {selected && <CheckCircle2 className="h-5 w-5 text-indigo-400" />}
                      </div>
                      {flags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {flags.slice(0, 4).map((flag) => (
                            <Badge key={flag.key} variant="outline" className={cn('border text-[10px]', getAttentionFlagClass(flag.tone))}>
                              {flag.label}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </button>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card className="border-indigo-500/30 bg-indigo-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="h-4 w-4 text-indigo-200" />
                患者確認・受付確定
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-indigo-50">候補患者に問題なければ受付を確定します。確定した時刻が受付時間として記録されます。</p>
              <div className="grid gap-3 md:grid-cols-3 text-sm">
                <div className="rounded-lg border border-indigo-500/20 bg-black/10 p-3">
                  <p className="text-xs text-indigo-200/70">確認対象</p>
                  <p className="mt-1 text-white">{selectedPatient ? selectedPatient.name : '未選択'}</p>
                </div>
                <div className="rounded-lg border border-indigo-500/20 bg-black/10 p-3">
                  <p className="text-xs text-indigo-200/70">受付時間</p>
                  <p className="mt-1 text-white">確定時に自動記録</p>
                </div>
                <div className="rounded-lg border border-indigo-500/20 bg-black/10 p-3">
                  <p className="text-xs text-indigo-200/70">次の画面</p>
                  <p className="mt-1 text-white">対応ページ</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/dashboard/requests/${request.id}`}>
                  <Button className="bg-indigo-600 text-white hover:bg-indigo-500" disabled={!selectedPatient}>
                    この患者で受付確定
                  </Button>
                </Link>
                <Link href={`/dashboard/requests/${request.id}`}>
                  <Button variant="outline" className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#1a2035]">
                    対応ページへ進む
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="flex items-start gap-2 text-xs text-indigo-100/80">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                候補提示は補助のみです。最終判断はFAX原本の目視確認を前提にします。
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
