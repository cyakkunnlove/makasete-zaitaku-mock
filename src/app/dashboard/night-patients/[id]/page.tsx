'use client'

import { useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { patientData, handoverData } from '@/lib/mock-data'
import { ArrowLeft, AlertTriangle, FileText, Phone, Pill, Stethoscope, User } from 'lucide-react'

function calculateAge(dob: string): number {
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default function NightPatientDetailPage() {
  const { role } = useAuth()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const [nightNote, setNightNote] = useState('')
  const requestId = searchParams.get('requestId')
  const source = searchParams.get('source') ?? 'request'
  const sourceLabel = source === 'fax' ? 'FAX確認' : source === 'phone' ? '電話受付' : '依頼確認'

  const patient = useMemo(() => patientData.find((p) => p.id === id), [id])
  const patientHandovers = useMemo(() => handoverData.filter((h) => h.patientId === id).slice(0, 3), [id])

  if (role !== 'night_pharmacist' && role !== 'regional_admin') {
    return (
      <Card className="border-[#2a3553] bg-[#1a2035] text-gray-100">
        <CardContent className="p-6 text-sm text-gray-400">この画面はNight PharmacistまたはRegional Adminのみ利用できます。</CardContent>
      </Card>
    )
  }

  if (!patient) {
    return (
      <Card className="border-[#2a3553] bg-[#1a2035] text-gray-100">
        <CardContent className="p-6 text-sm text-gray-400">患者が見つかりませんでした。</CardContent>
      </Card>
    )
  }

  const age = calculateAge(patient.dob)
  const maskedAddress = `${patient.address.slice(0, 12)}${patient.address.length > 12 ? '…' : ''}`

  return (
    <div className="space-y-4 text-gray-100">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/night-patients">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:bg-[#1a2035] hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-white">夜間患者詳細</h1>
          <p className="text-xs text-gray-400">{sourceLabel}後に患者を確認し、ここで受付登録する想定です。</p>
        </div>
      </div>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                確認ボタンを押した時刻をタイムスタンプとして記録し、受付時間としてタイムラインへ反映する想定です。{requestId ? ` 対象依頼: ${requestId}` : ''}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-white">{patient.name}</p>
                <Badge variant="outline" className={patient.status === 'active' ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' : 'border-gray-500/40 bg-gray-500/20 text-gray-300'}>
                  {patient.status === 'active' ? '利用中' : '休止'}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-gray-400">{patient.id} / {patient.dob} / {age}歳</p>
              <p className="mt-1 text-xs text-indigo-300">{patient.pharmacyName}</p>
              <p className="mt-1 text-xs text-gray-500">住所: {maskedAddress}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-white"><User className="h-4 w-4 text-indigo-400" />緊急連絡先</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-200">
            <p>{patient.emergencyContact.name}（{patient.emergencyContact.relation}）</p>
            <a href={`tel:${patient.emergencyContact.phone}`} className="inline-flex items-center gap-2 text-indigo-300 hover:text-indigo-200">
              <Phone className="h-3.5 w-3.5" />{patient.emergencyContact.phone}
            </a>
          </CardContent>
        </Card>

        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-white"><Stethoscope className="h-4 w-4 text-sky-400" />主治医情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-200">
            <p>{patient.doctor.name}</p>
            <p className="text-gray-400">{patient.doctor.clinic}</p>
            <a href={`tel:${patient.doctor.phone}`} className="inline-flex items-center gap-2 text-indigo-300 hover:text-indigo-200">
              <Phone className="h-3.5 w-3.5" />{patient.doctor.phone}
            </a>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-white"><AlertTriangle className="h-4 w-4 text-amber-400" />臨床・注意情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-200">
          <div>
            <p className="text-xs text-gray-500">主疾患</p>
            <p className="mt-1">{patient.diseaseName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">アレルギー</p>
            <p className="mt-1">{patient.allergies}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">既往歴</p>
            <p className="mt-1">{patient.medicalHistory}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-white"><Pill className="h-4 w-4 text-indigo-400" />現在薬</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-200">{patient.currentMeds}</CardContent>
      </Card>

      <Card className="border-amber-500/40 bg-amber-500/10">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-amber-200"><AlertTriangle className="h-4 w-4 text-amber-300" />訪問時注意事項</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed whitespace-pre-line text-amber-100">{patient.visitNotes}</CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-white"><FileText className="h-4 w-4 text-purple-400" />直近申し送り</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {patientHandovers.length === 0 ? (
            <p className="text-sm text-gray-400">申し送り履歴はありません。</p>
          ) : (
            patientHandovers.map((handover) => (
              <div key={handover.id} className="rounded-lg border border-[#2a3553] bg-[#111827] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">{handover.id}</p>
                  <p className="text-xs text-gray-500">{handover.timestamp}</p>
                </div>
                <p className="mt-2 text-xs text-gray-400">薬剤師: {handover.pharmacistName}</p>
                <p className="mt-2 text-sm text-gray-200">{handover.situation}</p>
                <p className="mt-2 text-xs text-purple-300">提言: {handover.recommendation}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-indigo-500/30 bg-indigo-500/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-indigo-100">受付登録</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3 text-sm">
            <div className="rounded-lg border border-indigo-500/20 bg-black/10 p-3">
              <p className="text-xs text-indigo-200/70">受付起点</p>
              <p className="mt-1 text-white">{sourceLabel}</p>
            </div>
            <div className="rounded-lg border border-indigo-500/20 bg-black/10 p-3">
              <p className="text-xs text-indigo-200/70">受付時間</p>
              <p className="mt-1 text-white">確認ボタン押下時刻</p>
            </div>
            <div className="rounded-lg border border-indigo-500/20 bg-black/10 p-3">
              <p className="text-xs text-indigo-200/70">次アクション</p>
              <p className="mt-1 text-white">対応開始 → 申し送り作成</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {requestId ? (
              <Link href={`/dashboard/requests/${requestId}`}>
                <Button className="bg-indigo-600 text-white hover:bg-indigo-500">確認して受付登録</Button>
              </Link>
            ) : (
              <Button className="bg-indigo-600 text-white hover:bg-indigo-500">確認して受付登録（モック）</Button>
            )}
            <Link href={requestId ? `/dashboard/requests/${requestId}` : '/dashboard/requests'}>
              <Button variant="outline" className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#1a2035]">案件詳細へ戻る</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white">夜間対応メモ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3 text-xs text-indigo-100">
            この画面では検索・閲覧・対応結果保存を監査対象にする想定です。異常時の通知先は System Admin / Regional Admin。
          </div>
          <Textarea
            value={nightNote}
            onChange={(e) => setNightNote(e.target.value)}
            placeholder="夜間対応結果や引継ぎメモを入力（モック）"
            className="min-h-[120px] border-[#2a3553] bg-[#11182c] text-gray-100"
          />
          <Button className="bg-indigo-600 text-white hover:bg-indigo-500">対応結果を保存（モック）</Button>
        </CardContent>
      </Card>
    </div>
  )
}
