'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { useReauthGuard } from '@/hooks/use-reauth-guard'
import {
  DEFAULT_BILLING_PAID_CANCEL_WINDOW_MINUTES,
  DEFAULT_PATIENT_EDIT_WINDOW_MINUTES,
} from '@/lib/correction-policy'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Shield, Building2, PhoneCall, BellRing, Save, FileText, Workflow, Gauge } from 'lucide-react'

const emergencyRouteOptions = ['Regional Admin 受付', '自局電話で受付', '転送電話で受付', 'LINE通知中心', 'その他']
type SettingsErrorKey = 'forwardingPhone' | 'patientEditWindowMinutes' | 'billingPaidCancelWindowMinutes' | 'lightMax' | 'mediumMax' | 'firstVisitWeight' | 'inProgressWeight' | 'distanceWeight'
type SettingsErrors = Partial<Record<SettingsErrorKey, string>>

function normalizeFullWidthAscii(value: string) {
  return value.replace(/[！-～]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0)).replace(/　/g, ' ')
}

function normalizePhone(value: string) {
  return normalizeFullWidthAscii(value).replace(/[^0-9]/g, '').slice(0, 11)
}

function formatPhone(value: string) {
  const digits = normalizePhone(value)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  if (digits.length === 10) return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

function normalizeDecimal(value: string) {
  return normalizeFullWidthAscii(value).replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1').slice(0, 5)
}

function normalizeInteger(value: string) {
  return normalizeFullWidthAscii(value).replace(/[^0-9]/g, '').slice(0, 4)
}

function isValidPhone(value: string) {
  const digits = normalizePhone(value)
  return !digits || digits.length === 10 || digits.length === 11
}

function FieldErrorText({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-[11px] font-medium text-rose-600">{message}</p>
}

export default function PharmacySettingsPage() {
  const { role } = useAuth()
  const { guard, requiresReverification } = useReauthGuard()
  const isPharmacyAdmin = role === 'pharmacy_admin'
  const canViewPage = role === 'pharmacy_admin' || role === 'regional_admin'
  const [toast, setToast] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<SettingsErrors>({})
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [settings, setSettings] = useState({
    pharmacyName: '城南みらい薬局',
    emergencyRoute: 'Regional Admin 受付',
    nightDelegationEnabled: 'on',
    forwardingPhone: '03-1234-5678',
    defaultMorningNote: '夜間申し送りは pharmacy_admin が朝一確認し、必要に応じて pharmacy_staff へ共有する。',
    contractPlan: '加盟店 / 夜間受託あり',
    adminOwner: '山田 美咲',
  })

  const inputClass = (field: SettingsErrorKey) => `mt-1 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 ${fieldErrors[field] ? 'border-rose-300 bg-rose-50 ring-1 ring-rose-100' : ''}`

  const validateSettings = () => {
    const errors: SettingsErrors = {}
    const patientEditWindowMinutes = Number(correctionSettings.patientEditWindowMinutes)
    const billingPaidCancelWindowMinutes = Number(correctionSettings.billingPaidCancelWindowMinutes)
    const lightMax = Number(workloadSettings.lightMax)
    const mediumMax = Number(workloadSettings.mediumMax)
    const firstVisitWeight = Number(workloadSettings.firstVisitWeight)
    const inProgressWeight = Number(workloadSettings.inProgressWeight)
    const distanceWeight = Number(workloadSettings.distanceWeight)

    if (!isValidPhone(settings.forwardingPhone)) errors.forwardingPhone = '転送先電話は10桁または11桁で入力してください。'
    if (!Number.isFinite(patientEditWindowMinutes) || patientEditWindowMinutes < 1 || patientEditWindowMinutes > 1440) errors.patientEditWindowMinutes = '1分から1440分の範囲で入力してください。'
    if (!Number.isFinite(billingPaidCancelWindowMinutes) || billingPaidCancelWindowMinutes < 1 || billingPaidCancelWindowMinutes > 1440) errors.billingPaidCancelWindowMinutes = '1分から1440分の範囲で入力してください。'
    if (!Number.isFinite(lightMax) || lightMax <= 0) errors.lightMax = '0より大きい数値を入力してください。'
    if (!Number.isFinite(mediumMax) || mediumMax <= lightMax) errors.mediumMax = '軽めの上限より大きい数値を入力してください。'
    if (!Number.isFinite(firstVisitWeight) || firstVisitWeight < 0) errors.firstVisitWeight = '0以上の数値を入力してください。'
    if (!Number.isFinite(inProgressWeight) || inProgressWeight < 0) errors.inProgressWeight = '0以上の数値を入力してください。'
    if (!Number.isFinite(distanceWeight) || distanceWeight < 0) errors.distanceWeight = '0以上の数値を入力してください。'

    return errors
  }
  const [workloadSettings, setWorkloadSettings] = useState({
    lightMax: '4',
    mediumMax: '8',
    firstVisitWeight: '1.5',
    inProgressWeight: '1.2',
    distanceWeight: '0.3',
  })
  const [correctionSettings, setCorrectionSettings] = useState({
    patientEditWindowMinutes: String(DEFAULT_PATIENT_EDIT_WINDOW_MINUTES),
    billingPaidCancelWindowMinutes: String(DEFAULT_BILLING_PAID_CANCEL_WINDOW_MINUTES),
    correctionReasonRequired: true,
  })

  useEffect(() => {
    if (!canViewPage || role === 'regional_admin') {
      setIsLoadingSettings(false)
      return
    }
    let active = true
    setIsLoadingSettings(true)
    fetch('/api/pharmacy-master-settings', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => null)
        if (!response.ok || !data?.ok) throw new Error(data?.error ?? 'pharmacy_settings_fetch_failed')
        if (!active) return
        setSettings({
          pharmacyName: data.settings.pharmacyName ?? '',
          emergencyRoute: data.settings.emergencyRoute ?? 'Regional Admin 受付',
          nightDelegationEnabled: data.settings.nightDelegationEnabled ?? 'off',
          forwardingPhone: normalizePhone(data.settings.forwardingPhone ?? ''),
          defaultMorningNote: data.settings.defaultMorningNote ?? '',
          contractPlan: data.settings.contractPlan ?? '',
          adminOwner: data.settings.adminOwner ?? '',
        })
        setWorkloadSettings({
          lightMax: String(data.settings.workload?.lightMax ?? '4'),
          mediumMax: String(data.settings.workload?.mediumMax ?? '8'),
          firstVisitWeight: String(data.settings.workload?.firstVisitWeight ?? '1.5'),
          inProgressWeight: String(data.settings.workload?.inProgressWeight ?? '1.2'),
          distanceWeight: String(data.settings.workload?.distanceWeight ?? '0.3'),
        })
      })
      .catch(() => {
        if (active) setToast('薬局マスタ設定の取得に失敗しました')
      })
      .finally(() => {
        if (active) setIsLoadingSettings(false)
      })

    return () => {
      active = false
    }
  }, [canViewPage, role])

  useEffect(() => {
    if (!canViewPage) return
    let active = true
    fetch('/api/pharmacy-operation-settings', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => null)
        if (!response.ok || !data?.ok) throw new Error(data?.error ?? 'operation_settings_fetch_failed')
        if (!active) return
        setCorrectionSettings({
          patientEditWindowMinutes: String(data.settings.patient_edit_window_minutes ?? DEFAULT_PATIENT_EDIT_WINDOW_MINUTES),
          billingPaidCancelWindowMinutes: String(data.settings.billing_paid_cancel_window_minutes ?? DEFAULT_BILLING_PAID_CANCEL_WINDOW_MINUTES),
          correctionReasonRequired: data.settings.correction_reason_required !== false,
        })
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [canViewPage])

  const save = async () => {
    if (guard()) return
    setFieldErrors({})
    const validationErrors = validateSettings()
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      setToast('未入力または形式が正しくない項目があります')
      setTimeout(() => setToast(null), 2500)
      return
    }
    try {
      const [masterResponse, operationResponse] = await Promise.all([
        fetch('/api/pharmacy-master-settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...settings,
            forwardingPhone: normalizePhone(settings.forwardingPhone),
            workload: {
              lightMax: Number(workloadSettings.lightMax || 4),
              mediumMax: Number(workloadSettings.mediumMax || 8),
              firstVisitWeight: Number(workloadSettings.firstVisitWeight || 1.5),
              inProgressWeight: Number(workloadSettings.inProgressWeight || 1.2),
              distanceWeight: Number(workloadSettings.distanceWeight || 0.3),
            },
          }),
        }),
        fetch('/api/pharmacy-operation-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientEditWindowMinutes: Number(correctionSettings.patientEditWindowMinutes || DEFAULT_PATIENT_EDIT_WINDOW_MINUTES),
          billingPaidCancelWindowMinutes: Number(correctionSettings.billingPaidCancelWindowMinutes || DEFAULT_BILLING_PAID_CANCEL_WINDOW_MINUTES),
          correctionReasonRequired: correctionSettings.correctionReasonRequired,
        }),
        }),
      ])
      const masterData = await masterResponse.json().catch(() => null)
      const operationData = await operationResponse.json().catch(() => null)
      if (!masterResponse.ok || !masterData?.ok) throw new Error(masterData?.error ?? 'pharmacy_settings_save_failed')
      if (!operationResponse.ok || !operationData?.ok) throw new Error(operationData?.error ?? 'operation_settings_save_failed')
      setToast('薬局設定を保存しました')
    } catch {
      setToast('薬局設定の保存に失敗しました')
    }
    setTimeout(() => setToast(null), 2500)
  }

  if (!canViewPage) {
    return (
      <div className="space-y-6 text-slate-900">
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <Shield className="h-4 w-4" />
          この画面は Pharmacy Admin または Regional Admin のみ確認できます
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-slate-900">
      {toast && (
        <div className="fixed right-4 top-20 z-50 rounded-lg bg-emerald-600/90 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">薬局設定</h1>
          <p className="mt-1 text-sm text-slate-500">自局の責任項目・夜間受託設定・所属情報を管理</p>
        </div>
        {isPharmacyAdmin && (
          <Button onClick={save} className="bg-indigo-600 text-white hover:bg-indigo-700">
            <Save className="mr-2 h-4 w-4" />
            保存
          </Button>
        )}
      </div>

      {requiresReverification && isPharmacyAdmin && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <Shield className="h-4 w-4" />
          この画面の保存には再認証が必要です。続行時はセキュリティ確認画面へ移動します。
        </div>
      )}

      {isLoadingSettings && (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          薬局マスタ設定を読み込み中です
        </div>
      )}

      {!isPharmacyAdmin && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <Shield className="h-4 w-4" />
          この画面は確認できますが、編集と保存は Pharmacy Admin のみ可能です
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-slate-900"><Building2 className="h-4 w-4 text-indigo-500" />所属・責任者情報</CardTitle>
            <CardDescription className="text-slate-500">薬局マスタDBの所属情報として保存します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-600">薬局名</Label>
              <Input value={settings.pharmacyName} disabled={!isPharmacyAdmin} onChange={(e) => setSettings((prev) => ({ ...prev, pharmacyName: e.target.value }))} className="mt-1 border-slate-200 bg-white text-slate-900" />
            </div>
            <div>
              <Label className="text-slate-600">管理責任者</Label>
              <Input value={settings.adminOwner} disabled={!isPharmacyAdmin} onChange={(e) => setSettings((prev) => ({ ...prev, adminOwner: e.target.value }))} className="mt-1 border-slate-200 bg-white text-slate-900" />
            </div>
            <div>
              <Label className="text-slate-600">契約区分</Label>
              <Input value={settings.contractPlan} disabled={!isPharmacyAdmin} onChange={(e) => setSettings((prev) => ({ ...prev, contractPlan: e.target.value }))} className="mt-1 border-slate-200 bg-white text-slate-900" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-slate-900"><Workflow className="h-4 w-4 text-emerald-500" />夜間受託設定</CardTitle>
            <CardDescription className="text-slate-500">薬局マスタDBの夜間受託設定として保存します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div>
                <p className="text-sm font-medium text-slate-900">夜間受託</p>
                <p className="text-xs text-slate-500">夜間依頼を地域運用側へ委譲</p>
              </div>
              <div className="flex items-center gap-2">
                <select value={settings.nightDelegationEnabled} disabled={!isPharmacyAdmin} onChange={(e) => setSettings((prev) => ({ ...prev, nightDelegationEnabled: e.target.value }))} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 disabled:cursor-not-allowed disabled:opacity-60">
                  <option value="on">有効</option>
                  <option value="off">無効</option>
                </select>
                <Badge variant="outline" className={settings.nightDelegationEnabled === 'on' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700' : 'border-slate-300 bg-white text-slate-500'}>
                  {settings.nightDelegationEnabled === 'on' ? '有効' : '無効'}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-slate-600">夜間受付経路</Label>
              <select value={settings.emergencyRoute} disabled={!isPharmacyAdmin} onChange={(e) => setSettings((prev) => ({ ...prev, emergencyRoute: e.target.value }))} className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 disabled:cursor-not-allowed disabled:opacity-60">
                {emergencyRouteOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-slate-600">転送先電話</Label>
              <Input value={formatPhone(settings.forwardingPhone)} disabled={!isPharmacyAdmin} onChange={(e) => setSettings((prev) => ({ ...prev, forwardingPhone: normalizePhone(e.target.value) }))} className={inputClass('forwardingPhone')} inputMode="tel" placeholder="03-1234-5678" />
              <FieldErrorText message={fieldErrors.forwardingPhone} />
            </div>
            <div>
              <Label className="text-slate-600">朝の確認メモ既定文</Label>
              <Input value={settings.defaultMorningNote} disabled={!isPharmacyAdmin} onChange={(e) => setSettings((prev) => ({ ...prev, defaultMorningNote: e.target.value }))} className="mt-1 border-slate-200 bg-white text-slate-900" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-200 bg-white shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-slate-900"><Shield className="h-4 w-4 text-amber-500" />修正・ロック設定</CardTitle>
            <CardDescription className="text-slate-500">スタッフが短時間内に自己修正できる時間と、ロック後の修正依頼ルールです</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <Label className="text-slate-600">患者編集の自己修正時間（分）</Label>
              <Input type="number" min={1} max={1440} value={correctionSettings.patientEditWindowMinutes} disabled={!isPharmacyAdmin} onChange={(e) => setCorrectionSettings((prev) => ({ ...prev, patientEditWindowMinutes: normalizeInteger(e.target.value) }))} className={inputClass('patientEditWindowMinutes')} />
              <FieldErrorText message={fieldErrors.patientEditWindowMinutes} />
            </div>
            <div>
              <Label className="text-slate-600">入金済みキャンセル可能時間（分）</Label>
              <Input type="number" min={1} max={1440} value={correctionSettings.billingPaidCancelWindowMinutes} disabled={!isPharmacyAdmin} onChange={(e) => setCorrectionSettings((prev) => ({ ...prev, billingPaidCancelWindowMinutes: normalizeInteger(e.target.value) }))} className={inputClass('billingPaidCancelWindowMinutes')} />
              <FieldErrorText message={fieldErrors.billingPaidCancelWindowMinutes} />
            </div>
            <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <input type="checkbox" checked={correctionSettings.correctionReasonRequired} disabled={!isPharmacyAdmin} onChange={(e) => setCorrectionSettings((prev) => ({ ...prev, correctionReasonRequired: e.target.checked }))} className="h-4 w-4 rounded border-slate-300" />
              修正依頼に理由入力を求める
            </label>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-slate-900"><Gauge className="h-4 w-4 text-rose-500" />スタッフ負荷の判定</CardTitle>
            <CardDescription className="text-slate-500">薬局マスタDBに保存し、スタッフ負荷判定の基準として使います</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <Label className="text-slate-600">軽めの上限スコア</Label>
              <Input value={workloadSettings.lightMax} disabled={!isPharmacyAdmin} onChange={(e) => setWorkloadSettings((prev) => ({ ...prev, lightMax: normalizeDecimal(e.target.value) }))} className={inputClass('lightMax')} inputMode="decimal" />
              <FieldErrorText message={fieldErrors.lightMax} />
            </div>
            <div>
              <Label className="text-slate-600">中程度の上限スコア</Label>
              <Input value={workloadSettings.mediumMax} disabled={!isPharmacyAdmin} onChange={(e) => setWorkloadSettings((prev) => ({ ...prev, mediumMax: normalizeDecimal(e.target.value) }))} className={inputClass('mediumMax')} inputMode="decimal" />
              <FieldErrorText message={fieldErrors.mediumMax} />
            </div>
            <div>
              <Label className="text-slate-600">初回訪問の重み</Label>
              <Input value={workloadSettings.firstVisitWeight} disabled={!isPharmacyAdmin} onChange={(e) => setWorkloadSettings((prev) => ({ ...prev, firstVisitWeight: normalizeDecimal(e.target.value) }))} className={inputClass('firstVisitWeight')} inputMode="decimal" />
              <FieldErrorText message={fieldErrors.firstVisitWeight} />
            </div>
            <div>
              <Label className="text-slate-600">対応中件数の重み</Label>
              <Input value={workloadSettings.inProgressWeight} disabled={!isPharmacyAdmin} onChange={(e) => setWorkloadSettings((prev) => ({ ...prev, inProgressWeight: normalizeDecimal(e.target.value) }))} className={inputClass('inProgressWeight')} inputMode="decimal" />
              <FieldErrorText message={fieldErrors.inProgressWeight} />
            </div>
            <div>
              <Label className="text-slate-600">距離目安の重み</Label>
              <Input value={workloadSettings.distanceWeight} disabled={!isPharmacyAdmin} onChange={(e) => setWorkloadSettings((prev) => ({ ...prev, distanceWeight: normalizeDecimal(e.target.value) }))} className={inputClass('distanceWeight')} inputMode="decimal" />
              <FieldErrorText message={fieldErrors.distanceWeight} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-900"><PhoneCall className="h-4 w-4 text-sky-500" />運用メモ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-slate-600">
            <p>・FAX原本や夜間内部進行は pharmacy_admin には見せない前提。</p>
            <p>・自局依頼は進行サマリーのみ閲覧。</p>
            <p>・患者医療本文は自局患者に限定。</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-900"><BellRing className="h-4 w-4 text-amber-500" />関連設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-slate-600">
            <Link href="/dashboard/settings/notifications" className="block text-indigo-600 hover:text-indigo-700">通知設定を開く</Link>
            <span className="block text-slate-500">申し送りは薬局トップと患者詳細から確認</span>
            <Link href="/dashboard/requests" className="block text-indigo-600 hover:text-indigo-700">自局依頼一覧を開く</Link>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-900"><FileText className="h-4 w-4 text-violet-500" />Supabase移行メモ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-slate-600">
            <p>薬局マスタDBへ保存済み:</p>
            <p>・pharmacies.admin_owner_name / contract_plan</p>
            <p>・pharmacies.emergency_route / night_delegation_enabled</p>
            <p>・pharmacies.default_morning_note / workload_* </p>
            <p>・修正ロック設定は pharmacy_operation_settings に保存</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
