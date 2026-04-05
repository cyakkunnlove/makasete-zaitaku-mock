'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, TriangleAlert, FileImage, ExternalLink } from 'lucide-react'
import { patientData, requestData } from '@/lib/mock-data'

function calculateAge(dob: string): number {
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const patientNameReadings: Record<string, string[]> = {
  'PT-001': ['たなかゆうこ'],
  'PT-011': ['ささきこういち'],
  'PT-012': ['なかむらこういち'],
  'PT-013': ['まつもとこういち'],
  'PT-002': ['おがわまさこ'],
  'PT-003': ['はしもとかずこ'],
  'PT-004': ['しみずこういち'],
  'PT-005': ['いのうえこういち'],
  'PT-006': ['わたなべみわ'],
  'PT-007': ['やまもとなおこ'],
  'PT-008': ['もりたこういち'],
  'PT-009': ['はやしこういち'],
  'PT-010': ['たかだこういち'],
}

function normalizeText(value: string) {
  return value.replace(/[\s　\-ー]/g, '').toLowerCase()
}

function warekiToSeireki(input: string) {
  const normalized = normalizeText(input)
  const match = normalized.match(/^(令和|平成|昭和|r|h|s)(\d+|元)年?(\d{1,2})月?(\d{1,2})日?$/i)
  if (!match) return null

  const era = match[1].toLowerCase()
  const year = match[2] === '元' ? 1 : Number(match[2])
  const month = String(Number(match[3])).padStart(2, '0')
  const day = String(Number(match[4])).padStart(2, '0')

  let baseYear = 0
  if (era === '令和' || era === 'r') baseYear = 2018
  else if (era === '平成' || era === 'h') baseYear = 1988
  else if (era === '昭和' || era === 's') baseYear = 1925
  else return null

  return `${baseYear + year}-${month}-${day}`
}

function normalizeBirthDateInput(input: string) {
  const trimmed = input.trim()
  if (!trimmed) return null

  const fromWareki = warekiToSeireki(trimmed)
  if (fromWareki) return fromWareki

  const normalized = trimmed
    .replace(/[年月/.]/g, '-')
    .replace(/日/g, '')
    .replace(/\s+/g, '')
  const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (!match) return null

  const year = match[1]
  const month = String(Number(match[2])).padStart(2, '0')
  const day = String(Number(match[3])).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function NightPatientsPage() {
  const { role } = useAuth()
  const searchParams = useSearchParams()
  const [nameQuery, setNameQuery] = useState('')
  const [birthDateQuery, setBirthDateQuery] = useState('')
  const requestId = searchParams.get('requestId')
  const source = searchParams.get('source') ?? 'request'
  const request = requestId ? requestData.find((item) => item.id === requestId) : null
  const sourceLabel = source === 'fax' ? 'FAX確認' : source === 'phone' ? '電話受付' : '依頼確認'

  const normalizedName = normalizeText(nameQuery)
  const normalizedBirthDate = normalizeBirthDateInput(birthDateQuery)
  const canSearch = normalizedName.length > 0 && Boolean(normalizedBirthDate)

  const filtered = useMemo(() => {
    if (!canSearch || !normalizedBirthDate) return []

    return patientData.filter((patient) => {
      const nameMatch = normalizeText(patient.name).includes(normalizedName)
      const readingMatch = (patientNameReadings[patient.id] ?? []).some((reading) => normalizeText(reading).includes(normalizedName))
      const dobMatch = patient.dob === normalizedBirthDate
      return (nameMatch || readingMatch) && dobMatch
    })
  }, [canSearch, normalizedBirthDate, normalizedName])

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
        <h1 className="text-lg font-semibold text-white">夜間患者検索</h1>
        <p className="text-xs text-gray-400">{sourceLabel}後に患者を検索し、対象患者を確認して受付登録します。</p>
      </div>

      <Card className="border-amber-500/30 bg-amber-500/10">
        <CardContent className="space-y-2 p-4 text-xs text-amber-100">
          <p>検索範囲はリージョンアドミン管轄内の患者に限定します。全患者一覧は表示せず、検索ヒットした患者のみ確認します。</p>
          <p>「確認して受付登録」を押した時刻がタイムスタンプとして記録され、受付時間としてタイムラインに載る想定です。</p>
          <p>氏名だけでは候補は表示せず、氏名（漢字または読み仮名）と生年月日の両方を入力したときだけ候補を出します。</p>
          {requestId && <p className="text-amber-200/80">対象依頼: {requestId}</p>}
        </CardContent>
      </Card>

      {request && (
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">受付内容 / FAX確認</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-gray-300">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
                <p className="text-gray-500">受付時刻</p>
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
                    <p className="text-sm font-medium text-white">処方箋FAX画像</p>
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
                    <p className="text-[11px] text-amber-200/70">モックURL: {request.faxImageUrl ?? 'FAX受信後に表示'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
                  <p className="text-gray-500">受電メモ（未確認）</p>
                  <p className="mt-1 text-sm text-white">{request.symptom || '受電内容は未整理'}</p>
                  <p className="mt-2 text-gray-400">{request.notes ?? '補足メモなし'}</p>
                </div>
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                  <p className="text-amber-100">この時点では患者・薬局はまだ未特定です。FAX画像を主に確認しながら患者を特定します。</p>
                  <p className="mt-1 text-amber-200/80">受電メモは仮情報として扱い、候補患者を検索して確認してください。</p>
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
            患者検索
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              placeholder="氏名または読み仮名を入力"
              className="border-[#2a3553] bg-[#11182c] text-gray-100"
            />
            <Input
              value={birthDateQuery}
              onChange={(e) => setBirthDateQuery(e.target.value)}
              placeholder="生年月日（例: 1948-06-12 / 昭和23年6月12日）"
              className="border-[#2a3553] bg-[#11182c] text-gray-100"
            />
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
            <div className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 h-4 w-4 text-amber-300" />
              <p>氏名と生年月日の両方が一致したときだけ候補を表示します。氏名は読み仮名でも検索でき、生年月日は西暦・和暦どちらでも入力可能です。</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {canSearch && (
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white">検索結果 {filtered.length}件</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400">一致する患者が見つかりません。</p>
            ) : (
              filtered.map((patient) => (
                <Link key={patient.id} href={`/dashboard/night-patients/${patient.id}?source=${source}${requestId ? `&requestId=${requestId}` : ''}`}>
                  <div className="rounded-lg border border-[#2a3553] bg-[#111827] p-4 transition hover:border-indigo-500/40 hover:bg-[#151d30]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{patient.name}</p>
                          <Badge
                            variant="outline"
                            className={patient.status === 'active' ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' : 'border-gray-500/40 bg-gray-500/20 text-gray-300'}
                          >
                            {patient.status === 'active' ? '利用中' : '休止'}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-gray-400">{patient.id} / {patient.dob} / {calculateAge(patient.dob)}歳</p>
                        <p className="mt-1 text-xs text-indigo-300">{patient.pharmacyName}</p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        詳細を見る
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {!canSearch && (
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardContent className="p-4 text-xs text-gray-400">
            候補表示には、氏名（漢字または読み仮名）と生年月日の両方の入力が必要です。
          </CardContent>
        </Card>
      )}
    </div>
  )
}
