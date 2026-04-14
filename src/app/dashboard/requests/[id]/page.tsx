'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import {
  requestData,
  patientData,
  staffData,
  statusMeta,
  priorityMeta,
  requestStepIndex,
  checklistTemplates,
  getAttentionFlags,
  getAttentionFlagClass,
} from '@/lib/mock-data'
import type { RegisteredPatientRecord } from '@/lib/patient-master'
import { mergePatientSources } from '@/lib/patient-read-model'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { adminCardClass, adminPageClass, adminPanelClass } from '@/components/admin-ui'
import { cn } from '@/lib/utils'
import type { ChecklistType, ChecklistItem, RequestStatus } from '@/types/database'
import {
  ArrowLeft,
  Clock3,
  User,
  Building2,
  Phone,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  FileText,
} from 'lucide-react'

function getAdminDisplayStatus(status: RequestStatus, patientId: string | null) {
  if (status === 'completed') {
    return { label: '完了', className: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' }
  }
  if (['dispatched', 'arrived', 'in_progress'].includes(status)) {
    return { label: '対応中', className: 'border-sky-500/40 bg-sky-500/20 text-sky-300' }
  }
  if (patientId) {
    return { label: '患者特定済', className: 'border-indigo-500/40 bg-indigo-500/20 text-indigo-300' }
  }
  return { label: '受付', className: 'border-amber-500/40 bg-amber-500/20 text-amber-300' }
}

function getPharmacyDisplayStatus(status: RequestStatus) {
  if (status === 'completed') {
    return { label: '完了', className: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' }
  }
  if (['dispatched', 'arrived', 'in_progress'].includes(status)) {
    return { label: '対応中', className: 'border-sky-500/40 bg-sky-500/20 text-sky-300' }
  }
  return { label: '対応準備中', className: 'border-amber-500/40 bg-amber-500/20 text-amber-300' }
}

export default function RequestDetailPage() {
  const params = useParams()
  const { role } = useAuth()
  const isAdmin = role === 'regional_admin'
  const isPharmacyAdmin = role === 'pharmacy_admin'
  const isNightPharmacist = role === 'night_pharmacist'
  const id = params.id as string

  const [databasePatients, setDatabasePatients] = useState<RegisteredPatientRecord[]>([])
  const request = requestData.find((r) => r.id === id)

  useEffect(() => {
    const pharmacyId = request?.pharmacyId
    if (!pharmacyId) return
    let cancelled = false
    async function fetchPatients() {
      try {
        const response = await fetch(`/api/patients/by-pharmacy/${pharmacyId}`, { cache: 'no-store' })
        const result = await response.json().catch(() => null)
        if (!cancelled && response.ok && result?.ok && Array.isArray(result.patients)) {
          setDatabasePatients(result.patients)
        }
      } catch {
        if (!cancelled) setDatabasePatients([])
      }
    }
    fetchPatients()
    return () => {
      cancelled = true
    }
  }, [request?.pharmacyId])

  const patientSource = useMemo(
    () => (databasePatients.length > 0 ? mergePatientSources({ databasePatients, includeMockPatients: false }) : patientData),
    [databasePatients],
  )

  const patient = request && request.patientId ? patientSource.find((p) => p.id === request.patientId) : null
  const needsFaxReview = request ? ['fax_pending', 'fax_received', 'assigning', 'assigned', 'checklist'].includes(request.status) : false
  const assignee = request?.assigneeId
    ? staffData.find((s) => s.id === request.assigneeId)
    : null

  const [checklistType, setChecklistType] = useState<ChecklistType>('initial')
  const [checklists, setChecklists] = useState<Record<ChecklistType, ChecklistItem[]>>(() => ({
    initial: checklistTemplates.initial.map((item) => ({ ...item })),
    routine: checklistTemplates.routine.map((item) => ({ ...item })),
    emergency: checklistTemplates.emergency.map((item) => ({ ...item })),
  }))

  if (!request) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className={`${adminCardClass} p-8 text-center`}>
          <CardContent className="space-y-4">
            <p className="text-lg font-semibold text-slate-900">依頼が見つかりません</p>
            <p className="text-sm text-slate-500">ID: {id} に該当する依頼データが存在しません。</p>
            <Link href="/dashboard/requests">
              <Button variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                <ArrowLeft className="mr-2 h-4 w-4" />
                依頼一覧へ戻る
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentStep = requestStepIndex[request.status]
  const status = isAdmin ? getAdminDisplayStatus(request.status, request.patientId) : isPharmacyAdmin ? getPharmacyDisplayStatus(request.status) : statusMeta[request.status]
  const priority = priorityMeta[request.priority]
  const attentionFlags = patient ? getAttentionFlags(patient) : []
  const currentChecklist = checklists[checklistType]
  const checkedCount = currentChecklist.filter((item) => item.checked).length
  const totalCount = currentChecklist.length
  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0

  const toggleCheckItem = (index: number) => {
    setChecklists((prev) => {
      const updated = { ...prev }
      updated[checklistType] = prev[checklistType].map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item
      )
      return updated
    })
  }

  const checklistTypeLabels: Record<ChecklistType, string> = {
    initial: '初回訪問',
    routine: '定期訪問',
    emergency: '緊急対応',
  }

  const linkedAt = request.patientLinkedAt ? request.patientLinkedAt.split(' ')[1] : ''
  const patientResolved = Boolean(request.patientId)

  if (isPharmacyAdmin) {
    const latestEvent = request.timelineEvents[request.timelineEvents.length - 1]
    return (
      <div className={`${adminPageClass} space-y-4`}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/requests">
            <Button variant="outline" size="icon" className="h-8 w-8 border-slate-200 bg-white text-slate-600 hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{request.id}</h1>
            <p className="text-xs text-slate-500">自局依頼の進行状況サマリー</p>
          </div>
        </div>

        <Card className={adminCardClass}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-medium text-slate-900">{request.pharmacyName}</p>
              <p className="text-xs text-slate-500">受付 {request.receivedDate} {request.receivedAt}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn('border text-xs', status.className)}>{status.label}</Badge>
              <Badge variant="outline" className={cn('border text-xs', request.priority === 'high' ? 'border-rose-500/40 bg-rose-500/20 text-rose-300' : request.priority === 'normal' ? 'border-amber-500/40 bg-amber-500/20 text-amber-300' : 'border-sky-500/40 bg-sky-500/20 text-sky-300')}>
                <span className={cn('mr-1 inline-block h-2 w-2 rounded-full', priority.dot)} />優先度 {priority.label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className={adminCardClass}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-900">薬局向け状況</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className={`${adminPanelClass} flex items-center justify-between p-3`}>
                <span className="text-gray-400">現在の状況</span>
                <Badge variant="outline" className={cn('border text-xs', status.className)}>{status.label}</Badge>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">最終更新</p>
                <p className="mt-1 text-slate-900">{latestEvent?.timestamp ?? `${request.receivedDate} ${request.receivedAt}`}</p>
                <p className="mt-1 text-xs text-slate-500">{latestEvent?.note ?? '依頼受付済み'}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">担当状況</p>
                <p className="mt-1 text-slate-900">{assignee ? `${assignee.name} が対応中` : '担当調整中'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className={adminCardClass}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-900">朝の確認メモ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <div className={`${adminPanelClass} p-3`}>
                <p className="text-xs text-slate-500">確認したいこと</p>
                <p className="mt-1 text-slate-900">{request.status === 'completed' ? '夜間対応は完了しています。朝の通常訪問・申し送り確認をお願いします。' : '夜間対応は継続中です。朝の引き継ぎまで状況確認だけできる表示にしています。'}</p>
              </div>
              {request.notes && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">共有メモ</p>
                  <p className="mt-1 text-slate-900">{request.notes}</p>
                </div>
              )}
              <p className="text-xs text-slate-500">薬局管理者画面では、患者詳細・FAX原本・内部アサイン工程は表示しません。</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Mock timeline events for this request
  const timelineEvents = isAdmin
    ? [
        { time: request.receivedAt, label: '受付', done: true, userName: '事務局' },
        { time: linkedAt, label: '患者特定', done: patientResolved, userName: request.patientLinkedBy ?? '' },
        {
          time: currentStep >= 3 ? '23:18' : currentStep >= 2 ? '23:15' : '',
          label: '対応開始',
          done: currentStep >= 2,
          userName: assignee?.name ?? '',
        },
        { time: currentStep >= 6 ? '00:05' : '', label: '完了', done: currentStep >= 6, userName: assignee?.name ?? '' },
      ]
    : [
        { time: request.receivedAt, label: '電話受付', done: true, userName: '事務局' },
        { time: currentStep >= 1 ? '23:12' : '', label: 'FAX受信', done: currentStep >= 1 || needsFaxReview, userName: '事務局' },
        { time: linkedAt, label: '患者確認・受付登録', done: patientResolved, userName: request.patientLinkedBy ?? assignee?.name ?? '' },
        { time: currentStep >= 3 ? '23:18' : '', label: '対応開始', done: currentStep >= 3, userName: assignee?.name ?? '' },
        { time: currentStep >= 5 ? '23:35' : '', label: '対応メモ追加', done: currentStep >= 5, userName: assignee?.name ?? '' },
        { time: currentStep >= 6 ? '00:05' : '', label: '申し送り作成 / 対応完了', done: currentStep >= 6, userName: assignee?.name ?? '' },
      ]

  return (
    <div className={`${adminPageClass} space-y-4`}>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/requests">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{request.id}</h1>
            <p className="text-xs text-slate-500">
              {request.receivedDate} {request.receivedAt} 受付
            </p>
            {isAdmin && (
              <p className="mt-1 text-[11px] text-amber-300">運営管理表示: 受付→患者特定→対応開始→完了 の流れで表示。患者詳細・FAX原本・申し送り本文は非表示</p>
            )}
            {isNightPharmacist && (
              <p className="mt-1 text-[11px] text-sky-300">Night Pharmacist は電話受電後にFAX内容を確認し、患者検索・患者確認を行い、確認時点のタイムスタンプを受付時間として記録して対応完了後に夜間対応内容を残します。</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {needsFaxReview && !isAdmin && (
            <Link href={`/dashboard/requests/${request.id}/fax`}>
              <Button className="h-8 bg-indigo-500 text-white hover:bg-indigo-500/90">
                FAX確認・患者特定
              </Button>
            </Link>
          )}
          {isNightPharmacist && (
            <>
              <Link href={`/dashboard/night-patients?requestId=${request.id}${needsFaxReview ? '&source=fax' : '&source=phone'}`}>
                <Button variant="outline" className="h-8 border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                  患者検索
                </Button>
              </Link>
              <Link href={`/dashboard/handovers/new?requestId=${request.id}`}>
                <Button variant="outline" className="h-8 border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                  夜間対応内容を残す
                </Button>
              </Link>
            </>
          )}
          <Badge variant="outline" className={cn('border text-xs', status.className)}>
            {status.label}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              'border text-xs',
              request.priority === 'high'
                ? 'border-rose-500/40 bg-rose-500/20 text-rose-300'
                : request.priority === 'normal'
                  ? 'border-amber-500/40 bg-amber-500/20 text-amber-300'
                  : 'border-sky-500/40 bg-sky-500/20 text-sky-300'
            )}
          >
            <span className={cn('mr-1 inline-block h-2 w-2 rounded-full', priority.dot)} />
            優先度 {priority.label}
          </Badge>
        </div>
      </div>

      {isNightPharmacist && (
        <Card className="border-indigo-200 bg-indigo-50">
          <CardContent className="grid gap-3 p-4 md:grid-cols-3">
            <div>
              <p className="text-[11px] text-indigo-600">受付起点</p>
              <p className="mt-1 text-sm text-slate-900">電話受電 → FAX受信</p>
            </div>
            <div>
              <p className="text-[11px] text-indigo-600">受付時間の定義</p>
              <p className="mt-1 text-sm text-slate-900">患者確認ボタン押下のタイムスタンプ</p>
            </div>
            <div>
              <p className="text-[11px] text-indigo-600">検索範囲</p>
              <p className="mt-1 text-sm text-slate-900">リージョンアドミン管轄内の患者</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uber Eats Style Vertical Timeline - Always Visible */}
      <Card className={adminCardClass}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-slate-900">
            <Clock3 className="h-4 w-4 text-indigo-500" />
            対応ステータス
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="relative space-y-0">
            {timelineEvents.map((event, index) => {
              const isCompleted = event.done && index < currentStep
              const isCurrent = index === currentStep && event.done
              return (
                <div key={index} className="relative flex gap-3 pb-4 last:pb-0">
                  {/* Vertical line */}
                  {index < timelineEvents.length - 1 && (
                    <div
                      className={cn(
                        'absolute left-[11px] top-6 h-full w-0.5',
                        isCompleted ? 'bg-emerald-500/60' : isCurrent ? 'bg-indigo-500/60' : 'bg-[#2a3553]'
                      )}
                    />
                  )}
                  {/* Status Dot */}
                  <div
                    className={cn(
                      'relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all',
                      isCompleted
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : isCurrent
                          ? 'border-indigo-400 bg-indigo-500 text-white animate-pulse shadow-lg shadow-indigo-500/40'
                          : 'border-slate-200 bg-white'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : isCurrent ? (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-gray-600" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex flex-1 items-center justify-between pt-0.5">
                    <div>
                      <p
                        className={cn(
                          'text-sm',
                          isCompleted
                            ? 'font-medium text-emerald-300'
                            : isCurrent
                              ? 'font-semibold text-indigo-300'
                              : 'text-gray-500'
                        )}
                      >
                        {event.label}
                        {isCurrent && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                            現在
                          </span>
                        )}
                      </p>
                      {event.done && event.userName && (
                        <p className="mt-0.5 text-xs text-gray-500">担当: {event.userName}</p>
                      )}
                    </div>
                    {event.time && event.done && (
                      <p className="text-xs text-slate-500">{event.time}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Info Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Patient Info */}
        <Card className={adminCardClass}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-900">
              <User className="h-4 w-4 text-indigo-500" />
              {isAdmin ? '患者特定状況' : '患者情報'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isAdmin ? (
              <div className={`${adminPanelClass} space-y-3 p-3 text-sm`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-400">患者状態</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'border text-xs',
                      patient
                        ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                        : 'border-purple-500/40 bg-purple-500/20 text-purple-300'
                    )}
                  >
                    {patient ? '患者特定済' : '患者未特定'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-400">加盟店</p>
                    <p className="mt-1 text-gray-200">{request.pharmacyName}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">患者ID</p>
                    <p className="mt-1 text-gray-200">{request.patientId ?? '未設定'}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  運営管理ロールでは氏名・住所・連絡先・医療情報・FAX原本は表示しません。
                </p>
              </div>
            ) : patient ? (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{patient.name}</p>
                    <p className="mt-0.5 text-xs text-gray-400">生年月日: {patient.dob}</p>
                  </div>
                  {attentionFlags.length > 0 && (
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {attentionFlags.slice(0, 3).map((flag) => (
                        <Badge
                          key={flag.key}
                          variant="outline"
                          className={cn('border text-[10px]', getAttentionFlagClass(flag.tone))}
                        >
                          {flag.label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-500" />
                    <span className="text-gray-300">{patient.address}</span>
                  </div>

                  <div className="rounded-md border border-[#2a3553] bg-[#0a0e1a] p-3 space-y-1.5">
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                      緊急連絡先
                    </p>
                    <p className="text-gray-200">
                      {patient.emergencyContact.name}（{patient.emergencyContact.relation}）
                    </p>
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <Phone className="h-3 w-3 text-gray-500" />
                      {patient.emergencyContact.phone}
                    </div>
                  </div>

                  <div className="rounded-md border border-[#2a3553] bg-[#0a0e1a] p-3 space-y-1.5">
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                      主治医
                    </p>
                    <p className="text-gray-200">
                      {patient.doctor.name} / {patient.doctor.clinic}
                    </p>
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <Phone className="h-3 w-3 text-gray-500" />
                      {patient.doctor.phone}
                    </div>
                  </div>

                  {patient.allergies && patient.allergies !== 'なし' && (
                    <div className="flex items-start gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 p-2">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                      <div>
                        <p className="text-[11px] font-medium text-rose-300">アレルギー</p>
                        <p className="text-rose-200">{patient.allergies}</p>
                      </div>
                    </div>
                  )}

                  {patient.visitNotes && (
                    <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2">
                      <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                      <div>
                        <p className="text-[11px] font-medium text-amber-300">訪問時注意事項</p>
                        <p className="text-amber-200">{patient.visitNotes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-3 rounded-md border border-purple-500/30 bg-purple-500/10 p-3 text-sm text-purple-100">
                <p className="font-medium">患者未特定の仮案件です</p>
                <p className="text-xs text-purple-200/80">FAX原本を確認し、患者検索から候補を照合して確定します。</p>
                <Link href={`/dashboard/requests/${request.id}/fax`}>
                  <Button className="bg-indigo-500 text-white hover:bg-indigo-500/90">
                    FAX確認・患者特定へ進む
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request Details */}
        <Card className={adminCardClass}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-900">
              <FileText className="h-4 w-4 text-indigo-500" />
              依頼詳細
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-400">受付時刻</p>
                <p className="mt-0.5 flex items-center gap-1 text-gray-200">
                  <Clock3 className="h-3.5 w-3.5 text-gray-500" />
                  {request.receivedDate} {request.receivedAt}
                </p>
              </div>
              <div>
                <p className="text-gray-400">薬局</p>
                <p className="mt-0.5 flex items-center gap-1 text-gray-200">
                  <Building2 className="h-3.5 w-3.5 text-gray-500" />
                  {request.pharmacyName}
                </p>
              </div>
            </div>

            <div className={`${adminPanelClass} space-y-2 p-3 text-xs`}>
              <div>
                <p className="text-gray-400">症状</p>
                <p className="mt-0.5 text-gray-200">{request.symptom}</p>
              </div>
              <div>
                <p className="text-gray-400">バイタル変化</p>
                <p className="mt-0.5 text-gray-200">{request.vitalsChange}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-400">意識レベル</p>
                  <p className="mt-0.5 text-gray-200">{request.consciousness}</p>
                </div>
                <div>
                  <p className="text-gray-400">緊急度</p>
                  <p className="mt-0.5 flex items-center gap-1 text-gray-200">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    {request.urgency}
                  </p>
                </div>
              </div>
            </div>

            {request.notes && (
              <div className="text-xs">
                <p className="text-gray-400">備考</p>
                <p className="mt-0.5 text-gray-200">{request.notes}</p>
              </div>
            )}

            <div className="text-xs">
              <p className="text-gray-400">SLAステータス</p>
              <div className="mt-1">
                {request.slaMet === null ? (
                  <Badge
                    variant="outline"
                    className="border-gray-500/40 bg-gray-500/20 text-gray-300 text-xs"
                  >
                    未計測
                  </Badge>
                ) : request.slaMet ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/40 bg-emerald-500/20 text-emerald-300 text-xs"
                  >
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    SLA達成
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-rose-500/40 bg-rose-500/20 text-rose-300 text-xs"
                  >
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    SLA未達
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignee Card */}
      <Card className={adminCardClass}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm text-slate-900">
            <User className="h-4 w-4 text-indigo-500" />
            担当夜間薬剤師
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignee ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-indigo-500/40 bg-indigo-500/20 text-sm font-semibold text-indigo-300">
                  {assignee.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{assignee.name}</p>
                  <p className="text-xs text-gray-400">{assignee.role === 'night_pharmacist' ? 'Night Pharmacist' : assignee.role}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-gray-300">
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-gray-500" />
                  {assignee.phone}
                </span>
                <span className="text-gray-400">{assignee.email}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2a3553] bg-[#0a0e1a] text-gray-500">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-gray-300">未割当</p>
                <p className="text-xs text-gray-500">夜間薬剤師がまだアサインされていません</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs: Checklist / Timeline */}
      <Tabs defaultValue={isAdmin ? 'timeline' : 'checklist'} className="space-y-3">
        <TabsList className="h-auto w-full justify-start gap-2 rounded-lg bg-[#111827] p-1">
          {!isAdmin && (
            <TabsTrigger
              value="checklist"
              className="rounded-md border border-[#2a3553] bg-[#111827] px-3 py-1.5 text-xs text-gray-300 data-[state=active]:border-indigo-500 data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
            >
              チェックリスト
            </TabsTrigger>
          )}
          <TabsTrigger
            value="timeline"
            className="rounded-md border border-[#2a3553] bg-[#111827] px-3 py-1.5 text-xs text-gray-300 data-[state=active]:border-indigo-500 data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
          >
            タイムライン
          </TabsTrigger>
        </TabsList>

        {/* Checklist Tab - hidden for admin */}
        {!isAdmin && <TabsContent value="checklist">
          <Card className="border-[#2a3553] bg-[#1a2035]">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-sm text-white">対応チェックリスト</CardTitle>
                <div className="flex gap-2">
                  {(Object.keys(checklistTypeLabels) as ChecklistType[]).map((type) => (
                    <Button
                      key={type}
                      variant="outline"
                      size="sm"
                      onClick={() => setChecklistType(type)}
                      className={cn(
                        'h-7 border text-xs',
                        checklistType === type
                          ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                          : 'border-[#2a3553] bg-[#0a0e1a] text-gray-400 hover:bg-[#212b45]'
                      )}
                    >
                      {checklistTypeLabels[type]}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">
                    完了: {checkedCount} / {totalCount}
                  </span>
                  <span className={cn(
                    'font-medium',
                    progressPercent === 100 ? 'text-emerald-400' : 'text-indigo-400'
                  )}>
                    {progressPercent}%
                  </span>
                </div>
                <Progress
                  value={progressPercent}
                  className="h-2 bg-[#0a0e1a]"
                />
              </div>

              {/* Checklist Items */}
              <div className="space-y-2">
                {currentChecklist.map((item, index) => (
                  <label
                    key={`${checklistType}-${index}`}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors',
                      item.checked
                        ? 'border-emerald-500/30 bg-emerald-500/10'
                        : 'border-[#2a3553] bg-[#0a0e1a] hover:border-[#3a4563]'
                    )}
                  >
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={() => toggleCheckItem(index)}
                      className={cn(
                        'border-[#2a3553]',
                        item.checked && 'border-emerald-500 bg-emerald-500 text-white data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white'
                      )}
                    />
                    <span
                      className={cn(
                        'text-sm',
                        item.checked ? 'text-emerald-300 line-through' : 'text-gray-200'
                      )}
                    >
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>}

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card className={adminCardClass}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-900">対応タイムライン</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-0">
                {timelineEvents.map((event, index) => (
                  <div key={index} className="relative flex gap-4 pb-6 last:pb-0">
                    {/* Vertical line */}
                    {index < timelineEvents.length - 1 && (
                      <div
                        className={cn(
                          'absolute left-[11px] top-6 h-full w-px',
                          event.done ? 'bg-indigo-500/50' : 'bg-[#2a3553]'
                        )}
                      />
                    )}
                    {/* Dot */}
                    <div
                      className={cn(
                        'relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                        event.done
                          ? 'border-indigo-500 bg-indigo-500 text-white'
                          : 'border-[#2a3553] bg-[#0a0e1a] text-gray-600'
                      )}
                    >
                      {event.done ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-gray-600" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 pt-0.5">
                      <p
                        className={cn(
                          'text-sm',
                          event.done ? 'font-medium text-white' : 'text-gray-500'
                        )}
                      >
                        {event.label}
                      </p>
                      {event.time && event.done && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                          <Clock3 className="h-3 w-3" />
                          {request.receivedDate} {event.time}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
