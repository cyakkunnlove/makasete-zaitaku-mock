'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getPatientAttentionFlags, getPatientAttentionFlagClass } from '@/lib/patient-attention'
import { formatVisitRuleSummary, loadRegisteredPatients, upsertRegisteredPatient, updateRegisteredPatient, type PatientVisitRule, type RegisteredPatientRecord } from '@/lib/patient-master'
import { canEditPatientRecord } from '@/lib/patient-permissions'
import { mergeSinglePatient } from '@/lib/patient-read-model'
import type { Patient, PatientHomePhoto } from '@/types/database'
import { adminCardClass } from '@/components/admin-ui'
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
  Image as ImageIcon,
  Trash2,
  Upload,
} from 'lucide-react'
import { VisitSchedule } from '@/components/visit-schedule'

type PatientPhotoView = PatientHomePhoto & {
  thumbnail_url: string | null
  image_url: string | null
  uploaded_by_name?: string | null
}

type GeocodePreview = {
  inputAddress: string
  normalizedAddress: string | null
  latitude: number | null
  longitude: number | null
  warnings: Array<{ code: string; message: string }>
}

type MedicalInstitutionOption = {
  id: string
  name: string
  phone: string
  address: string
  doctorCount: number
}

type DoctorOption = {
  id: string
  medicalInstitutionId: string | null
  fullName: string
  department: string
  phone: string
}

function normalizePhone(value: string) {
  return value.replace(/[^0-9]/g, '').slice(0, 11)
}

