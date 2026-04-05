'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, TriangleAlert, FileImage, ExternalLink, ArrowRight } from 'lucide-react'
import { patientData, requestData } from '@/lib/mock-data'

function calculateAge(dob: string): number {
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const requestCandidateMap: Record<string, string[]> = {
  'RQ-2401': ['PT-001'],
  'RQ-2402': ['PT-002'],
  'RQ-2403': ['PT-009'],
  'RQ-2404': ['PT-006'],
  'RQ-2405': ['PT-007'],
}

export default function NightPatientsPage() {
  const { role } = useAuth()
  const searchParams = useSearchParams()
  const requestId = searchParams.get('requestId')
  const source = searchParams.get('source') ?? 'request'
  const request = requestId ? requestData.find((item) => item.id === requestId) : null
  const sourceLabel = source === 'fax' ? 'FAX確認' : source === 'phone' ? '電話受付' : '依頼確認'

  const candidatePatients = useMemo(() => {
    if (!requestId) return []

    const candidateIds = requestCandidateMap[requestId] ?? []
    return candidateIds
      .map((id) => patientData.find((patient) => patient.id === id))
      .filter((patient): patient is NonNullable<typeof patient> => Boolean(patient))
  }, [requestId])

  if (role !== 'night_pharmacist' && role !== 'regional_admin') {
    return (
      <Card className="border-[#2a3553] bg-[#1a2035] text-gray-100">
        <CardContent className="p-6 text-sm text-gray-400">この画面はNight PharmacistまたはRegional Adminのみ利用できます。</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 text-gray-100">
      <div>
        <h1 className="text-lg font-semibold text-white">FAX確認・患者確認</h1>
        <p className="text-xs text-gray-400">{sourceLabel}後の確認画面です。FAX内容を見ながら患者候補を確認し、確定後に対応へ進みます。</p>
      </div>

      <Card className="border-amber-500/30 bg-amber-500/10">
        <CardContent className="space-y-2 p-4 text-xs text-amber-100">
          <p>この画面は患者検索そのものではなく、FAX確認後に候補患者を確認するための画面です。</p>
          <p>患者を確定した時刻がタイムスタンプとして記録され、受付時間としてタイムラインに反映されます。</p>
          {requestId && <p className="text-amber-200/80">対象依頼: {requestId}</p>}
        </CardContent>
      </Card>

      {request && (
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">FAX原本確認（依頼と共通）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-gray-300">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
                <p className="text-gray-500">受信時刻</p>
                <p className="mt-1 text-white">{request.receivedDate} {request.receivedAt}</p>
              </div>
              <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
                <p className="text-gray-500">FAX状況</p>
                <p className="mt-1 text-white">{request.status === 'fax_pending' ? 'FAX受信待ち' : 'FAX受信済み'}</p>
              </div>
              <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
                <p className="text-gray-500">状態</p>
                <p className="mt-1 text-white">患者・薬局 未特定</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-xl border border-amber-500/30 bg-[#11182c] p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileImage className="h-4 w-4 text-amber-300" />
                    <p className="text-sm font-medium text-white">処方箋FAX画像（依頼画面と共通）</p>
                  </div>
                  {request.faxImageUrl && (
                    <a href={request.faxImageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-indigo-300 hover:text-indigo-200">
                      開く
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
                <div className="mt-3 flex min-h-[280px] items-center justify-center rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5">
                  <div className="space-y-2 px-6 text-center">
                    <FileImage className="mx-auto h-10 w-10 text-amber-300" />
                    <p className="text-sm text-amber-100">FAXで届いた処方箋画像をここで確認</p>
                    <p className="text-[11px] text-amber-200/70">依頼 {request.id} のFAX原本を共通参照: {request.faxImageUrl ?? 'FAX受信後に表示'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                  <p className="text-sm font-medium text-amber-100">患者候補を確認してください</p>
                  <p className="mt-2 text-xs text-amber-200/80">FAX内容を見て候補患者を確認し、問題なければ受付を確定して対応へ進みます。</p>
                </div>
                <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3 text-[11px] text-gray-400">
                  受電メモはこの段階では仮情報です。患者候補とFAX画像の一致を優先して確認します。
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm text-white">
            <Search className="h-4 w-4 text-indigo-400" />
            確認患者
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
            <div className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 h-4 w-4 text-amber-300" />
              <p>ここは検索画面ではなく、FAX確認後に絞り込まれた患者候補を確認する画面です。</p>
            </div>
          </div>

          {candidatePatients.length === 0 ? (
            <Card className="border-[#2a3553] bg-[#11182c]">
              <CardContent className="p-4 text-sm text-gray-400">
                まだ患者候補がありません。FAX内容確認後に候補が表示されます。
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {candidatePatients.map((patient) => (
                <Card key={patient.id} className="border-indigo-500/30 bg-indigo-500/10">
                  <CardContent className="space-y-4 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-semibold text-white">{patient.name}</p>
                          <Badge
                            variant="outline"
                            className={patient.status === 'active' ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' : 'border-gray-500/40 bg-gray-500/20 text-gray-300'}
                          >
                            {patient.status === 'active' ? '利用中' : '休止'}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-gray-300">生年月日: {patient.dob} / {calculateAge(patient.dob)}歳</p>
                        <p className="mt-1 text-xs text-indigo-200">薬局: {patient.pharmacyName}</p>
                      </div>
                      <Badge variant="outline" className="border-indigo-500/40 bg-indigo-500/20 text-indigo-100">
                        候補確認済み
                      </Badge>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 text-sm">
                      <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
                        <p className="text-xs text-gray-500">確認ポイント</p>
                        <p className="mt-1 text-white">氏名・生年月日・薬局情報をFAX内容と照合</p>
                      </div>
                      <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
                        <p className="text-xs text-gray-500">確定後</p>
                        <p className="mt-1 text-white">受付時間を記録して、そのまま対応ページへ進む</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link href={`/dashboard/night-patients/${patient.id}?source=${source}${requestId ? `&requestId=${requestId}` : ''}`}>
                        <Button className="bg-indigo-600 text-white hover:bg-indigo-500">この患者を確認する</Button>
                      </Link>
                      {requestId && (
                        <Link href={`/dashboard/requests/${requestId}`}>
                          <Button variant="outline" className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#1a2035]">
                            対応ページを見る
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
