'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Save, Settings, PhoneCall, Timer, Building2, Workflow } from 'lucide-react'

export default function RegionSettingsPage() {
  const { role } = useAuth()
  const isRegionalAdmin = role === 'regional_admin'
  const [toast, setToast] = useState<string | null>(null)
  const [settings, setSettings] = useState({
    regionName: '世田谷・城南リージョン',
    operationUnitName: '田中夜間運用ユニット',
    hotlinePhone: '03-9999-0001',
    faxRoutingPolicy: '夜間FAXは regional_admin で一次受領',
    slaTargetMinutes: '45',
    delegationRule: '加盟店からの夜間受託は原則 regional_admin へ集約',
    pendingEscalationMinutes: '15',
    handoverReminderMinutes: '30',
  })

  const save = () => {
    setToast('地域設定を保存しました（モック）')
    setTimeout(() => setToast(null), 2500)
  }

  if (!isRegionalAdmin) {
    return (
      <div className="space-y-6 text-gray-100">
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          <Shield className="h-4 w-4" />
          この画面は Regional Admin のみ確認できます
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-gray-100">
      {toast && <div className="fixed right-4 top-20 z-50 rounded-lg bg-emerald-600/90 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">地域設定</h1>
          <p className="mt-1 text-sm text-gray-400">regional_admin 向けの地域夜間運用設定</p>
        </div>
        {isRegionalAdmin && (
          <Button onClick={save} className="bg-indigo-600 text-white hover:bg-indigo-700">
            <Save className="mr-2 h-4 w-4" />保存
          </Button>
        )}
      </div>

      {!isRegionalAdmin && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          <Shield className="h-4 w-4" />地域設定の編集は Regional Admin のみ可能です
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-[#2a3553] bg-[#111827]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-white"><Settings className="h-4 w-4 text-indigo-400" />地域基本情報</CardTitle>
            <CardDescription className="text-gray-400">Supabase 移行時は regions / operation_units 相当を想定</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-300">地域名</Label>
              <Input value={settings.regionName} disabled={!isRegionalAdmin} onChange={(e) => setSettings((prev) => ({ ...prev, regionName: e.target.value }))} className="mt-1 border-[#2a3553] bg-[#0a0e1a] text-gray-100" />
            </div>
            <div>
              <Label className="text-gray-300">運用ユニット名</Label>
              <Input value={settings.operationUnitName} disabled={!isRegionalAdmin} onChange={(e) => setSettings((prev) => ({ ...prev, operationUnitName: e.target.value }))} className="mt-1 border-[#2a3553] bg-[#0a0e1a] text-gray-100" />
            </div>
            <div>
              <Label className="text-gray-300">夜間受付電話</Label>
              <Input value={settings.hotlinePhone} disabled={!isRegionalAdmin} onChange={(e) => setSettings((prev) => ({ ...prev, hotlinePhone: e.target.value }))} className="mt-1 border-[#2a3553] bg-[#0a0e1a] text-gray-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#2a3553] bg-[#111827]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-white"><Workflow className="h-4 w-4 text-emerald-400" />夜間運用ポリシー</CardTitle>
            <CardDescription className="text-gray-400">加盟店受託・FAX受領・エスカレーションの方針</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-300">FAX受領ルール</Label>
              <Input value={settings.faxRoutingPolicy} disabled={!isRegionalAdmin} onChange={(e) => setSettings((prev) => ({ ...prev, faxRoutingPolicy: e.target.value }))} className="mt-1 border-[#2a3553] bg-[#0a0e1a] text-gray-100" />
            </div>
            <div>
              <Label className="text-gray-300">受託ポリシー</Label>
              <Input value={settings.delegationRule} disabled={!isRegionalAdmin} onChange={(e) => setSettings((prev) => ({ ...prev, delegationRule: e.target.value }))} className="mt-1 border-[#2a3553] bg-[#0a0e1a] text-gray-100" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-gray-300">SLA目標（分）</Label>
                <Input value={settings.slaTargetMinutes} disabled={!isRegionalAdmin} onChange={(e) => setSettings((prev) => ({ ...prev, slaTargetMinutes: e.target.value }))} className="mt-1 border-[#2a3553] bg-[#0a0e1a] text-gray-100" />
              </div>
              <div>
                <Label className="text-gray-300">停滞案件通知（分）</Label>
                <Input value={settings.pendingEscalationMinutes} disabled={!isRegionalAdmin} onChange={(e) => setSettings((prev) => ({ ...prev, pendingEscalationMinutes: e.target.value }))} className="mt-1 border-[#2a3553] bg-[#0a0e1a] text-gray-100" />
              </div>
            </div>
            <div>
              <Label className="text-gray-300">申し送り未完了リマインド（分）</Label>
              <Input value={settings.handoverReminderMinutes} disabled={!isRegionalAdmin} onChange={(e) => setSettings((prev) => ({ ...prev, handoverReminderMinutes: e.target.value }))} className="mt-1 border-[#2a3553] bg-[#0a0e1a] text-gray-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-[#2a3553] bg-[#111827]">
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm text-white"><Building2 className="h-4 w-4 text-sky-400" />関連画面</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-xs text-gray-300">
            <Link href="/dashboard/pharmacies" className="block text-indigo-300 hover:text-indigo-200">加盟店管理を開く</Link>
            <Link href="/dashboard/assign" className="block text-indigo-300 hover:text-indigo-200">アサインを開く</Link>
            <Link href="/dashboard/notifications" className="block text-indigo-300 hover:text-indigo-200">通知ログを開く</Link>
          </CardContent>
        </Card>
        <Card className="border-[#2a3553] bg-[#111827]">
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm text-white"><PhoneCall className="h-4 w-4 text-amber-400" />運用メモ</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-xs text-gray-300">
            <p>・regional_admin は加盟店設定と夜間進行の責任者。</p>
            <p>・患者医療本文の自由閲覧は不可。</p>
            <p>・他地域の管理は不可。</p>
          </CardContent>
        </Card>
        <Card className="border-[#2a3553] bg-[#111827]">
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm text-white"><Timer className="h-4 w-4 text-violet-400" />Supabase移行メモ</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-xs text-gray-300">
            <p>想定カラム:</p>
            <p>・regions.id / name</p>
            <p>・operation_units.id / region_id / name</p>
            <p>・requests.region_id / operation_unit_id</p>
            <p>・users.region_id / operation_unit_id</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
