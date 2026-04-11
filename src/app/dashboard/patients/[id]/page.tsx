'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  requestData,
  handoverData,
  pharmacyData,
  getAttentionFlags,
  getAttentionFlagClass,
  statusMeta,
} from '@/lib/mock-data'
import { formatVisitRuleSummary, getPatientMasterRecords, loadRegisteredPatients, updateRegisteredPatient, type RegisteredPatientRecord } from '@/lib/patient-master'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Heart,
  AlertTriangle,
  Pill,
  FileText,
  Stethoscope,
  Clock3,
  ExternalLink,
  Save,
  ShieldCheck,
} from 'lucide-react'
import { VisitSchedule } from '@/components/visit-schedule'

type VisitRecordDraft = {
  id: string
  visitDate: string
  visitType: string
  staffName: string
  completed: boolean
  billable: boolean
  amount: number
  billingStatus: 'unbilled' | 'ready' | 'billed'
  note: string
}

function calculateAge(dob: string): number {
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export default function PatientDetailPage() {
  const { role } = useAuth()
  const params = useParams()
  const id = params.id as string
  const [registeredPatients, setRegisteredPatients] = useState<RegisteredPatientRecord[]>([])

  useEffect(() => {
    const syncPatients = () => setRegisteredPatients(loadRegisteredPatients())
    syncPatients()
    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === 'makasete-patient-master:v1') {
        syncPatients()
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const patientMaster = useMemo(() => getPatientMasterRecords(registeredPatients), [registeredPatients])
  const patient = useMemo(() => patientMaster.find((p) => p.id === id), [id, patientMaster])

  useEffect(() => {
    if (!patient) return
    setEditForm({
      phone: patient.phone ?? '',
      visitNotes: patient.visitNotes ?? '',
      currentMeds: patient.currentMeds ?? '',
      medicalHistory: patient.medicalHistory ?? '',
      allergies: patient.allergies ?? '',
      insuranceInfo: patient.insuranceInfo ?? '',
    })
  }, [patient])

  const pharmacy = useMemo(
    () => (patient ? pharmacyData.find((ph) => ph.id === patient.pharmacyId) : undefined),
    [patient]
  )

  const patientRequests = useMemo(
    () => (patient ? requestData.filter((r) => r.patientId === patient.id) : []),
    [patient]
  )

  const patientHandovers = useMemo(
    () => (patient ? handoverData.filter((h) => h.patientId === patient.id) : []),
    [patient]
  )

  const [visitDialogOpen, setVisitDialogOpen] = useState(false)
  const [visitRecords, setVisitRecords] = useState<VisitRecordDraft[]>([])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editSavedNotice, setEditSavedNotice] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    phone: '',
    visitNotes: '',
    currentMeds: '',
    medicalHistory: '',
    allergies: '',
    insuranceInfo: '',
  })
  const [visitForm, setVisitForm] = useState({
    visitDate: '2026-03-16',
    visitType: '定期',
    staffName: '小林 薫',
    completed: true,
    billable: true,
    amount: 9800,
    note: '',
  })

  if (!patient) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardContent className="p-8 text-center">
            <User className="mx-auto mb-3 h-10 w-10 text-gray-500" />
            <p className="text-sm text-gray-400">患者が見つかりませんでした。</p>
            <Link href="/dashboard/patients">
              <Button variant="outline" className="mt-4 border-[#2a3553] text-gray-300 hover:bg-[#1a2035]">
                <ArrowLeft className="mr-2 h-4 w-4" />
                患者一覧に戻る
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const age = calculateAge(patient.dob)
  const isRegionalAdmin = role === 'regional_admin'
  const isPharmacyAdmin = role === 'pharmacy_admin'
  const isPharmacyStaff = role === 'pharmacy_staff'
  const hasAllergies = patient.allergies !== 'なし'
  const attentionFlags = getAttentionFlags(patient)
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(patient.address)}`
  const unbilledRecords = visitRecords.filter((record) => record.completed && record.billable && record.billingStatus === 'unbilled')

  const handleAddVisitRecord = () => {
    const newRecord: VisitRecordDraft = {
      id: `VR-${String(visitRecords.length + 1).padStart(3, '0')}`,
      visitDate: visitForm.visitDate,
      visitType: visitForm.visitType,
      staffName: visitForm.staffName,
      completed: visitForm.completed,
      billable: visitForm.billable,
      amount: visitForm.amount,
      billingStatus: visitForm.completed && visitForm.billable ? 'unbilled' : 'ready',
      note: visitForm.note || '患者詳細から追加した訪問記録',
    }
    setVisitRecords((prev) => [newRecord, ...prev])
    setVisitDialogOpen(false)
    setVisitForm({
      visitDate: '2026-03-16',
      visitType: '定期',
      staffName: '小林 薫',
      completed: true,
      billable: true,
      amount: 9800,
      note: '',
    })
  }

  const handleSavePatientEdit = () => {
    updateRegisteredPatient(patient.id, (current) => ({
      ...current,
      phone: editForm.phone || null,
      visitNotes: editForm.visitNotes,
      currentMeds: isPharmacyAdmin ? editForm.currentMeds : current.currentMeds,
      medicalHistory: isPharmacyAdmin ? editForm.medicalHistory : current.medicalHistory,
      allergies: isPharmacyAdmin ? editForm.allergies : current.allergies,
      insuranceInfo: isPharmacyAdmin ? editForm.insuranceInfo : current.insuranceInfo,
      registrationMeta: current.registrationMeta
        ? {
            ...current.registrationMeta,
            updatedAt: new Date().toISOString(),
            updatedById: null,
            updatedByName: isPharmacyAdmin ? 'Pharmacy Admin（モック）' : 'Pharmacy Staff（モック）',
            version: current.registrationMeta.version + 1,
          }
        : current.registrationMeta,
    }))
    setRegisteredPatients(loadRegisteredPatients())
    setEditDialogOpen(false)
    setEditSavedNotice(isPharmacyAdmin ? '管理者権限の編集を保存しました（モック）' : '実務項目の更新を保存しました（モック）')
    setTimeout(() => setEditSavedNotice(null), 2500)
  }


  return (
    <div className="space-y-4 text-gray-100">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/patients">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:bg-[#1a2035] hover:text-white">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-white">{patient.name}</h1>
              <Badge
                variant="outline"
                className={cn(
                  'border text-xs',
                  patient.status === 'active'
                    ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                    : 'border-gray-500/40 bg-gray-500/20 text-gray-400'
                )}
              >
                {patient.status === 'active' ? '利用中' : '休止'}
              </Badge>
              {attentionFlags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {attentionFlags.slice(0, 4).map((flag) => (
                    <Badge key={flag.key} variant="outline" className={cn('border text-xs', getAttentionFlagClass(flag.tone))}>
                      {flag.label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400">{patient.id}</p>
          </div>
        </div>
      </div>

      {editSavedNotice && (
        <div className="fixed right-4 top-20 z-50 rounded-lg bg-emerald-600/90 px-4 py-2 text-sm text-white shadow-lg">
          {editSavedNotice}
        </div>
      )}

      {isRegionalAdmin && (
        <Card className="border-indigo-500/30 bg-indigo-500/10">
          <CardContent className="pt-4 pb-4 text-xs text-indigo-100">
            Regional Admin は地域夜間運用・患者照合補助のために必要最小限の患者情報を閲覧します。日中運用の編集主体ではなく、照合・進行確認が中心です。
          </CardContent>
        </Card>
      )}

      {(isPharmacyAdmin || isPharmacyStaff) && (
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs">
            <div className="space-y-1 text-gray-300">
              <p className="font-medium text-white">患者編集</p>
              <p>自局の Pharmacy Staff / Pharmacy Admin のみ編集できます。</p>
              <p>Pharmacy Staff は実務項目、Pharmacy Admin は重要項目まで更新できます。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setEditDialogOpen(true)} className="bg-indigo-600 text-white hover:bg-indigo-700">
                <Save className="mr-2 h-4 w-4" />基本情報を編集
              </Button>
              <Button variant="outline" className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#1a2035]" onClick={() => document.getElementById('visit-schedule-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                訪問予定を調整
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(!patient.phone || patient.phone === '-') && (isPharmacyAdmin || isPharmacyStaff) && (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-4 pb-4 text-sm text-amber-100">
            <div>
              <p className="font-medium text-amber-300">連絡先未設定</p>
              <p className="mt-1 text-xs text-amber-100/80">患者本人の連絡先電話が未設定です。必要に応じて登録してください。</p>
            </div>
            <Button onClick={() => setEditDialogOpen(true)} className="bg-amber-500 text-black hover:bg-amber-400">
              連絡先を入力する
            </Button>
          </CardContent>
        </Card>
      )}

      {patient.emergencyContact.phone === '-' && (isPharmacyAdmin || isPharmacyStaff) && (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-4 pb-4 text-sm text-amber-100">
            <div>
              <p className="font-medium text-amber-300">緊急連絡先未設定</p>
              <p className="mt-1 text-xs text-amber-100/80">夜間や緊急時に備えて、緊急連絡先の整備をおすすめします。</p>
            </div>
            <Button onClick={() => setEditDialogOpen(true)} className="bg-amber-500 text-black hover:bg-amber-400">
              緊急連絡先を入力する
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Visit Notes Alert Card - TOP PRIORITY */}
      {patient.visitNotes && (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-300">訪問時注意事項</p>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-amber-100">
                  {patient.visitNotes}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic info */}
      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-white">
            <User className="h-4 w-4 text-indigo-400" />
            基本情報
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500">生年月日</p>
              <p className="mt-0.5 text-sm text-gray-200">{patient.dob}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">年齢</p>
              <p className="mt-0.5 text-sm text-gray-200">{age} 歳</p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="h-3 w-3" />
                住所
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <p className="text-sm text-gray-200">{patient.address}</p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-indigo-500/40 bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-300 transition hover:bg-indigo-500/20"
                >
                  <MapPin className="h-3 w-3" />
                  地図を開く
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            </div>
            <div>
              <p className="flex items-center gap-1 text-xs text-gray-500">
                <Phone className="h-3 w-3" />
                電話番号
              </p>
              <p className="mt-0.5 text-sm text-gray-200">{patient.phone ?? pharmacy?.phone ?? '-'}</p>
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <p className="text-xs text-gray-500">担当薬局</p>
              <Link
                href={`/dashboard/pharmacies/${patient.pharmacyId}`}
                className="mt-0.5 inline-block text-sm text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                {patient.pharmacyName}
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency contact & Doctor info */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Emergency contact */}
        <Card className="border-l-2 border-l-rose-500/60 border-t-[#2a3553] border-r-[#2a3553] border-b-[#2a3553] bg-[#1a2035]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-white">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              緊急連絡先
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">氏名</p>
              <p className="mt-0.5 text-sm font-medium text-gray-200">{patient.emergencyContact.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">続柄</p>
              <p className="mt-0.5 text-sm text-gray-200">{patient.emergencyContact.relation}</p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-xs text-gray-500">
                <Phone className="h-3 w-3" />
                電話番号
              </p>
              <p className="mt-0.5 text-sm text-indigo-300">{patient.emergencyContact.phone}</p>
            </div>
          </CardContent>
        </Card>

        {/* Doctor info */}
        <Card className="border-l-2 border-l-sky-500/60 border-t-[#2a3553] border-r-[#2a3553] border-b-[#2a3553] bg-[#1a2035]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-white">
              <Stethoscope className="h-4 w-4 text-sky-400" />
              主治医情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">医師名</p>
              <p className="mt-0.5 text-sm font-medium text-gray-200">{patient.doctor.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">医療機関</p>
              <p className="mt-0.5 text-sm text-gray-200">{patient.doctor.clinic}</p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-xs text-gray-500">
                <Phone className="h-3 w-3" />
                夜間連絡先
              </p>
              <p className="mt-0.5 text-sm text-indigo-300">{patient.doctor.phone}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clinical info (without current meds and visit notes) */}
      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-white">
            <Heart className="h-4 w-4 text-rose-400" />
            臨床情報
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-gray-500">既往歴</p>
            <p className="mt-0.5 text-sm text-gray-200">{patient.medicalHistory}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">アレルギー</p>
            <p
              className={cn(
                'mt-0.5 text-sm',
                hasAllergies ? 'font-medium text-rose-300' : 'text-gray-200'
              )}
            >
              {hasAllergies && <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />}
              {patient.allergies}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">保険情報</p>
            <p className="mt-0.5 text-sm text-gray-200">{patient.insuranceInfo}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">主疾患</p>
            <p className="mt-0.5 text-sm text-gray-200">{patient.diseaseName}</p>
          </div>
        </CardContent>
      </Card>

      {(patient.manualTags?.length || patient.registrationMeta || patient.visitRules?.length) && (
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-white">
              <Clock3 className="h-4 w-4 text-cyan-400" />
              patient master 登録情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-200">
            {patient.manualTags && patient.manualTags.length > 0 && (
              <div>
                <p className="text-xs text-gray-500">manualTags</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {patient.manualTags.map((tag) => (
                    <Badge key={tag} variant="outline" className="border-indigo-500/40 bg-indigo-500/20 text-indigo-200">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {patient.visitRules && patient.visitRules.length > 0 && (
              <div>
                <p className="text-xs text-gray-500">visitRules</p>
                <p className="mt-1">{formatVisitRuleSummary(patient)}</p>
              </div>
            )}
            {patient.registrationMeta && (
              <div className="grid gap-2 sm:grid-cols-2 text-xs text-gray-400">
                <p>作成者: {patient.registrationMeta.createdByName}</p>
                <p>作成日時: {patient.registrationMeta.createdAt}</p>
                <p>最終更新者: {patient.registrationMeta.updatedByName}</p>
                <p>手動同期: {patient.registrationMeta.manualSyncAt ?? '-'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Visit Schedule */}
      <div id="visit-schedule-card">
        <VisitSchedule
          patientId={patient.id}
          visitRules={patient.visitRules ?? []}
        />
      </div>

      {/* Current Medications - moved to bottom with (任意) label */}
      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-white">
            <Pill className="h-4 w-4 text-indigo-400" />
            現在薬
            <span className="text-xs font-normal text-gray-500">（任意）</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-200">{patient.currentMeds}</p>
        </CardContent>
      </Card>

      {/* Attention flags */}
      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-white">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            注意フラグ
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attentionFlags.length === 0 ? (
            <p className="text-sm text-gray-400">注意フラグはありません。</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {attentionFlags.map((flag) => (
                <Badge key={flag.key} variant="outline" className={cn('border text-xs', getAttentionFlagClass(flag.tone))}>
                  {flag.label}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="border-[#2a3553] bg-[#1a2035] text-gray-100">
          <DialogHeader>
            <DialogTitle>患者情報を編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3 text-xs text-gray-300">
              <p className="font-medium text-white">現在の権限</p>
              <p className="mt-1 inline-flex items-center gap-1 text-amber-200"><ShieldCheck className="h-3.5 w-3.5" />{isPharmacyAdmin ? 'Pharmacy Admin: 重要項目の編集が可能' : 'Pharmacy Staff: 実務項目のみ編集可能'}</p>
            </div>
            <div>
              <p className="mb-2 text-xs text-gray-500">実務項目</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">電話番号</p>
                  <Input value={editForm.phone} onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">訪問時注意事項</p>
                  <Textarea value={editForm.visitNotes} onChange={(e) => setEditForm((prev) => ({ ...prev, visitNotes: e.target.value }))} className="mt-1 min-h-[110px] border-[#2a3553] bg-[#11182c] text-gray-100" />
                </div>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs text-gray-500">補足</p>
              <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3 text-xs text-gray-300">
                <p>患者の所属薬局やステータス変更は Pharmacy Admin の責務です。</p>
                <p className="mt-1">他薬局の Pharmacy Staff / Pharmacy Admin、Night Pharmacist、Regional Admin、System Admin は患者情報を編集できません。</p>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs text-gray-500">管理者項目</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">現在薬</p>
                  <Textarea disabled={!isPharmacyAdmin} value={editForm.currentMeds} onChange={(e) => setEditForm((prev) => ({ ...prev, currentMeds: e.target.value }))} className="mt-1 min-h-[80px] border-[#2a3553] bg-[#11182c] text-gray-100 disabled:opacity-60" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">既往歴</p>
                  <Textarea disabled={!isPharmacyAdmin} value={editForm.medicalHistory} onChange={(e) => setEditForm((prev) => ({ ...prev, medicalHistory: e.target.value }))} className="mt-1 min-h-[80px] border-[#2a3553] bg-[#11182c] text-gray-100 disabled:opacity-60" />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-gray-500">アレルギー</p>
                    <Input disabled={!isPharmacyAdmin} value={editForm.allergies} onChange={(e) => setEditForm((prev) => ({ ...prev, allergies: e.target.value }))} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100 disabled:opacity-60" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">保険情報</p>
                    <Input disabled={!isPharmacyAdmin} value={editForm.insuranceInfo} onChange={(e) => setEditForm((prev) => ({ ...prev, insuranceInfo: e.target.value }))} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100 disabled:opacity-60" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="border-[#2a3553] text-gray-200 hover:bg-[#11182c]">キャンセル</Button>
            <Button onClick={handleSavePatientEdit} className="bg-indigo-600 text-white hover:bg-indigo-700">保存する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visit Records / Unbilled */}
      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-sm text-white">
              <Clock3 className="h-4 w-4 text-emerald-400" />
              訪問記録 / 未請求候補
              <Badge variant="outline" className="ml-1 border-[#2a3553] text-xs text-gray-400">
                未請求 {unbilledRecords.length}
              </Badge>
            </CardTitle>
            <Button size="sm" onClick={() => setVisitDialogOpen(true)} className="bg-emerald-600 text-white hover:bg-emerald-600/90">
              訪問記録を追加
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-[#2a3553] bg-[#111827] p-3 text-xs text-gray-300">
            <p className="font-medium text-white">運用イメージ</p>
            <p className="mt-1 text-gray-400">訪問記録を追加 → 実施済 & 算定対象なら自動で「未請求候補」に入る、というモックです。</p>
          </div>

          {visitRecords.length === 0 ? (
            <p className="py-4 text-center text-xs text-gray-500">まだ訪問記録はありません。まず「訪問記録を追加」を押してください。</p>
          ) : (
            <div className="space-y-2">
              {visitRecords.map((record) => (
                <div key={record.id} className="rounded-lg border border-[#2a3553] bg-[#111827] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-white">{record.visitDate} / {record.visitType}</p>
                      <p className="mt-1 text-xs text-gray-400">担当: {record.staffName} ・ {record.note}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={cn('border text-[10px]', record.completed ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' : 'border-gray-500/40 bg-gray-500/20 text-gray-300')}>
                        {record.completed ? '実施済' : '未実施'}
                      </Badge>
                      <Badge variant="outline" className={cn('border text-[10px]', record.billable ? 'border-indigo-500/40 bg-indigo-500/20 text-indigo-300' : 'border-gray-500/40 bg-gray-500/20 text-gray-300')}>
                        {record.billable ? '算定対象' : '算定対象外'}
                      </Badge>
                      <Badge variant="outline" className={cn('border text-[10px]', record.billingStatus === 'unbilled' ? 'border-amber-500/40 bg-amber-500/20 text-amber-300' : record.billingStatus === 'billed' ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' : 'border-sky-500/40 bg-sky-500/20 text-sky-300')}>
                        {record.billingStatus === 'unbilled' ? '未請求候補' : record.billingStatus === 'billed' ? '請求済み' : '確認待ち'}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                    <span>請求想定額: ¥{record.amount.toLocaleString('ja-JP')}</span>
                    {record.billingStatus === 'unbilled' && <span className="text-amber-300">→ billing の未請求処理へ載せる想定</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={visitDialogOpen} onOpenChange={setVisitDialogOpen}>
        <DialogContent className="border-[#2a3553] bg-[#1a2035] text-gray-100">
          <DialogHeader>
            <DialogTitle>訪問記録を追加</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs text-gray-400">訪問日</p>
              <Input type="date" value={visitForm.visitDate} onChange={(e) => setVisitForm((prev) => ({ ...prev, visitDate: e.target.value }))} className="border-[#2a3553] bg-[#11182c]" />
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-400">訪問種別</p>
              <Input value={visitForm.visitType} onChange={(e) => setVisitForm((prev) => ({ ...prev, visitType: e.target.value }))} className="border-[#2a3553] bg-[#11182c]" />
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-400">担当者</p>
              <Input value={visitForm.staffName} onChange={(e) => setVisitForm((prev) => ({ ...prev, staffName: e.target.value }))} className="border-[#2a3553] bg-[#11182c]" />
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-400">金額</p>
              <Input type="number" value={visitForm.amount} onChange={(e) => setVisitForm((prev) => ({ ...prev, amount: Number(e.target.value) || 0 }))} className="border-[#2a3553] bg-[#11182c]" />
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-400">実施済み (yes/no)</p>
              <Input value={visitForm.completed ? 'yes' : 'no'} onChange={(e) => setVisitForm((prev) => ({ ...prev, completed: e.target.value.toLowerCase() !== 'no' }))} className="border-[#2a3553] bg-[#11182c]" />
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-400">算定対象 (yes/no)</p>
              <Input value={visitForm.billable ? 'yes' : 'no'} onChange={(e) => setVisitForm((prev) => ({ ...prev, billable: e.target.value.toLowerCase() !== 'no' }))} className="border-[#2a3553] bg-[#11182c]" />
            </div>
            <div className="sm:col-span-2">
              <p className="mb-1 text-xs text-gray-400">メモ</p>
              <Input value={visitForm.note} onChange={(e) => setVisitForm((prev) => ({ ...prev, note: e.target.value }))} className="border-[#2a3553] bg-[#11182c]" placeholder="例: 夜間引継ぎ後の定期訪問" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVisitDialogOpen(false)} className="border-[#2a3553] bg-[#11182c] text-gray-300">キャンセル</Button>
            <Button onClick={handleAddVisitRecord} className="bg-emerald-600 text-white hover:bg-emerald-600/90">保存して未請求判定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request History */}
      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-white">
            <Clock3 className="h-4 w-4 text-indigo-400" />
            依頼履歴
            <Badge variant="outline" className="ml-1 border-[#2a3553] text-xs text-gray-400">
              {patientRequests.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patientRequests.length === 0 ? (
            <p className="py-4 text-center text-xs text-gray-500">依頼履歴はありません。</p>
          ) : (
            <div className="space-y-2">
              {patientRequests.map((req) => {
                const meta = statusMeta[req.status]
                return (
                  <Link key={req.id} href={`/dashboard/requests/${req.id}`} className="block">
                    <div className="flex items-center justify-between rounded-lg border border-[#2a3553] bg-[#111827] p-3 transition hover:border-indigo-500/40">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-300">{req.id}</span>
                          <Badge variant="outline" className={cn('border text-[10px]', meta.className)}>
                            {meta.label}
                          </Badge>
                        </div>
                        <p className="mt-1 truncate text-xs text-gray-400">{req.symptom}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-gray-500">{req.receivedDate}</p>
                        <p className="text-xs text-gray-400">{req.receivedAt}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Handover History */}
      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-white">
            <FileText className="h-4 w-4 text-purple-400" />
            夜間対応履歴
            <Badge variant="outline" className="ml-1 border-[#2a3553] text-xs text-gray-400">
              {patientHandovers.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patientHandovers.length === 0 ? (
            <p className="py-4 text-center text-xs text-gray-500">夜間対応履歴はありません。</p>
          ) : (
            <div className="space-y-2">
              {patientHandovers.map((ho) => (
                <Link key={ho.id} href={`/dashboard/handovers/${ho.id}`} className="block">
                  <div className="flex items-center justify-between rounded-lg border border-[#2a3553] bg-[#111827] p-3 transition hover:border-indigo-500/40">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-300">{ho.id}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'border text-[10px]',
                            ho.confirmed
                              ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                              : 'border-amber-500/40 bg-amber-500/20 text-amber-300'
                          )}
                        >
                          {ho.confirmed ? '確認済' : '未確認'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">夜間対応: {ho.pharmacistName}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-gray-500">{ho.timestamp}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
