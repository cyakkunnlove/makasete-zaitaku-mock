'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { adminCardClass, adminPageClass } from '@/components/admin-ui'
import { BookmarkPlus, ClipboardCheck, FileImage, Moon, Phone, Receipt, RotateCw } from 'lucide-react'

type NightRole = 'regional_admin' | 'pharmacy_admin' | 'pharmacy_staff' | 'night_pharmacist' | 'system_admin'
type NightCaseStatus = 'accepted' | 'in_progress' | 'completed' | 'pharmacy_confirmed'
type BillingStatus = 'pending' | 'linked' | 'not_needed'
type HandoffResult = '対応済み' | '薬局スタッフ確認が必要'
type AttentionLevel = '通常' | '要確認'

const morningRequestOptionsByResult: Record<HandoffResult, string[]> = {
  対応済み: ['追加対応なし', '内容確認のみ', '回収管理確認'],
  薬局スタッフ確認が必要: ['処方箋・FAX内容の確認', '患者情報確認', '家族・施設へ連絡', '回収管理確認', '管理者確認'],
}

type NightActor = {
  id: string
  displayName: string
  role: NightRole
}

type NightPharmacy = {
  id: string
  name: string
}

type NightPatient = {
  id: string
  pharmacyId: string
  fullName: string
  kana: string
  isBillable: boolean
}

type NightFax = {
  id: string
  receivedAt: string
  title: string
  linkedRequestCaseId: string | null
  status: 'unlinked' | 'linked'
}

type NightCase = {
  id: string
  acceptedAt: string
  status: NightCaseStatus
  acceptedChannel: 'phone' | 'fax'
  startedAt: string | null
  completedAt: string | null
  summary: string
  handoffNote: string
  handoffResult?: HandoffResult
  morningRequest?: string
  attentionLevel?: AttentionLevel
  billingLinkageStatus: BillingStatus
  keptForLater: boolean
  keptForLaterAt: string | null
  patient: NightPatient | null
  pharmacy: NightPharmacy | null
  handledBy: NightActor | null
  fax: NightFax | null
  isConfirmedToday: boolean
  isKeptForLater: boolean
  isHiddenFromDashboard: boolean
}

type NightFlowData = {
  actor: NightActor
  demoActors: NightActor[]
  pharmacies: NightPharmacy[]
  patients: NightPatient[]
  faxes: NightFax[]
  cases: NightCase[]
  visibleDashboardCases: NightCase[]
  summary: {
    activeCount: number
    waitingConfirmationCount: number
    confirmedTodayCount: number
    hiddenConfirmedCount: number
    keptForLaterCount: number
    unlinkedFaxCount: number
  }
}

function statusLabel(status: NightCaseStatus) {
  switch (status) {
    case 'accepted':
      return '受付済み'
    case 'in_progress':
      return '対応中'
    case 'completed':
      return '薬局確認待ち'
    case 'pharmacy_confirmed':
      return '薬局確認済み'
    default:
      return status
  }
}

function billingLabel(status: BillingStatus) {
  switch (status) {
    case 'linked':
      return '回収管理に追加済み'
    case 'not_needed':
      return '請求対象外'
    default:
      return '回収管理未追加'
  }
}

