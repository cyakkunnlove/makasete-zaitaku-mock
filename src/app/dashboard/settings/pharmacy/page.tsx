'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Shield, Building2, PhoneCall, BellRing, Save, FileText, Workflow } from 'lucide-react'

export default function PharmacySettingsPage() {
  const { role } = useAuth()
  const isPharmacyAdmin = role === 'pharmacy_admin'
  const [toast, setToast] = useState<string | null>(null)
  const [settings, setSettings] = useState({
    pharmacyName: '城南みらい薬局',
    regionName: '世田谷・城南リージョン',
    emergencyRoute: 'Regional Admin 受付',
    nightDelegationEnabled: 'on',
    forwardingPhone: '03-1234-5678',
    defaultMorningNote: '夜間申し送りは pharmacy_admin が朝一確認し、必要に応じて pharmacy_staff へ共有する。',
    contractPlan: '加盟店 / 夜間受託あり',
    adminOwner: '山田 美咲',
  })

  const save = () => {
    setToast('薬局設定を保存しました（モック）')
    setTimeout(() => setToast(null), 2500)
  }

  return (
    <div className="space-y-6 text-gray-100">
      {toast && (
        <div className="fixed right-4 top-20 z-50 rounded-lg bg-emerald-600/90 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">薬局設定</h1>
          <p className="mt-1 text-sm text-gray-400">自局の責任項目・夜間受託設定・所属情報を管理</p>
        </div>
        {isPharmacyAdmin && (
          <Button onClick={save} className="bg-indigo-600 text-white hover:bg-indigo-700">
            <Save className="mr-2 h-4 w-4" />
            保存
          </Button>
        )}
      </div>

      {!isPharmacyAdmin && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          <Shield className="h-4 w-4" />
          薬局設定の編集は Pharmacy Admin のみ可能です
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-[#2a3553] bg-[#111827]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-white"><Building2 className="h-4 w-4 text-indigo-400" />所属・責任者情報</CardTitle>
            <CardDescription className="text-gray-400">Supabase 移行時は pharmacy / region / owner カラムに対応</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-300">薬局名</Label>
              <Input value={settings.pharmacyName} disabled={!isPharmacyAdmin} onChange={(e) => setSettings((prev) => ({ ...prev, pharmacyName: e.target.value }))} className="mt-1 border-[#2a3553] bg-[#0a0e1a] text-gray-100" />
            </div>
            <div>
              <Label className="text-gray-300">所属リージョン</Label>
              <Input value={settings.regionName} disabled={!isPharmacyAdmin} onChange={(e) => setSettings((prev) => ({ ...prev, regionName: e.target.value }))} className="mt-1 border-[#2a3553] bg-[#0a0e1a] text-gray-100" />
            </div>
            <div>
              <Label className="text-gray-300">管理責任者</Label>
              <Input value={settings.adminOwner} disabled={!isPharmacyAdmin} onChange={(e) => setSettings((prev) => ({ ...prev, adminOwner: e.target.value }))} className="mt-1 border-[#2a3553] bg-[#0a0e1a] text-gray-100" />
            </div>
            <div>
              <Label className="text-gray-300">契約区分</Label>
              <Input value={settings.contractPlan} disabled={!isPharmacyAdmin} onChange={(e) => setSettings((prev) => ({ ...prev, contractPlan: e.target.value }))} className="mt-1 border-[#2a3553] bg-[#0a0e1a] text-gray-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#2a3553] bg-[#111827]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-white"><Workflow className="h-4 w-4 text-emerald-400" />夜間受託設定</CardTitle>
            <CardDescription className="text-gray-400">regional_admin との接続先や受け渡しルールを管理</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-[#2a3553] bg-[#0a0e1a] p-3">
              <div>
                <p className="text-sm font-medium text-white">夜間受託</p>
                <p className="text-xs text-gray-500">夜間依頼を地域運用側へ委譲</p>
              </div>
              <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-200">
                {settings.nightDelegationEnabled === 'on' ? '有効' : '無効'}
              </Badge>
            </div>
            <div>
              <Label className="text-gray-300">夜間受付経路</Label>
              <Input value={settings.emergencyRoute} disabled={!isPharmacyAdmin} onChange={(e) => setSettings((prev) => ({ ...prev, emergencyRoute: e.target.value }))} className="mt-1 border-[#2a3553] bg-[#0a0e1a] text-gray-100" />
            </div>
            <div>
              <Label className="text-gray-300">転送先電話</Label>
              <Input value={settings.forwardingPhone} disabled={!isPharmacyAdmin} onChange={(e) => setSettings((prev) => ({ ...prev, forwardingPhone: e.target.value }))} className="mt-1 border-[#2a3553] bg-[#0a0e1a] text-gray-100" />
            </div>
            <div>
              <Label className="text-gray-300">朝の確認メモ既定文</Label>
              <Input value={settings.defaultMorningNote} disabled={!isPharmacyAdmin} onChange={(e) => setSettings((prev) => ({ ...prev, defaultMorningNote: e.target.value }))} className="mt-1 border-[#2a3553] bg-[#0a0e1a] text-gray-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-[#2a3553] bg-[#111827]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-white"><PhoneCall className="h-4 w-4 text-sky-400" />運用メモ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-gray-300">
            <p>・FAX原本や夜間内部進行は pharmacy_admin には見せない前提。</p>
            <p>・自局依頼は進行サマリーのみ閲覧。</p>
            <p>・患者医療本文は自局患者に限定。</p>
          </CardContent>
        </Card>

        <Card className="border-[#2a3553] bg-[#111827]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-white"><BellRing className="h-4 w-4 text-amber-400" />関連設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-gray-300">
            <Link href="/dashboard/settings/notifications" className="block text-indigo-300 hover:text-indigo-200">通知設定を開く</Link>
            <Link href="/dashboard/handovers" className="block text-indigo-300 hover:text-indigo-200">申し送り一覧を開く</Link>
            <Link href="/dashboard/requests" className="block text-indigo-300 hover:text-indigo-200">自局依頼一覧を開く</Link>
          </CardContent>
        </Card>

        <Card className="border-[#2a3553] bg-[#111827]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-white"><FileText className="h-4 w-4 text-violet-400" />Supabase移行メモ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-gray-300">
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