function formatPhone(value: string) {
  const digits = normalizePhone(value)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  if (digits.length === 10) return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

function isUuidLike(value: string | null | undefined) {
  if (!value) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
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
  const { role, user, authMode } = useAuth()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const [registeredPatients, setRegisteredPatients] = useState<RegisteredPatientRecord[]>([])
  const [databasePatient, setDatabasePatient] = useState<Patient | null>(null)
  const [detailLoadState, setDetailLoadState] = useState<'loading' | 'ready' | 'not_found'>('loading')

  useEffect(() => {
    if (isUuidLike(id)) {
      setRegisteredPatients([])
      return
    }

    const syncPatients = () => setRegisteredPatients(loadRegisteredPatients())
    syncPatients()
    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === 'makasete-patient-master:v1') {
        syncPatients()
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [id])

  useEffect(() => {
    let cancelled = false
    async function fetchPatientDetail() {
      const localPatient = isUuidLike(id) ? null : registeredPatients.find((item) => item.id === id)
      if (localPatient) {
        setDatabasePatient(null)
        setDetailLoadState('ready')
        return
      }

      setDetailLoadState('loading')
      try {
        const response = await fetch(`/api/patients/${id}/detail`, { cache: 'no-store' })
        const result = await response.json().catch(() => null)

        if (cancelled) return

        if (response.ok && result?.ok && result.patient) {
          setDatabasePatient(result.patient)
          setDetailLoadState('ready')
          return
        }

        setDatabasePatient(null)
        setDetailLoadState('not_found')
      } catch {
        if (!cancelled) {
          setDatabasePatient(null)
          setDetailLoadState('not_found')
        }
      }
    }

    if (id) fetchPatientDetail()
    return () => {
      cancelled = true
    }
  }, [id, registeredPatients])

  const patient = useMemo(() => {
    if (detailLoadState === 'not_found') return null
    return mergeSinglePatient({
      databasePatient,
      registeredPatients: isUuidLike(id) ? [] : registeredPatients,
      patientId: id,
      includeMockPatients: false,
    })
  }, [databasePatient, detailLoadState, id, registeredPatients])

  useEffect(() => {
    if (!patient) return
    setEditForm({
      address: patient.address ?? '',
      phone: patient.phone ?? '',
      visitNotes: patient.visitNotes ?? '',
      currentMeds: patient.currentMeds ?? '',
      medicalHistory: patient.medicalHistory ?? '',
      allergies: patient.allergies ?? '',
      insuranceInfo: patient.insuranceInfo ?? '',
      doctorClinic: patient.doctor?.clinic ?? '',
      doctorName: patient.doctor?.name ?? '',
      doctorPhone: patient.doctor?.phone ?? '',
      isBillable: patient.isBillable ?? true,
      billingExclusionReason: patient.billingExclusionReason ?? '',
    })

  }, [patient])

  useEffect(() => {
    if (searchParams.get('created') !== '1') return
    setEditSavedNotice('患者を登録しました')
    const timer = window.setTimeout(() => setEditSavedNotice(null), 2500)
    return () => window.clearTimeout(timer)
  }, [searchParams])

  useEffect(() => {
    const patientId = patient?.id
    if (!databasePatient || !patientId) {
      setPatientPhotos([])
      return
    }

    let cancelled = false
    async function loadPhotos() {
      setPhotosLoading(true)
      try {
        const response = await fetch(`/api/patients/${patientId}/photos`, { cache: 'no-store' })
        const result = await response.json().catch(() => null)
        if (!cancelled && response.ok && result?.ok && Array.isArray(result.photos)) {
          setPatientPhotos(result.photos)
        }
      } finally {
        if (!cancelled) setPhotosLoading(false)
      }
    }

    loadPhotos()
    return () => {
      cancelled = true
    }
  }, [databasePatient, patient?.id])

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editSavedNotice, setEditSavedNotice] = useState<string | null>(null)
  const [patientPhotos, setPatientPhotos] = useState<PatientPhotoView[]>([])
  const [photosLoading, setPhotosLoading] = useState(false)
  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<PatientPhotoView | null>(null)
  const [photoActionNotice, setPhotoActionNotice] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [geocodeConfirmOpen, setGeocodeConfirmOpen] = useState(false)
  const [geocodePreview, setGeocodePreview] = useState<GeocodePreview | null>(null)
  const [medicalInstitutionOptions, setMedicalInstitutionOptions] = useState<MedicalInstitutionOption[]>([])
  const [medicalInstitutionLoading, setMedicalInstitutionLoading] = useState(false)
  const [doctorOptions, setDoctorOptions] = useState<DoctorOption[]>([])
  const [doctorLoading, setDoctorLoading] = useState(false)
  const [selectedMedicalInstitutionId, setSelectedMedicalInstitutionId] = useState<string | null>(null)
  const [selectedDoctorMasterId, setSelectedDoctorMasterId] = useState<string | null>(null)
  const [institutionDialogOpen, setInstitutionDialogOpen] = useState(false)
  const [doctorDialogOpen, setDoctorDialogOpen] = useState(false)
  const [institutionSubmitting, setInstitutionSubmitting] = useState(false)
  const [doctorSubmitting, setDoctorSubmitting] = useState(false)
  const [editingInstitutionId, setEditingInstitutionId] = useState<string | null>(null)
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null)
  const [institutionForm, setInstitutionForm] = useState({ name: '', phone: '', address: '' })
  const [doctorForm, setDoctorForm] = useState({ fullName: '', phone: '', department: '' })
  const [editForm, setEditForm] = useState({
    address: '',
    phone: '',
    visitNotes: '',
    currentMeds: '',
    medicalHistory: '',
    allergies: '',
    insuranceInfo: '',
    doctorClinic: '',
    doctorName: '',
    doctorPhone: '',
    isBillable: true,
    billingExclusionReason: '',
  })

  if (detailLoadState === 'loading' && !patient) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className={adminCardClass}>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-slate-500">患者情報を読み込んでいます...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className={adminCardClass}>
          <CardContent className="p-8 text-center">
            <User className="mx-auto mb-3 h-10 w-10 text-slate-400" />
            <p className="text-sm text-slate-500">患者が見つかりませんでした。</p>
            <Link href="/dashboard/patients">
              <Button variant="outline" className="mt-4 border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
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
  const canEditThisPatient = canEditPatientRecord({ role, user, patient })
  const hasAllergies = patient.allergies !== 'なし'
  const attentionFlags = getPatientAttentionFlags(patient)
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(patient.address)}`
  const isLocalOnlyPatient = authMode !== 'cognito' && !databasePatient
  const handleSaveVisitRules = async (nextVisitRules: PatientVisitRule[]) => {
    if (!patient) return

    if (isLocalOnlyPatient) {
      upsertRegisteredPatient({
        ...patient,
        visitRules: nextVisitRules,
        registrationMeta: patient.registrationMeta
          ? {
              ...patient.registrationMeta,
              updatedAt: new Date().toISOString(),
              updatedById: user?.id ?? null,
              updatedByName: user?.full_name ?? 'Pharmacy Staff',
              version: patient.registrationMeta.version + 1,
            }
          : undefined,
      })
      setRegisteredPatients(loadRegisteredPatients())
      setEditSavedNotice('訪問スケジュールを保存しました')
      setTimeout(() => setEditSavedNotice(null), 2500)
      return
    }

    const response = await fetch(`/api/patients/${patient.id}/visit-rules`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitRules: nextVisitRules }),
    })
    const result = await response.json().catch(() => null)
    if (!response.ok || !result?.ok) {
      setEditSavedNotice(result?.details ?? '訪問スケジュールの保存に失敗しました')
      setTimeout(() => setEditSavedNotice(null), 3000)
      return
    }

    const refreshed = await fetch(`/api/patients/${patient.id}/detail`, { cache: 'no-store' })
    const refreshedResult = await refreshed.json().catch(() => null)
    if (refreshed.ok && refreshedResult?.ok && refreshedResult.patient) {
      setDatabasePatient(refreshedResult.patient)
    }
    setEditSavedNotice('訪問スケジュールを保存しました')
    setTimeout(() => setEditSavedNotice(null), 2500)
  }

  const handlePhotoUpload = async (file: File | null) => {
    if (!patient || !file) return
    if (!databasePatient) {
      setPhotoActionNotice('写真添付はデータベース保存の患者から対応します')
      setTimeout(() => setPhotoActionNotice(null), 2500)
      return
    }
    if (patientPhotos.length >= 3) {
      setPhotoActionNotice('写真は3枚までです')
      setTimeout(() => setPhotoActionNotice(null), 2500)
      return
    }

    setPhotoUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('photoType', 'outside')
      const response = await fetch(`/api/patients/${patient.id}/photos`, {
        method: 'POST',
        body: formData,
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.ok || !result.photo) {
        setPhotoActionNotice(result?.details ?? '写真の保存に失敗しました')
      } else {
        setPatientPhotos((prev) => [...prev, result.photo].sort((a, b) => a.sort_order - b.sort_order))
        setPhotoActionNotice('写真を追加しました')
      }
    } finally {
      setPhotoUploading(false)
      setTimeout(() => setPhotoActionNotice(null), 2500)
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!patient) return
    const response = await fetch(`/api/patients/${patient.id}/photos/${photoId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deleteReason: 'patient_detail_deleted' }),
    })
    const result = await response.json().catch(() => null)
    if (!response.ok || !result?.ok) {
      setPhotoActionNotice(result?.details ?? '写真の削除に失敗しました')
      setTimeout(() => setPhotoActionNotice(null), 2500)
      return
    }
    setPatientPhotos((prev) => prev.filter((photo) => photo.id !== photoId))
    if (selectedPhoto?.id === photoId) {
      setPhotoModalOpen(false)
      setSelectedPhoto(null)
    }
    setPhotoActionNotice('写真を削除しました')
    setTimeout(() => setPhotoActionNotice(null), 2500)
  }

  const fetchGeocodePreview = async (address: string) => {
    const response = await fetch('/api/patients/geocode-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    })
    const result = await response.json().catch(() => null)
    if (!response.ok || !result?.ok || !result?.preview) {
      throw new Error('住所確認に失敗しました')
    }
    return result.preview as GeocodePreview
  }

  const shouldConfirmGeocode = (preview: GeocodePreview) => {
    const normalized = preview.normalizedAddress?.trim() ?? ''
    const input = preview.inputAddress.trim()
    return preview.warnings.length > 0 || (normalized && normalized !== input)
  }

  const searchMedicalInstitutions = async (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) {
      setMedicalInstitutionOptions([])
      return
    }

    setMedicalInstitutionLoading(true)
    try {
      const response = await fetch(`/api/medical-institutions?q=${encodeURIComponent(trimmed)}`, { cache: 'no-store' })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.ok || !Array.isArray(result.medicalInstitutions)) {
        setMedicalInstitutionOptions([])
        return
      }
      setMedicalInstitutionOptions(result.medicalInstitutions)
    } finally {
      setMedicalInstitutionLoading(false)
    }
  }

  const searchDoctors = async (medicalInstitutionId: string, query?: string) => {
    if (!medicalInstitutionId) {
      setDoctorOptions([])
      return
    }

    setDoctorLoading(true)
    try {
      const suffix = query?.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''
      const response = await fetch(`/api/medical-institutions/${medicalInstitutionId}/doctors${suffix}`, { cache: 'no-store' })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.ok || !Array.isArray(result.doctors)) {
        setDoctorOptions([])
        return
      }
      setDoctorOptions(result.doctors)
    } finally {
      setDoctorLoading(false)
    }
  }

  const saveMedicalInstitution = async () => {
    const name = institutionForm.name.trim() || editForm.doctorClinic.trim()
    if (!name) {
      setEditSavedNotice('病院名を入力してください')
      setTimeout(() => setEditSavedNotice(null), 2500)
      return
    }

    setInstitutionSubmitting(true)
    try {
      const response = await fetch(editingInstitutionId ? `/api/medical-institutions/${editingInstitutionId}` : '/api/medical-institutions', {
        method: editingInstitutionId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone: institutionForm.phone, address: institutionForm.address }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.ok || !result.medicalInstitution) {
        setEditSavedNotice(editingInstitutionId ? '病院の更新に失敗しました' : '病院の追加に失敗しました')
        setTimeout(() => setEditSavedNotice(null), 2500)
        return
      }
      const created = result.medicalInstitution as MedicalInstitutionOption
      setSelectedMedicalInstitutionId(created.id)
      setSelectedDoctorMasterId(null)
      setEditForm((prev) => ({ ...prev, doctorClinic: created.name }))
      setMedicalInstitutionOptions((prev) => [created, ...prev.filter((item) => item.id !== created.id)])
      setInstitutionDialogOpen(false)
      setEditingInstitutionId(null)
      setInstitutionForm({ name: '', phone: '', address: '' })
      await searchDoctors(created.id)
    } finally {
      setInstitutionSubmitting(false)
    }
  }

  const archiveMedicalInstitution = async () => {
    if (!selectedMedicalInstitutionId) return
    if (!window.confirm('この病院を候補一覧から外しますか？ 既存患者の表示は残ります。')) return

    const response = await fetch(`/api/medical-institutions/${selectedMedicalInstitutionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    })
    const result = await response.json().catch(() => null)
    if (!response.ok || !result?.ok) {
      setEditSavedNotice('病院の非表示に失敗しました')
      setTimeout(() => setEditSavedNotice(null), 2500)
      return
    }
    setSelectedMedicalInstitutionId(null)
    setSelectedDoctorMasterId(null)
    setDoctorOptions([])
    setMedicalInstitutionOptions((prev) => prev.filter((item) => item.id !== selectedMedicalInstitutionId))
    setEditSavedNotice('病院候補から外しました')
    setTimeout(() => setEditSavedNotice(null), 2500)
  }

  const archiveDoctor = async () => {
    if (!selectedDoctorMasterId) return
    if (!window.confirm('この医師を候補一覧から外しますか？ 既存患者の表示は残ります。')) return

    const response = await fetch(`/api/doctor-masters/${selectedDoctorMasterId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    })
    const result = await response.json().catch(() => null)
    if (!response.ok || !result?.ok) {
      setEditSavedNotice('医師の非表示に失敗しました')
      setTimeout(() => setEditSavedNotice(null), 2500)
      return
    }
    setSelectedDoctorMasterId(null)
    setDoctorOptions((prev) => prev.filter((item) => item.id !== selectedDoctorMasterId))
    setEditSavedNotice('医師候補から外しました')
    setTimeout(() => setEditSavedNotice(null), 2500)
  }

  const saveDoctor = async () => {
    if (!selectedMedicalInstitutionId) {
      setEditSavedNotice('先に病院を選択してください')
      setTimeout(() => setEditSavedNotice(null), 2500)
      return
    }

    const fullName = doctorForm.fullName.trim() || editForm.doctorName.trim()
    if (!fullName) {
      setEditSavedNotice('医師名を入力してください')
      setTimeout(() => setEditSavedNotice(null), 2500)
      return
    }

    setDoctorSubmitting(true)
    try {
      const response = await fetch(editingDoctorId ? `/api/doctor-masters/${editingDoctorId}` : `/api/medical-institutions/${selectedMedicalInstitutionId}/doctors`, {
        method: editingDoctorId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, phone: doctorForm.phone, department: doctorForm.department }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.ok || !result.doctor) {
        setEditSavedNotice(editingDoctorId ? '医師の更新に失敗しました' : '医師の追加に失敗しました')
        setTimeout(() => setEditSavedNotice(null), 2500)
        return
      }
      const created = result.doctor as DoctorOption
      setSelectedDoctorMasterId(created.id)
      setEditForm((prev) => ({ ...prev, doctorName: created.fullName, doctorPhone: normalizePhone(created.phone) }))
      setDoctorOptions((prev) => [created, ...prev.filter((item) => item.id !== created.id)])
      setDoctorDialogOpen(false)
      setEditingDoctorId(null)
      setDoctorForm({ fullName: '', phone: '', department: '' })
    } finally {
      setDoctorSubmitting(false)
    }
  }

  const handleSavePatientEdit = async (skipGeocodeConfirmation = false) => {
    if (!canEditThisPatient) return

    if (!skipGeocodeConfirmation && editForm.address.trim()) {
      try {
        const preview = await fetchGeocodePreview(editForm.address)
        if (shouldConfirmGeocode(preview)) {
          setGeocodePreview(preview)
          setGeocodeConfirmOpen(true)
          return
        }
      } catch (error) {
        setEditSavedNotice(error instanceof Error ? error.message : '住所確認に失敗しました')
        setTimeout(() => setEditSavedNotice(null), 2500)
        return
      }
    }

    if (!databasePatient) {
      upsertRegisteredPatient({
        ...patient,
        address: editForm.address || patient.address,
        phone: editForm.phone || null,
        visitNotes: editForm.visitNotes || '未設定',
        currentMeds: editForm.currentMeds || '未設定',
        medicalHistory: editForm.medicalHistory || '未設定',
        allergies: editForm.allergies || 'なし',
        insuranceInfo: editForm.insuranceInfo || '未設定',
      })
      setGeocodeConfirmOpen(false)
      setEditDialogOpen(false)
      setEditSavedNotice('患者情報を保存しました')
      setTimeout(() => setEditSavedNotice(null), 2500)
      return
    }

    const response = await fetch(`/api/patients/${patient.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: editForm.address,
        phone: editForm.phone || null,
        visitNotes: editForm.visitNotes,
        currentMeds: editForm.currentMeds,
        medicalHistory: editForm.medicalHistory,
        allergies: editForm.allergies,
        insuranceInfo: editForm.insuranceInfo,
        isBillable: editForm.isBillable,
        billingExclusionReason: editForm.isBillable ? null : editForm.billingExclusionReason,
        medicalInstitutionId: selectedMedicalInstitutionId,
        doctorMasterId: selectedDoctorMasterId,
        doctorClinic: editForm.doctorClinic,
        doctorName: editForm.doctorName,
        doctorPhone: editForm.doctorPhone || null,
      }),
    })

    const result = await response.json().catch(() => null)
    if (!response.ok || !result?.ok) {
      setEditSavedNotice('患者情報の保存に失敗しました')
      setTimeout(() => setEditSavedNotice(null), 2500)
      return
    }

    if (result?.patient) {
      setDatabasePatient(result.patient)
    }

    const localPatientExists = isLocalOnlyPatient && registeredPatients.some((current) => current.id === patient.id)
    if (localPatientExists) {
      updateRegisteredPatient(patient.id, (current) => ({
        ...current,
        address: editForm.address || current.address,
        phone: editForm.phone || null,
        visitNotes: editForm.visitNotes,
        currentMeds: editForm.currentMeds,
        medicalHistory: editForm.medicalHistory,
        allergies: editForm.allergies,
        insuranceInfo: editForm.insuranceInfo,
        isBillable: editForm.isBillable,
        billingExclusionReason: editForm.isBillable ? '' : editForm.billingExclusionReason,
        doctorClinic: editForm.doctorClinic,
        doctorName: editForm.doctorName,
        doctorPhone: editForm.doctorPhone || null,
        registrationMeta: current.registrationMeta
          ? {
              ...current.registrationMeta,
              updatedAt: new Date().toISOString(),
              updatedById: user?.id ?? null,
              updatedByName: user?.full_name ?? (isPharmacyAdmin ? 'Pharmacy Admin' : 'Pharmacy Staff'),
              version: current.registrationMeta.version + 1,
            }
          : current.registrationMeta,
      }))
      setRegisteredPatients(loadRegisteredPatients())
    }
    setGeocodeConfirmOpen(false)
    setGeocodePreview(null)
    setEditDialogOpen(false)
    const apiWarnings = Array.isArray(result?.warnings) ? result.warnings : []
    setEditSavedNotice(apiWarnings.length > 0 ? apiWarnings.map((warning: { message: string }) => warning.message).join(' / ') : '患者情報を保存しました')
    setTimeout(() => setEditSavedNotice(null), 2500)
  }


  return (
    <div className="space-y-4 text-slate-900">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/patients">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-slate-900">{patient.name}</h1>
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
                    <Badge key={flag.key} variant="outline" className={cn('border text-xs', getPatientAttentionFlagClass(flag.tone))}>
                      {flag.label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500">{patient.id}</p>
          </div>
        </div>
      </div>

      {editSavedNotice && (
        <div className="fixed right-4 top-20 z-50 rounded-lg bg-emerald-600/90 px-4 py-2 text-sm text-white shadow-lg">
          {editSavedNotice}
        </div>
      )}

      {photoActionNotice && (
        <div className="fixed right-4 top-32 z-50 rounded-lg bg-sky-600/90 px-4 py-2 text-sm text-white shadow-lg">
          {photoActionNotice}
        </div>
      )}

      {isRegionalAdmin && (
        <Card className="border-indigo-500/30 bg-indigo-500/10">
          <CardContent className="pt-4 pb-4 text-xs text-indigo-100">
            Regional Admin は地域夜間運用・患者照合補助のために必要最小限の患者情報を閲覧します。日中運用の編集主体ではなく、照合・進行確認が中心です。
          </CardContent>
        </Card>
      )}

      {canEditThisPatient && (
        <Card className={adminCardClass}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs">
            <div className="space-y-1 text-slate-600">
              <p className="font-medium text-slate-900">患者編集</p>
              <p>自局の Pharmacy Staff / Pharmacy Admin のみ編集できます。</p>
              <p>Pharmacy Staff は実務項目、Pharmacy Admin は重要項目まで更新できます。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setEditDialogOpen(true)} className="bg-indigo-600 text-white hover:bg-indigo-700">
                <Save className="mr-2 h-4 w-4" />基本情報を編集
              </Button>
              <Button variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50" onClick={() => document.getElementById('visit-schedule-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                訪問予定を調整
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(!patient.phone || patient.phone === '-') && canEditThisPatient && (
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

      {patient.emergencyContact.phone === '-' && canEditThisPatient && (
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
      <Card className={adminCardClass}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-slate-900">
            <User className="h-4 w-4 text-indigo-500" />
            基本情報
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">生年月日</p>
              <p className="mt-0.5 text-sm text-slate-700">{patient.dob}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">年齢</p>
              <p className="mt-0.5 text-sm text-slate-700">{age} 歳</p>
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
              <p className="mt-0.5 text-sm text-gray-200">{patient.phone ?? '-'}</p>
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

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-slate-900">
            <ImageIcon className="h-4 w-4 text-indigo-500" />
            訪問メモ写真
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <p>外観や入口など、次回訪問時の目印を共有します。常時は軽い画像で表示し、押すと拡大表示します。</p>
            <label>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={!canEditThisPatient || photoUploading || patientPhotos.length >= 3}
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null
                  void handlePhotoUpload(file)
                  event.currentTarget.value = ''
                }}
              />
              <Button asChild size="sm" disabled={!canEditThisPatient || photoUploading || patientPhotos.length >= 3} className="bg-indigo-600 text-white hover:bg-indigo-700">
                <span><Upload className="mr-2 h-4 w-4" />{photoUploading ? '追加中...' : `写真を追加 (${patientPhotos.length}/3)`}</span>
              </Button>
            </label>
          </div>
          {photosLoading ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">写真を読み込んでいます...</div>
          ) : patientPhotos.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">まだ写真はありません。必要なら外観や入口の写真を3枚まで共有できます。</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {patientPhotos.map((photo) => (
                <div key={photo.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  <button
                    type="button"
                    className="block w-full"
                    onClick={() => {
                      setSelectedPhoto(photo)
                      setPhotoModalOpen(true)
                    }}
                  >
                    {photo.thumbnail_url ? (
                      <div className="relative h-40 w-full">
                        <Image
                          src={photo.thumbnail_url}
                          alt={photo.caption ?? '患者宅写真'}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-40 items-center justify-center bg-slate-100 text-slate-500">画像なし</div>
                    )}
                  </button>
                  <div className="space-y-2 p-3">
                    <div>
                      <p className="text-xs text-slate-500">追加情報</p>
                      <p className="text-sm text-slate-900">{photo.caption || '外観写真'}</p>
                      <p className="mt-1 text-[11px] text-slate-500">追加日時: {new Date(photo.uploaded_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</p>
                      <p className="text-[11px] text-slate-500">追加者: {photo.uploaded_by_name ?? photo.uploaded_by ?? '不明'}</p>
                    </div>
                    {canEditThisPatient && (
                      <Button size="sm" variant="outline" className="w-full border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20" onClick={() => void handleDeletePhoto(photo.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />削除
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emergency contact & Doctor info */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Emergency contact */}
        <Card className="border border-rose-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-900">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              緊急連絡先
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-slate-500">氏名</p>
              <p className="mt-0.5 text-sm font-medium text-slate-900">{patient.emergencyContact.name}</p>
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
        <Card className="border border-sky-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-900">
              <Stethoscope className="h-4 w-4 text-sky-500" />
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
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-slate-900">
            <Heart className="h-4 w-4 text-rose-500" />
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

      {(patient.manualTags?.length || (authMode !== 'cognito' && patient.registrationMeta) || patient.visitRules?.length) && (
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-900">
              <Clock3 className="h-4 w-4 text-cyan-500" />
              補足情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            {patient.manualTags && patient.manualTags.length > 0 && (
              <div>
                <p className="text-xs text-gray-500">共有メモ</p>
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
                <p className="text-xs text-gray-500">訪問の目安</p>
                <p className="mt-1">{formatVisitRuleSummary(patient)}</p>
              </div>
            )}
            {authMode !== 'cognito' && patient.registrationMeta && (
              <div className="grid gap-2 sm:grid-cols-2 text-xs text-gray-400">
                <p>登録者: {patient.registrationMeta.createdByName}</p>
                <p>登録日時: {new Date(patient.registrationMeta.createdAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</p>
                <p>最終更新者: {patient.registrationMeta.updatedByName}</p>
                <p>反映メモ: {patient.registrationMeta.manualSyncAt ? new Date(patient.registrationMeta.manualSyncAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '-'}</p>
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
          canEdit={canEditThisPatient}
          onSave={(rules) => void handleSaveVisitRules(rules)}
        />
      </div>

      {/* Current Medications - moved to bottom with (任意) label */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-slate-900">
            <Pill className="h-4 w-4 text-indigo-500" />
            現在薬
            <span className="text-xs font-normal text-slate-500">（任意）</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700">{patient.currentMeds}</p>
        </CardContent>
      </Card>

      {/* Attention flags */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-slate-900">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            注意フラグ
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attentionFlags.length === 0 ? (
            <p className="text-sm text-slate-500">注意フラグはありません。</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {attentionFlags.map((flag) => (
                <Badge key={flag.key} variant="outline" className={cn('border text-xs', getPatientAttentionFlagClass(flag.tone))}>
                  {flag.label}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={photoModalOpen} onOpenChange={setPhotoModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-200 bg-white text-slate-900 shadow-xl sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>訪問メモ写真</DialogTitle>
          </DialogHeader>
          {selectedPhoto?.image_url ? (
            <div className="space-y-3">
              <div className="relative h-[70vh] w-full overflow-hidden rounded-lg">
                <Image
                  src={selectedPhoto.image_url}
                  alt={selectedPhoto.caption ?? '患者宅写真'}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              </div>
              <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                <p>メモ: {selectedPhoto.caption || '外観写真'}</p>
                <p>追加日時: {new Date(selectedPhoto.uploaded_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</p>
                <p>種別: {selectedPhoto.photo_type ?? '未設定'}</p>
                <p>追加者: {selectedPhoto.uploaded_by_name ?? selectedPhoto.uploaded_by ?? '不明'}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">画像を表示できませんでした。</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={institutionDialogOpen} onOpenChange={setInstitutionDialogOpen}>
        <DialogContent className="border-slate-200 bg-white text-slate-900 shadow-xl">
          <DialogHeader>
            <DialogTitle>病院を追加</DialogTitle>
            <DialogDescription className="text-slate-500">候補にない病院は、その場で追加できます。</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-500">病院名</p>
              <Input value={institutionForm.name} onChange={(e) => setInstitutionForm((prev) => ({ ...prev, name: e.target.value }))} className="mt-1 border-slate-200 bg-white text-slate-900" />
            </div>
            <div>
              <p className="text-xs text-gray-500">電話</p>
              <Input value={formatPhone(institutionForm.phone)} onChange={(e) => setInstitutionForm((prev) => ({ ...prev, phone: normalizePhone(e.target.value) }))} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" inputMode="tel" />
            </div>
            <div>
              <p className="text-xs text-gray-500">住所</p>
              <Input value={institutionForm.address} onChange={(e) => setInstitutionForm((prev) => ({ ...prev, address: e.target.value }))} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstitutionDialogOpen(false)} className="border-[#2a3553] text-gray-200 hover:bg-[#11182c]">閉じる</Button>
            <Button onClick={() => void saveMedicalInstitution()} disabled={institutionSubmitting} className="bg-indigo-600 text-white hover:bg-indigo-500">{institutionSubmitting ? (editingInstitutionId ? '更新中...' : '追加中...') : (editingInstitutionId ? '病院を更新' : '病院を追加')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={doctorDialogOpen} onOpenChange={setDoctorDialogOpen}>
        <DialogContent className="border-slate-200 bg-white text-slate-900 shadow-xl">
          <DialogHeader>
            <DialogTitle>医師を追加</DialogTitle>
            <DialogDescription className="text-slate-500">選択中の病院に医師を追加します。</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">医師名</p>
              <Input value={doctorForm.fullName} onChange={(e) => setDoctorForm((prev) => ({ ...prev, fullName: e.target.value }))} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" />
            </div>
            <div>
              <p className="text-xs text-gray-500">診療科</p>
              <Input value={doctorForm.department} onChange={(e) => setDoctorForm((prev) => ({ ...prev, department: e.target.value }))} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" />
            </div>
            <div>
              <p className="text-xs text-gray-500">電話</p>
              <Input value={formatPhone(doctorForm.phone)} onChange={(e) => setDoctorForm((prev) => ({ ...prev, phone: normalizePhone(e.target.value) }))} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" inputMode="tel" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDoctorDialogOpen(false)} className="border-[#2a3553] text-gray-200 hover:bg-[#11182c]">閉じる</Button>
            <Button onClick={() => void saveDoctor()} disabled={doctorSubmitting} className="bg-emerald-600 text-white hover:bg-emerald-500">{doctorSubmitting ? (editingDoctorId ? '更新中...' : '追加中...') : (editingDoctorId ? '医師を更新' : '医師を追加')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={geocodeConfirmOpen} onOpenChange={setGeocodeConfirmOpen}>
        <DialogContent className="border-slate-200 bg-white text-slate-900 shadow-xl">
          <DialogHeader>
            <DialogTitle>住所の解釈を確認してください</DialogTitle>
            <DialogDescription className="text-slate-500">
              保存前に、地図で使う住所解釈を確認できます。問題なければこのまま保存します。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">入力した住所</p>
              <p className="mt-1 text-slate-900">{geocodePreview?.inputAddress ?? '—'}</p>
            </div>
            <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
              <p className="text-xs text-gray-500">解釈された住所</p>
              <p className="mt-1 text-gray-100">{geocodePreview?.normalizedAddress ?? '未取得'}</p>
              <p className="mt-1 text-xs text-gray-500">座標: {geocodePreview?.latitude ?? '-'}, {geocodePreview?.longitude ?? '-'}</p>
            </div>
            {typeof geocodePreview?.latitude === 'number' && typeof geocodePreview?.longitude === 'number' && (
              <div className="overflow-hidden rounded-lg border border-[#2a3553] bg-[#11182c]">
                <iframe
                  title="住所確認地図"
                  className="h-56 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${geocodePreview.latitude},${geocodePreview.longitude}&z=16&output=embed`}
                />
              </div>
            )}
            {geocodePreview?.warnings?.length ? (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-amber-200">
                {geocodePreview.warnings.map((warning) => (
                  <p key={warning.code}>{warning.message}</p>
                ))}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGeocodeConfirmOpen(false)} className="border-[#2a3553] text-gray-200 hover:bg-[#11182c]">住所を見直す</Button>
            <Button onClick={() => void handleSavePatientEdit(true)} className="bg-indigo-600 text-white hover:bg-indigo-500">この住所で保存する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-[#2a3553] bg-[#1a2035] text-gray-100 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>患者情報を編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pb-2">
            <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3 text-xs text-gray-300">
              <p className="font-medium text-white">現在の権限</p>
              <p className="mt-1 inline-flex items-center gap-1 text-amber-200"><ShieldCheck className="h-3.5 w-3.5" />薬局管理者・薬局スタッフは、患者基本情報と医療情報を編集できます。</p>
            </div>
            <div>
              <p className="mb-2 text-xs text-gray-500">編集項目</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">住所</p>
                  <Input value={editForm.address} onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">電話番号</p>
                  <Input value={formatPhone(editForm.phone)} onChange={(e) => setEditForm((prev) => ({ ...prev, phone: normalizePhone(e.target.value) }))} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" inputMode="tel" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">病院・クリニック</p>
                  <Input
                    value={editForm.doctorClinic}
                    onChange={(e) => {
                      const nextValue = e.target.value
                      setSelectedMedicalInstitutionId(null)
                      setSelectedDoctorMasterId(null)
                      setDoctorOptions([])
                      setEditForm((prev) => ({ ...prev, doctorClinic: nextValue }))
                      void searchMedicalInstitutions(nextValue)
                    }}
                    className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100"
                  />
                  {medicalInstitutionLoading && <p className="mt-2 text-[11px] text-gray-500">病院候補を確認中です...</p>}
                  {medicalInstitutionOptions.length > 0 && (
                    <div className="mt-2 space-y-2 rounded-lg border border-[#2a3553] bg-[#11182c] p-2">
                      {medicalInstitutionOptions.slice(0, 5).map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setSelectedMedicalInstitutionId(option.id)
                            setSelectedDoctorMasterId(null)
                            setEditForm((prev) => ({ ...prev, doctorClinic: option.name }))
                            void searchDoctors(option.id)
                          }}
                          className={`w-full rounded-md border px-3 py-2 text-left text-xs ${selectedMedicalInstitutionId === option.id ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-100' : 'border-[#2a3553] bg-[#0a0e1a] text-gray-300'}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium">{option.name}</p>
                            {editForm.doctorClinic.trim() && option.name === editForm.doctorClinic.trim() && (
                              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-200">同名候補</span>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-gray-400">{option.address || '住所未設定'} / 医師候補 {option.doctorCount}件</p>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button type="button" variant="outline" className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#1a2035]" onClick={() => { setEditingInstitutionId(null); setInstitutionForm({ name: editForm.doctorClinic, phone: '', address: '' }); setInstitutionDialogOpen(true) }}>
                      この病院を追加
                    </Button>
                    {selectedMedicalInstitutionId && (
                      <>
                        <Button type="button" variant="ghost" className="text-sky-300 hover:bg-sky-500/10 hover:text-sky-200" onClick={() => { const current = medicalInstitutionOptions.find((item) => item.id === selectedMedicalInstitutionId); setEditingInstitutionId(selectedMedicalInstitutionId); setInstitutionForm({ name: current?.name ?? editForm.doctorClinic, phone: current?.phone ?? '', address: current?.address ?? '' }); setInstitutionDialogOpen(true) }}>
                          修正する
                        </Button>
                        <Button type="button" variant="ghost" className="text-rose-300 hover:bg-rose-500/10 hover:text-rose-200" onClick={() => void archiveMedicalInstitution()}>
                          候補から外す
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">主治医</p>
                  <Input
                    value={editForm.doctorName}
                    onChange={(e) => {
                      const nextValue = e.target.value
                      setSelectedDoctorMasterId(null)
                      setEditForm((prev) => ({ ...prev, doctorName: nextValue }))
                      if (selectedMedicalInstitutionId) void searchDoctors(selectedMedicalInstitutionId, nextValue)
                    }}
                    className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100"
                  />
                  {doctorLoading && selectedMedicalInstitutionId && <p className="mt-2 text-[11px] text-gray-500">医師候補を確認中です...</p>}
                  {selectedMedicalInstitutionId && doctorOptions.length > 0 && (
                    <div className="mt-2 space-y-2 rounded-lg border border-[#2a3553] bg-[#11182c] p-2">
                      {doctorOptions.slice(0, 5).map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setSelectedDoctorMasterId(option.id)
                            setEditForm((prev) => ({ ...prev, doctorName: option.fullName, doctorPhone: normalizePhone(option.phone) }))
                          }}
                          className={`w-full rounded-md border px-3 py-2 text-left text-xs ${selectedDoctorMasterId === option.id ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-100' : 'border-[#2a3553] bg-[#0a0e1a] text-gray-300'}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium">{option.fullName}</p>
                            {editForm.doctorName.trim() && option.fullName === editForm.doctorName.trim() && (
                              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-200">同名候補</span>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-gray-400">{option.department || '診療科未設定'}{option.phone ? ` / ${option.phone}` : ''}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button type="button" variant="outline" disabled={!selectedMedicalInstitutionId} className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#1a2035]" onClick={() => { setEditingDoctorId(null); setDoctorForm({ fullName: editForm.doctorName, phone: editForm.doctorPhone, department: '' }); setDoctorDialogOpen(true) }}>
                      この医師を追加
                    </Button>
                    {selectedDoctorMasterId && (
                      <>
                        <Button type="button" variant="ghost" className="text-sky-300 hover:bg-sky-500/10 hover:text-sky-200" onClick={() => { const current = doctorOptions.find((item) => item.id === selectedDoctorMasterId); setEditingDoctorId(selectedDoctorMasterId); setDoctorForm({ fullName: current?.fullName ?? editForm.doctorName, phone: normalizePhone(current?.phone ?? editForm.doctorPhone), department: current?.department ?? '' }); setDoctorDialogOpen(true) }}>
                          修正する
                        </Button>
                        <Button type="button" variant="ghost" className="text-rose-300 hover:bg-rose-500/10 hover:text-rose-200" onClick={() => void archiveDoctor()}>
                          候補から外す
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">医師電話</p>
                  <Input value={formatPhone(editForm.doctorPhone)} onChange={(e) => setEditForm((prev) => ({ ...prev, doctorPhone: normalizePhone(e.target.value) }))} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" inputMode="tel" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">訪問時注意事項</p>
                  <Textarea value={editForm.visitNotes} onChange={(e) => setEditForm((prev) => ({ ...prev, visitNotes: e.target.value }))} className="mt-1 min-h-[110px] border-[#2a3553] bg-[#11182c] text-gray-100" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">現在薬</p>
                  <Textarea value={editForm.currentMeds} onChange={(e) => setEditForm((prev) => ({ ...prev, currentMeds: e.target.value }))} className="mt-1 min-h-[80px] border-[#2a3553] bg-[#11182c] text-gray-100" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">既往歴</p>
                  <Textarea value={editForm.medicalHistory} onChange={(e) => setEditForm((prev) => ({ ...prev, medicalHistory: e.target.value }))} className="mt-1 min-h-[80px] border-[#2a3553] bg-[#11182c] text-gray-100" />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-gray-500">アレルギー</p>
                    <Input value={editForm.allergies} onChange={(e) => setEditForm((prev) => ({ ...prev, allergies: e.target.value }))} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">保険情報</p>
                    <Input value={editForm.insuranceInfo} onChange={(e) => setEditForm((prev) => ({ ...prev, insuranceInfo: e.target.value }))} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">請求設定</p>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setEditForm((prev) => ({ ...prev, isBillable: true, billingExclusionReason: '' }))}
                      className={`rounded-xl border px-4 py-3 text-left text-sm transition ${editForm.isBillable ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-100' : 'border-[#2a3553] bg-[#11182c] text-gray-300'}`}
                    >
                      請求対象
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditForm((prev) => ({ ...prev, isBillable: false }))}
                      className={`rounded-xl border px-4 py-3 text-left text-sm transition ${!editForm.isBillable ? 'border-amber-500/30 bg-amber-500/15 text-amber-100' : 'border-[#2a3553] bg-[#11182c] text-gray-300'}`}
                    >
                      請求対象外
                    </button>
                  </div>
                  {!editForm.isBillable ? (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500">対象外理由</p>
                      <Input value={editForm.billingExclusionReason} onChange={(e) => setEditForm((prev) => ({ ...prev, billingExclusionReason: e.target.value }))} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="保険上対象外、施設契約内など" />
                    </div>
                  ) : null}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="border-[#2a3553] text-gray-200 hover:bg-[#11182c]">キャンセル</Button>
            <Button onClick={() => void handleSavePatientEdit()} className="bg-indigo-600 text-white hover:bg-indigo-700">保存する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-slate-900">
            <Clock3 className="h-4 w-4 text-emerald-500" />
            訪問記録
            <Badge variant="outline" className="ml-1 border-slate-200 text-xs text-slate-500">
              準備中
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            <p className="font-medium text-slate-900">これから連携する内容</p>
            <p className="mt-1 text-slate-500">訪問記録、請求候補、請求済み状態はデータベース連携に合わせてここへ表示します。</p>
          </div>
          <p className="text-xs text-slate-500">今は訪問スケジュールと患者基本情報の整理を優先しています。</p>
        </CardContent>
      </Card>

      {(authMode !== 'cognito') && (
        <>
          {/* Request History */}
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-slate-900">
                <Clock3 className="h-4 w-4 text-indigo-500" />
                依頼履歴
                <Badge variant="outline" className="ml-1 border-slate-200 text-xs text-slate-500">
                  準備中
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="py-4 text-center text-xs text-slate-500">依頼履歴の表示はデータベース連携に合わせて整理中です。</p>
            </CardContent>
          </Card>

          {/* Handover History */}
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-slate-900">
                <FileText className="h-4 w-4 text-purple-500" />
                夜間対応履歴
                <Badge variant="outline" className="ml-1 border-slate-200 text-xs text-slate-500">
                  準備中
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="py-4 text-center text-xs text-slate-500">夜間対応履歴の表示はデータベース連携に合わせて整理中です。</p>
            </CardContent>
          </Card>
        </>
      )}

      {authMode === 'cognito' && (
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-900">
              <FileText className="h-4 w-4 text-purple-500" />
              履歴表示
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="py-2 text-sm text-slate-500">依頼履歴と夜間対応履歴は、これからデータベース連携します。</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
