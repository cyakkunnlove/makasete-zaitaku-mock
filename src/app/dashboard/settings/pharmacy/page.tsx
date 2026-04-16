'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { useReauthGuard } from '@/hooks/use-reauth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Shield, Building2, PhoneCall, BellRing, Save, FileText, Workflow, Gauge } from 'lucide-react'

const PHARMACY_WORKLOAD_SETTINGS_KEY = 'makasete-pharmacy-workload-settings'

export default function PharmacySettingsPage() {
  const { role } = useAuth()
  const { guard, requiresReverification } = useReauthGuard()
  const isPharmacyAdmin = role === 'pharmacy_admin'
  const canViewPage = role === 'pharmacy_admin' || role === 'regional_admin'
  const [toast, setToast] = useState<string | null>(null)
  const [settings, setSettings] = useState({
    pharmacyName: '城南みらい薬局',
    emergencyRoute: 'Regional Admin 受付',
    nightDelegationEnabled: 'on',
    forwardingPhone: '03-1234-5678',
    defaultMorningNote: '夜間申し送りは pharmacy_admin が朝一確認し、必要に応じて pharmacy_staff へ共有する。',
    contractPlan: '加盟店 / 夜間受託あり',
    adminOwner: '山田 美咲',
  })
  const [workloadSettings, setWorkloadSettings] = useState({
    lightMax: '4',
    mediumMax: '8',
    firstVisitWeight: '1.5',
    inProgressWeight: '1.2',
    distanceWeight: '0.3',
  })

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PHARMACY_WORKLOAD_SETTINGS_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as Partial<typeof workloadSettings>
      setWorkloadSettings((prev) => ({ ...prev, ...Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, String(value)])) }))
    } catch {}
  }, [])

  const save = () => {
    if (guard()) return
    try {
      window.localStorage.setItem(PHARMACY_WORKLOAD_SETTINGS_KEY, JSON.stringify({
        lightMax: Number(workloadSettings.lightMax || 4),
        mediumMax: Number(workloadSettings.mediumMax || 8),
        firstVisitWeight: Number(workloadSettings.firstVisitWeight || 1.5),
        inProgressWeight: Number(workloadSettings.inProgressWeight || 1.2),
        distanceWeight: Number(workloadSettings.distanceWeight || 0.3),
      }))
    } catch {}
    setToast('薬局設定を保存しました（モック）')
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
            <CardDescription className="text-slate-500">Supabase 移行時は pharmacy / owner カラムを中心に対応</CardDescription>
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
            <CardDescription className="text-slate-500">regional_admin との接続先や受け渡しルールを管理</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div>
                <p className="text-sm font-medium text-slate-900">夜間受託</p>
                <p className="text-xs text-slate-500">夜間依頼を地域運用側へ委譲</p>
              </div>
              <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-200">
                {settings.nightDelegationEnabled === 'on' ? '有効' : '無効'}
              </Badge>
            </div>
            <div>
              <Label className="text-slate-600">夜間受付経路</Label>
              <Input value={settings.emergencyRoute} disabled={!isPharmacyAdmin} onChange={(e) => setSettings((prev) => ({ ...prev, emergencyRoute: e.target.value }))} className="mt-1 border-slate-200 bg-white text-slate-900" />
            </div>
            <div>
              <Label className="text-slate-600">転送先電話</Label>
              <Input value={settings.forwardingPhone} disabled={!isPharmacyAdmin} onChange={(e) => setSettings((prev) => ({ ...prev, forwardingPhone: e.target.value }))} className="mt-1 border-slate-200 bg-white text-slate-900" />
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
            <CardTitle className="flex items-center gap-2 text-base text-slate-900"><Gauge className="h-4 w-4 text-rose-500" />スタッフ負荷の判定</CardTitle>
            <CardDescription className="text-slate-500">件数だけでなく、初回件数・対応中件数・距離目安を含めた総合負荷の基準です</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <Label className="text-slate-600">軽めの上限スコア</Label>
              <Input value={workloadSettings.lightMax} disabled={!isPharmacyAdmin} onChange={(e) => setWorkloadSettings((prev) => ({ ...prev, lightMax: e.target.value }))} className="mt-1 border-slate-200 bg-white text-slate-900" />
            </div>
            <div>
              <Label className="text-slate-600">中程度の上限スコア</Label>
              <Input value={workloadSettings.mediumMax} disabled={!isPharmacyAdmin} onChange={(e) => setWorkloadSettings((prev) => ({ ...prev, mediumMax: e.target.value }))} className="mt-1 border-slate-200 bg-white text-slate-900" />
            </div>
            <div>
              <Label className="text-slate-600">初回訪問の重み</Label>
              <Input value={workloadSettings.firstVisitWeight} disabled={!isPharmacyAdmin} onChange={(e) => setWorkloadSettings((prev) => ({ ...prev, firstVisitWeight: e.target.value }))} className="mt-1 border-slate-200 bg-white text-slate-900" />
            </div>
            <div>
              <Label className="text-slate-600">対応中件数の重み</Label>
              <Input value={workloadSettings.inProgressWeight} disabled={!isPharmacyAdmin} onChange={(e) => setWorkloadSettings((prev) => ({ ...prev, inProgressWeight: e.target.value }))} className="mt-1 border-slate-200 bg-white text-slate-900" />
            </div>
            <div>
              <Label className="text-slate-600">距離目安の重み</Label>
              <Input value={workloadSettings.distanceWeight} disabled={!isPharmacyAdmin} onChange={(e) => setWorkloadSettings((prev) => ({ ...prev, distanceWeight: e.target.value }))} className="mt-1 border-slate-200 bg-white text-slate-900" />
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
            <p>想定カラム:</p>
            <p>・pharmacies.region_id</p>
            <p>・pharmacies.night_operation_unit_id</p>
            <p>・pharmacies.night_delegation_enabled</p>
            <p>・pharmacies.default_morning_note</p>
            <p>・users.role / pharmacy_id / region_id</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
