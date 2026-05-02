'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, AlertTriangle, FileText, Phone, Pill, Stethoscope, User } from 'lucide-react'

type NightPatientDetailRecord = {
  id: string
  fullName: string
  dateOfBirth?: string | null
  address?: string | null
  pharmacyName?: string | null
  status?: string | null
  emergencyContact?: { name?: string | null; relation?: string | null; phone?: string | null }
  doctor?: { name?: string | null; clinic?: string | null; phone?: string | null }
  diseaseName?: string | null
  allergies?: string | null
  medicalHistory?: string | null
  currentMeds?: string | null
  visitNotes?: string | null
}

function normalizePatient(row: Record<string, unknown>): NightPatientDetailRecord {
  const pharmacy = row.pharmacy
  const emergencyContact = typeof row.emergencyContact === 'object' && row.emergencyContact
    ? row.emergencyContact as NightPatientDetailRecord['emergencyContact']
    : null
  const doctor = typeof row.doctor === 'object' && row.doctor
    ? row.doctor as NightPatientDetailRecord['doctor']
    : null

  return {
    id: String(row.id ?? ''),
    fullName: String(row.fullName ?? row.name ?? ''),
    dateOfBirth: typeof row.dateOfBirth === 'string' ? row.dateOfBirth : typeof row.dob === 'string' ? row.dob : null,
    address: typeof row.address === 'string' ? row.address : null,
    pharmacyName: typeof row.pharmacyName === 'string'
      ? row.pharmacyName
      : typeof pharmacy === 'object' && pharmacy && 'name' in pharmacy
        ? String((pharmacy as Record<string, unknown>).name ?? '')
        : null,
    status: typeof row.status === 'string' ? row.status : null,
    emergencyContact: emergencyContact ?? undefined,
    doctor: doctor ?? undefined,
    diseaseName: typeof row.diseaseName === 'string' ? row.diseaseName : null,
    allergies: typeof row.allergies === 'string' ? row.allergies : null,
    medicalHistory: typeof row.medicalHistory === 'string' ? row.medicalHistory : null,
    currentMeds: typeof row.currentMeds === 'string' ? row.currentMeds : null,
    visitNotes: typeof row.visitNotes === 'string' ? row.visitNotes : null,
  }
}

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
  const [patients, setPatients] = useState<NightPatientDetailRecord[]>([])
  const [loadingPatient, setLoadingPatient] = useState(true)
  const [patientFetchError, setPatientFetchError] = useState<string | null>(null)
  const requestId = searchParams.get('requestId')
  const source = searchParams.get('source') ?? 'request'
  const sourceLabel = source === 'fax' ? 'FAX確認' : source === 'phone' ? '電話受付' : '依頼確認'

  useEffect(() => {
    let cancelled = false

    async function fetchNightPatients() {
      setLoadingPatient(true)
      setPatientFetchError(null)
      try {
        const response = await fetch('/api/night-flow', { cache: 'no-store' })
        const result = await response.json().catch(() => null)
        if (cancelled) return
        if (!response.ok || !Array.isArray(result?.patients)) {
          setPatients([])
          setPatientFetchError('night_patient_fetch_failed')
          return
        }
        setPatients(
          result.patients
            .map((row: Record<string, unknown>) => normalizePatient(row))
            .filter((patient: NightPatientDetailRecord) => patient.id && patient.fullName),
        )
      } catch {
        if (!cancelled) {
          setPatients([])
          setPatientFetchError('night_patient_fetch_failed')
        }
      } finally {
        if (!cancelled) setLoadingPatient(false)
      }
    }

    fetchNightPatients()
    return () => {
      cancelled = true
    }
  }, [])

  const patient = useMemo(() => patients.find((item) => item.id === id) ?? null, [id, patients])
  const patientHandovers: Array<{ id: string; timestamp: string; pharmacistName: string; situation: string; recommendation: string }> = []

  if (role !== 'night_pharmacist' && role !== 'regional_admin') {
    return (
      <Card className="border-[#2a3553] bg-[#1a2035] text-gray-100">
        <CardContent className="p-6 text-sm text-gray-400">この画面はNight PharmacistまたはRegional Adminのみ利用できます。</CardContent>
      </Card>
    )
  }

  if (loadingPatient) {
    return (
      <Card className="border-[#2a3553] bg-[#1a2035] text-gray-100">
        <CardContent className="p-6 text-sm text-gray-400">患者情報を読み込んでいます。</CardContent>
      </Card>
    )
  }

  if (!patient) {
    return (
      <Card className="border-[#2a3553] bg-[#1a2035] text-gray-100">
        <CardContent className="p-6 text-sm text-gray-400">
          {patientFetchError ? '患者情報を取得できませんでした。夜間フローの権限またはDB接続を確認してください。' : '患者が見つかりませんでした。'}
        </CardContent>
      </Card>
    )
  }

  const age = patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : null
  const address = patient.address ?? '住所未設定'
  const maskedAddress = `${address.slice(0, 12)}${address.length > 12 ? '…' : ''}`
  const emergencyContact = patient.emergencyContact ?? {}
  const doctor = patient.doctor ?? {}

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
                ここでは患者確認の最終確認を行います。確定した時刻がタイムスタンプとして記録され、受付時間としてタイムラインへ反映されます。{requestId ? ` 対象依頼: ${requestId}` : ''}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-white">{patient.fullName}</p>
                <Badge variant="outline" className={patient.status === 'active' ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' : 'border-gray-500/40 bg-gray-500/20 text-gray-300'}>
                  {patient.status === 'active' ? '利用中' : '休止'}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-gray-400">{patient.id} / {patient.dateOfBirth ?? '生年月日未設定'}{age == null ? '' : ` / ${age}歳`}</p>
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
            <p>{emergencyContact.name ?? '未設定'}（{emergencyContact.relation ?? '未設定'}）</p>
            <a href={`tel:${emergencyContact.phone ?? ''}`} className="inline-flex items-center gap-2 text-indigo-300 hover:text-indigo-200">
              <Phone className="h-3.5 w-3.5" />{emergencyContact.phone ?? '-'}
            </a>
          </CardContent>
        </Card>

        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-white"><Stethoscope className="h-4 w-4 text-sky-400" />主治医情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-200">
            <p>{doctor.name ?? '未設定'}</p>
            <p className="text-gray-400">{doctor.clinic ?? '未設定'}</p>
            <a href={`tel:${doctor.phone ?? ''}`} className="inline-flex items-center gap-2 text-indigo-300 hover:text-indigo-200">
              <Phone className="h-3.5 w-3.5" />{doctor.phone ?? '-'}
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
            <p className="mt-1">{patient.diseaseName ?? '未設定'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">アレルギー</p>
            <p className="mt-1">{patient.allergies ?? 'なし'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">既往歴</p>
            <p className="mt-1">{patient.medicalHistory ?? '未設定'}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-white"><Pill className="h-4 w-4 text-indigo-400" />現在薬</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-200">{patient.currentMeds ?? '未設定'}</CardContent>
      </Card>

      <Card className="border-amber-500/40 bg-amber-500/10">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-amber-200"><AlertTriangle className="h-4 w-4 text-amber-300" />訪問時注意事項</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed whitespace-pre-line text-amber-100">{patient.visitNotes ?? '未設定'}</CardContent>
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
          <CardTitle className="text-sm text-indigo-100">患者確認・受付確定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-indigo-50">この患者で問題なければ、受付を確定します。確定した時刻が受付時間として記録されます。</p>
          <div className="grid gap-3 md:grid-cols-3 text-sm">
            <div className="rounded-lg border border-indigo-500/20 bg-black/10 p-3">
              <p className="text-xs text-indigo-200/70">受付起点</p>
              <p className="mt-1 text-white">{sourceLabel}</p>
            </div>
            <div className="rounded-lg border border-indigo-500/20 bg-black/10 p-3">
              <p className="text-xs text-indigo-200/70">受付時間</p>
              <p className="mt-1 text-white">確定時に自動記録</p>
            </div>
            <div className="rounded-lg border border-indigo-500/20 bg-black/10 p-3">
              <p className="text-xs text-indigo-200/70">現在の状態</p>
              <p className="mt-1 text-white">未登録</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {requestId ? (
              <Link href={`/dashboard/requests/${requestId}`}>
                <Button className="bg-indigo-600 text-white hover:bg-indigo-500">この患者で受付確定</Button>
              </Link>
            ) : (
              <Button className="bg-indigo-600 text-white hover:bg-indigo-500">この患者で受付確定</Button>
            )}
            <Link href="/dashboard/night-patients">
              <Button variant="outline" className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#1a2035]">患者検索に戻る</Button>
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
            placeholder="夜間対応結果や引継ぎメモを入力"
            className="min-h-[120px] border-[#2a3553] bg-[#11182c] text-gray-100"
          />
          <Button className="bg-indigo-600 text-white hover:bg-indigo-500">対応結果を保存</Button>
        </CardContent>
      </Card>
    </div>
  )
}