function formatDateTime(value: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function caseTone(item: NightCase) {
  if (item.status === 'completed') return 'border-amber-200 bg-amber-50'
  if (item.status === 'in_progress') return 'border-indigo-200 bg-indigo-50'
  if (item.isConfirmedToday) return 'border-emerald-200 bg-emerald-50'
  if (item.isHiddenFromDashboard) return 'border-slate-200 bg-slate-50'
  return 'border-slate-200 bg-white'
}

export default function NightFlowPage() {
  const { role, isDemo, switchRole } = useAuth()
  const [data, setData] = useState<NightFlowData | null>(null)
  const [actorRole, setActorRole] = useState<NightRole>('night_pharmacist')
  const [selectedPharmacyId, setSelectedPharmacyId] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [selectedCaseForFax, setSelectedCaseForFax] = useState('')
  const [handoffResult, setHandoffResult] = useState<HandoffResult>('薬局スタッフ確認が必要')
  const [morningRequest, setMorningRequest] = useState('処方箋・FAX内容の確認')
  const [attentionLevel, setAttentionLevel] = useState<AttentionLevel>('通常')
  const [handoffNote, setHandoffNote] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (role === 'regional_admin' || role === 'pharmacy_admin' || role === 'pharmacy_staff' || role === 'night_pharmacist' || role === 'system_admin') {
      setActorRole(role)
    }
  }, [role])

  const refresh = useCallback(async () => {
    const response = await fetch('/api/night-flow', { cache: 'no-store' })
    const json = await response.json()
    if (!response.ok) throw new Error(json.error ?? 'night_flow_fetch_failed')
    setData(json)
    setActorRole(json.actor.role)
    const pharmacyId = json.pharmacies.some((pharmacy: NightPharmacy) => pharmacy.id === selectedPharmacyId)
      ? selectedPharmacyId
      : json.pharmacies[0]?.id ?? ''
    const patients = json.patients.filter((patient: NightPatient) => patient.pharmacyId === pharmacyId)
    setSelectedPharmacyId(pharmacyId)
    setSelectedPatientId(patients[0]?.id ?? json.patients[0]?.id ?? '')
    setSelectedCaseForFax(json.visibleDashboardCases[0]?.id ?? json.cases[0]?.id ?? '')
  }, [selectedPharmacyId])

  useEffect(() => {
    refresh().catch((err: Error) => setError(err.message))
  }, [refresh])

  const pharmacyPatients = useMemo(() => {
    if (!data) return []
    return data.patients.filter((patient) => patient.pharmacyId === selectedPharmacyId)
  }, [data, selectedPharmacyId])

  const canCreateCase = data?.actor.role === 'night_pharmacist'
  const canHandleFax = data?.actor.role === 'night_pharmacist' || data?.actor.role === 'regional_admin'
  const canConfirm = data?.actor.role === 'pharmacy_admin' || data?.actor.role === 'pharmacy_staff'
  const isPharmacyActor = data?.actor.role === 'pharmacy_admin' || data?.actor.role === 'pharmacy_staff'
  const morningRequestOptions = morningRequestOptionsByResult[handoffResult]
  const selectedMorningRequest = morningRequestOptions.includes(morningRequest) ? morningRequest : morningRequestOptions[0]
  const dashboardCases = data?.visibleDashboardCases ?? []
  const waitingConfirmationCases = dashboardCases.filter((item) => item.status === 'completed')
  const otherDashboardCases = dashboardCases.filter((item) => item.status !== 'completed' && (!item.isConfirmedToday || item.isKeptForLater))
  const foldedConfirmedCases = (data?.cases ?? []).filter((item) => item.isConfirmedToday && !item.isKeptForLater)

  async function mutate(path: string, payload: Record<string, unknown>) {
    setMessage('')
    setError('')
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, actorRole }),
    })
    const json = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(json.error ?? 'operation_failed')
    await refresh()
    return json
  }

  async function createCase() {
    try {
      await mutate('/api/night-flow', {
        pharmacyId: selectedPharmacyId,
        patientId: selectedPatientId,
        acceptedChannel: 'phone',
        summary: '電話対応から受付登録',
      })
      setMessage('電話対応を夜間案件として登録しました。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '夜間案件作成に失敗しました')
    }
  }

  async function runAction(caseId: string, action: string, payload: Record<string, unknown> = {}) {
    try {
      const json = await mutate(`/api/night-flow/cases/${caseId}/${action}`, payload)
      setMessage(`${statusLabel(json.requestCase.status)} に更新しました。`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作に失敗しました')
    }
  }

  async function linkFax(faxId: string) {
    try {
      await mutate(`/api/night-flow/faxes/${faxId}/link`, { requestCaseId: selectedCaseForFax })
      setMessage('FAXを選択中の夜間案件へ紐付けました。')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'FAX紐付けに失敗しました')
    }
  }

  function updateHandoffResult(nextResult: HandoffResult) {
    setHandoffResult(nextResult)
    setMorningRequest(morningRequestOptionsByResult[nextResult][0])
  }

  function buildHandoffPayload() {
    const request = selectedMorningRequest
    const note = [
      `対応結果: ${handoffResult}`,
      `翌朝依頼: ${request}`,
      `注意度: ${attentionLevel}`,
      handoffNote.trim() ? `補足: ${handoffNote.trim()}` : '',
    ].filter(Boolean).join('\n')

    return {
      summary: handoffResult === '対応済み' ? '夜間対応完了。' : '夜間対応完了。薬局スタッフ確認が必要。',
      handoffNote: note,
      handoffResult,
      morningRequest: request,
      attentionLevel,
    }
  }

  if (!data) {
    return <div className={`${adminPageClass} text-sm text-slate-500`}>夜間フローを読み込み中...</div>
  }

  return (
    <div className={`${adminPageClass} space-y-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Moon className="h-5 w-5 text-indigo-500" />
            夜間受付フロー
          </h1>
          <p className="text-xs text-slate-500">電話受付、FAX紐付け、対応完了、薬局確認、回収管理追加までを一画面で確認します。</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refresh()}>
          <RotateCw className="h-4 w-4" />
          更新
        </Button>
      </div>

      <Card className={adminCardClass}>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1.2fr_repeat(6,minmax(0,1fr))]">
          <label className="grid gap-1 text-xs text-slate-500">
            操作ロール
            <select
              value={actorRole}
              onChange={(event) => {
                const nextRole = event.target.value as NightRole
                setActorRole(nextRole)
                if (isDemo) switchRole(nextRole)
              }}
              disabled={!isDemo}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
            >
              {data.demoActors.map((actor) => (
                <option key={actor.id} value={actor.role}>{actor.displayName} / {actor.role}</option>
              ))}
            </select>
          </label>
          <Summary label="確認待ち" value={data.summary.waitingConfirmationCount} />
          <Summary label="進行中" value={data.summary.activeCount} />
          <Summary label="本日確認済み" value={data.summary.confirmedTodayCount} />
          <Summary label="通常非表示" value={data.summary.hiddenConfirmedCount} />
          <Summary label="あとで確認" value={data.summary.keptForLaterCount} />
          <Summary label="未紐付けFAX" value={data.summary.unlinkedFaxCount} />
        </CardContent>
      </Card>

      {canCreateCase && (
        <Card className={adminCardClass}>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Phone className="h-4 w-4 text-indigo-500" />電話対応を記録</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <select value={selectedPharmacyId} onChange={(event) => {
              const pharmacyId = event.target.value
              setSelectedPharmacyId(pharmacyId)
              setSelectedPatientId(data.patients.find((patient) => patient.pharmacyId === pharmacyId)?.id ?? '')
            }} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm">
              {data.pharmacies.map((pharmacy) => <option key={pharmacy.id} value={pharmacy.id}>{pharmacy.name}</option>)}
            </select>
            <select value={selectedPatientId} onChange={(event) => setSelectedPatientId(event.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm">
              {pharmacyPatients.map((patient) => <option key={patient.id} value={patient.id}>{patient.fullName} / {patient.kana}</option>)}
            </select>
            <Button onClick={createCase} disabled={!selectedPharmacyId || !selectedPatientId} className="bg-indigo-600 text-white hover:bg-indigo-500">電話対応を記録</Button>
          </CardContent>
        </Card>
      )}

      {canCreateCase && (
        <Card className={adminCardClass}>
          <CardHeader className="pb-2"><CardTitle className="text-base">申し送りテンプレート</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_140px]">
            <label className="grid gap-1 text-xs text-slate-500">
              対応結果
              <select value={handoffResult} onChange={(event) => updateHandoffResult(event.target.value as HandoffResult)} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900">
                <option value="対応済み">対応済み</option>
                <option value="薬局スタッフ確認が必要">薬局スタッフ確認が必要</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs text-slate-500">
              翌朝依頼
              <select value={selectedMorningRequest} onChange={(event) => setMorningRequest(event.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900">
                {morningRequestOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-xs text-slate-500">
              注意度
              <select value={attentionLevel} onChange={(event) => setAttentionLevel(event.target.value as AttentionLevel)} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900">
                <option value="通常">通常</option>
                <option value="要確認">要確認</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs text-slate-500 md:col-span-3">
              補足メモ（任意）
              <textarea value={handoffNote} onChange={(event) => setHandoffNote(event.target.value)} rows={2} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" placeholder="必要な場合だけ短く入力" />
            </label>
          </CardContent>
        </Card>
      )}

      {canHandleFax && (
        <Card className={adminCardClass}>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><FileImage className="h-4 w-4 text-amber-500" />FAX受信一覧</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <select value={selectedCaseForFax} onChange={(event) => setSelectedCaseForFax(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm md:w-[420px]">
              {data.cases.map((item) => <option key={item.id} value={item.id}>{item.patient?.fullName ?? '患者未特定'} / {statusLabel(item.status)}</option>)}
            </select>
            <div className="grid gap-3 md:grid-cols-2">
              {data.faxes.map((fax) => (
                <div key={fax.id} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{fax.title}</p>
                      <p className="mt-1 text-xs text-slate-500">受信 {formatDateTime(fax.receivedAt)} / 紐付け先 {fax.linkedRequestCaseId ?? '-'}</p>
                    </div>
                    <Badge variant="outline" className={fax.status === 'linked' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}>{fax.status === 'linked' ? '紐付け済み' : '未紐付け'}</Badge>
                  </div>
                  {data.actor.role === 'night_pharmacist' && fax.status === 'unlinked' && <Button variant="outline" size="sm" className="mt-3" onClick={() => linkFax(fax.id)}>選択中の案件へ紐付け</Button>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isPharmacyActor && (
        <CaseSection title="夜間対応確認待ち" cases={waitingConfirmationCases} canConfirm={canConfirm} canConnectBilling={canConfirm} actorRole={data.actor.role} runAction={runAction} completePayload={buildHandoffPayload} />
      )}
      <CaseSection title={isPharmacyActor ? '進行中・あとで確認' : '確認待ち・進行中'} cases={isPharmacyActor ? otherDashboardCases : dashboardCases} canConfirm={canConfirm} canConnectBilling={canConfirm} actorRole={data.actor.role} runAction={runAction} completePayload={buildHandoffPayload} />
      <ConfirmedCaseSection cases={foldedConfirmedCases} canConnectBilling={canConfirm} actorRole={data.actor.role} runAction={runAction} completePayload={buildHandoffPayload} />

      <div className="flex flex-wrap gap-2">
        <Link href="/dashboard/requests"><Button variant="outline">依頼管理へ</Button></Link>
        <Link href="/dashboard/night-patients"><Button variant="outline">夜間患者検索へ</Button></Link>
      </div>
      {message && <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </div>
  )
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function CaseSection({ title, cases, actorRole, canConfirm, canConnectBilling, runAction, completePayload }: { title: string; cases: NightCase[]; actorRole: NightRole; canConfirm: boolean; canConnectBilling: boolean; runAction: (caseId: string, action: string, payload?: Record<string, unknown>) => Promise<void>; completePayload: () => Record<string, unknown> }) {
  return (
    <Card className={adminCardClass}>
      <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="h-4 w-4 text-indigo-500" />{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {cases.length === 0 ? <p className="text-sm text-slate-500">対象の夜間対応はありません。</p> : cases.map((item) => (
          <CaseCard key={item.id} item={item} actorRole={actorRole} canConfirm={canConfirm} canConnectBilling={canConnectBilling} runAction={runAction} completePayload={completePayload} />
        ))}
      </CardContent>
    </Card>
  )
}

function ConfirmedCaseSection({ cases, actorRole, canConnectBilling, runAction, completePayload }: { cases: NightCase[]; actorRole: NightRole; canConnectBilling: boolean; runAction: (caseId: string, action: string, payload?: Record<string, unknown>) => Promise<void>; completePayload: () => Record<string, unknown> }) {
  return (
    <Card className={adminCardClass}>
      <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="h-4 w-4 text-emerald-600" />本日確認済み</CardTitle></CardHeader>
      <CardContent>
        <details>
          <summary className="cursor-pointer text-sm text-slate-600">折りたたみ表示 ({cases.length}件)</summary>
          <div className="mt-3 space-y-3">
            {cases.length === 0 ? <p className="text-sm text-slate-500">本日確認済みの夜間対応はありません。</p> : cases.map((item) => (
              <CaseCard key={item.id} item={item} actorRole={actorRole} canConfirm={false} canConnectBilling={canConnectBilling} runAction={runAction} completePayload={completePayload} />
            ))}
          </div>
        </details>
      </CardContent>
    </Card>
  )
}

function CaseCard({ item, actorRole, canConfirm, canConnectBilling, runAction, completePayload }: { item: NightCase; actorRole: NightRole; canConfirm: boolean; canConnectBilling: boolean; runAction: (caseId: string, action: string, payload?: Record<string, unknown>) => Promise<void>; completePayload: () => Record<string, unknown> }) {
  return (
    <div className={cn('rounded-lg border p-4', caseTone(item))}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-slate-900">{item.patient?.fullName ?? '患者未特定'}</p>
          <p className="mt-1 text-xs text-slate-500">{item.pharmacy?.name ?? '-'} / {statusLabel(item.status)} / {billingLabel(item.billingLinkageStatus)}</p>
        </div>
        <p className="text-xs text-slate-500">受付 {formatDateTime(item.acceptedAt)}</p>
      </div>
      <div className="mt-3 grid gap-1 text-xs text-slate-600 md:grid-cols-2">
        <p>FAX: {item.fax?.title ?? '-'}</p>
        <p>対応者: {item.handledBy?.displayName ?? '-'}</p>
        <p>開始: {formatDateTime(item.startedAt)}</p>
        <p>完了: {formatDateTime(item.completedAt)}</p>
        <p>対応結果: {item.handoffResult ?? '-'}</p>
        <p>翌朝依頼: {item.morningRequest ?? '-'}</p>
        <p>注意度: {item.attentionLevel ?? '通常'}</p>
        {item.isKeptForLater && <p>あとで確認: {formatDateTime(item.keptForLaterAt)}</p>}
        <p className="whitespace-pre-line md:col-span-2">申し送り: {item.handoffNote || '-'}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {actorRole === 'night_pharmacist' && item.status === 'accepted' && <Button variant="outline" size="sm" onClick={() => runAction(item.id, 'start')}>対応開始</Button>}
        {actorRole === 'night_pharmacist' && (item.status === 'accepted' || item.status === 'in_progress') && <Button variant="outline" size="sm" onClick={() => runAction(item.id, 'complete', completePayload())}>対応完了</Button>}
        {canConfirm && item.status === 'completed' && <Button variant="outline" size="sm" onClick={() => runAction(item.id, 'confirm')}>薬局確認済みにする</Button>}
        {canConnectBilling && item.status === 'pharmacy_confirmed' && !item.isKeptForLater && <Button variant="outline" size="sm" onClick={() => runAction(item.id, 'keep_for_later')}><BookmarkPlus className="h-3.5 w-3.5" />あとで確認に残す</Button>}
        {canConnectBilling && item.status === 'pharmacy_confirmed' && item.billingLinkageStatus !== 'linked' && <Button variant="outline" size="sm" onClick={() => runAction(item.id, 'connect_billing', { isBillable: item.patient?.isBillable !== false })}><Receipt className="h-3.5 w-3.5" />回収管理に追加</Button>}
      </div>
    </div>
  )
}
