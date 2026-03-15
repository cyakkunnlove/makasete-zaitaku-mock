'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { patientData, requestData, getAttentionFlags, getAttentionFlagClass } from '@/lib/mock-data'
import { ArrowLeft, FileImage, Search, CheckCircle2, AlertTriangle, User, CalendarDays, Building2, MapPin } from 'lucide-react'

export default function RequestFaxReviewPage() {
  const params = useParams()
  const id = params.id as string
  const request = requestData.find((r) => r.id === id)
  const linkedPatient = request && request.patientId ? patientData.find((p) => p.id === request.patientId) : null
  const isLinked = Boolean(request?.patientId && linkedPatient)

  const [patientNameQuery, setPatientNameQuery] = useState(linkedPatient?.name ?? '')
  const [dobQuery, setDobQuery] = useState(linkedPatient?.dob ?? '')
  const [pharmacyQuery, setPharmacyQuery] = useState(request?.pharmacyName ?? '')
  const [selectedPatientId, setSelectedPatientId] = useState(linkedPatient?.id ?? '')

  const candidates = useMemo(() => {
    return patientData.filter((patient) => {
      const matchName = patientNameQuery ? patient.name.includes(patientNameQuery) : true
      const matchDob = dobQuery ? patient.dob.includes(dobQuery) : true
      const matchPharmacy = pharmacyQuery ? patient.pharmacyName.includes(pharmacyQuery) : true
      return matchName && matchDob && matchPharmacy
    })
  }, [patientNameQuery, dobQuery, pharmacyQuery])

  if (!request) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="border-[#2a3553] bg-[#1a2035] text-gray-100">
          <CardHeader>
            <CardTitle>依頼が見つかりません</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/requests">
              <Button variant="outline" className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#212b45]">
                <ArrowLeft className="mr-2 h-4 w-4" />依頼一覧へ戻る
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 text-gray-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/requests/${request.id}`}>
            <Button variant="outline" size="icon" className="h-8 w-8 border-[#2a3553] bg-[#1a2035] text-gray-300 hover:bg-[#212b45]">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-white">FAX確認 / 患者特定</h1>
            <p className="text-xs text-gray-400">{request.id} ・ {request.pharmacyName} ・ {request.receivedDate} {request.receivedAt}</p>
          </div>
        </div>
        <Badge variant="outline" className="border-amber-500/40 bg-amber-500/20 text-amber-300 w-fit">
          Phase 1: 目視確認前提
        </Badge>
      </div>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-white">患者特定ステータス</p>
              <p className="text-xs text-gray-400">
                {isLinked
                  ? `患者 ${linkedPatient?.name} に紐付け済み`
                  : 'まだ患者は確定していません。FAX原本を見て候補比較してください。'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn('border text-xs', isLinked ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' : 'border-purple-500/40 bg-purple-500/20 text-purple-300')}>
                {isLinked ? '特定済み' : '未特定'}
              </Badge>
              {isLinked && request?.patientLinkedBy && (
                <Badge variant="outline" className="border-indigo-500/40 bg-indigo-500/20 text-indigo-300 text-xs">
                  {request.patientLinkedBy} / {request.patientLinkedAt}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FileImage className="h-4 w-4 text-indigo-400" />
              FAX原本
            </CardTitle>
            <CardDescription className="text-gray-400">
              OCR確定はせず、原本を見ながら患者を特定するモックです。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-dashed border-[#3a4563] bg-[#11182c] p-6">
              <div className="aspect-[3/4] w-full rounded-lg border border-[#2a3553] bg-gradient-to-b from-white to-slate-100 p-6 text-slate-900 shadow-inner">
                <div className="flex items-start justify-between border-b border-slate-300 pb-3">
                  <div>
                    <p className="text-xs text-slate-500">受信FAX</p>
                    <p className="text-base font-bold">夜間対応依頼書</p>
                  </div>
                  <p className="text-xs text-slate-500">受信 {request.receivedDate} {request.receivedAt}</p>
                </div>
                <div className="mt-4 space-y-3 text-sm leading-6">
                  <p><span className="font-semibold">送信元薬局:</span> {request.pharmacyName}</p>
                  <p><span className="font-semibold">患者名:</span> {linkedPatient?.name ?? '（手書き・要確認）'}</p>
                  <p><span className="font-semibold">生年月日:</span> {linkedPatient?.dob ?? '（判読補助が必要）'}</p>
                  <p><span className="font-semibold">主訴:</span> {request.symptom}</p>
                  <p><span className="font-semibold">バイタル変化:</span> {request.vitalsChange}</p>
                  <p><span className="font-semibold">意識レベル:</span> {request.consciousness}</p>
                  <p><span className="font-semibold">緊急度:</span> {request.urgency}</p>
                  <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                    最終的な患者確定は夜間薬剤師が原本を見て判断する想定
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-[#2a3553] bg-[#1a2035]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Search className="h-4 w-4 text-indigo-400" />
                患者検索
              </CardTitle>
              <CardDescription className="text-gray-400">
                患者名 / 生年月日 / 薬局名 の3キーで候補を絞ります。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label className="text-gray-200">患者名</Label>
                <Input value={patientNameQuery} onChange={(e) => setPatientNameQuery(e.target.value)} className="border-[#2a3553] bg-[#11182c]" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-200">生年月日</Label>
                <Input value={dobQuery} onChange={(e) => setDobQuery(e.target.value)} placeholder="1948-06-12" className="border-[#2a3553] bg-[#11182c]" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-200">薬局名</Label>
                <Input value={pharmacyQuery} onChange={(e) => setPharmacyQuery(e.target.value)} className="border-[#2a3553] bg-[#11182c]" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#2a3553] bg-[#1a2035]">
            <CardHeader>
              <CardTitle className="text-white">候補患者</CardTitle>
              <CardDescription className="text-gray-400">検索候補に出す時点で制限をかける想定のモック</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {candidates.length === 0 ? (
                <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-4 text-sm text-gray-400">
                  候補患者が見つかりません。
                </div>
              ) : (
                candidates.slice(0, 5).map((patient) => {
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
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-[#2a3553] bg-[#11182c] hover:border-indigo-500/40'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{patient.name}</p>
                          <div className="mt-1 space-y-1 text-xs text-gray-400">
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

          <Card className="border-[#2a3553] bg-[#1a2035]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="h-4 w-4 text-indigo-400" />
                確定アクション
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                実装フェーズではここで `patient_linked` / `fax_opened` / `patient_search` のログを保存する想定です。
              </div>
              {isLinked && linkedPatient ? (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                  <p className="font-medium">現在の紐付け先: {linkedPatient.name}</p>
                  <p className="mt-1 text-xs text-emerald-200/80">必要なら候補を再選択して再確定する前提でUIを拡張可能です。</p>
                </div>
              ) : (
                <Button className="w-full bg-indigo-500 text-white hover:bg-indigo-500/90" disabled={!selectedPatientId}>
                  この患者で確定して対応へ進む
                </Button>
              )}
              <div className="flex items-start gap-2 text-xs text-gray-400">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                候補提示は補助のみ。最終判断は夜間薬剤師の目視確認前提。
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
