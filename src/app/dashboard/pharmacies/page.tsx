'use client'

import { useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Building2, Plus, Phone, Users, Clock3, ShieldCheck, Settings2, AlertTriangle } from 'lucide-react'
import { pharmacyData, type PharmacyItem, type PharmacyStatus } from '@/lib/mock-data'

type ForwardingMode = 'manual_on' | 'manual_off' | 'auto'

type ForwardingSetting = {
  mode: ForwardingMode
  autoStart: string
  autoEnd: string
  updatedBy: string
  updatedAt: string
}

const statusClass: Record<PharmacyStatus, string> = {
  active: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
  pending: 'border-amber-500/40 bg-amber-500/20 text-amber-300',
  suspended: 'border-rose-500/40 bg-rose-500/20 text-rose-300',
}

const statusLabel: Record<PharmacyStatus, string> = {
  active: 'active',
  pending: 'pending',
  suspended: 'suspended',
}

const initialForwardingSettings: Record<string, ForwardingSetting> = {
  'PH-01': { mode: 'auto', autoStart: '22:00', autoEnd: '06:00', updatedBy: '山田 美咲', updatedAt: '2026-03-05 21:40' },
  'PH-02': { mode: 'manual_on', autoStart: '22:00', autoEnd: '06:00', updatedBy: '小林 恒一', updatedAt: '2026-03-05 22:05' },
  'PH-03': { mode: 'manual_off', autoStart: '22:00', autoEnd: '06:00', updatedBy: '未設定', updatedAt: '—' },
  'PH-04': { mode: 'manual_off', autoStart: '22:00', autoEnd: '06:00', updatedBy: '未設定', updatedAt: '—' },
  'PH-05': { mode: 'auto', autoStart: '21:30', autoEnd: '06:30', updatedBy: '薬局管理者', updatedAt: '2026-03-05 20:10' },
  'PH-06': { mode: 'manual_on', autoStart: '22:00', autoEnd: '06:00', updatedBy: '薬局管理者', updatedAt: '2026-03-05 22:11' },
  'PH-07': { mode: 'auto', autoStart: '22:00', autoEnd: '06:00', updatedBy: '薬局管理者', updatedAt: '2026-03-05 21:55' },
  'PH-08': { mode: 'manual_off', autoStart: '22:00', autoEnd: '06:00', updatedBy: '薬局管理者', updatedAt: '2026-03-05 18:00' },
  'PH-09': { mode: 'auto', autoStart: '22:00', autoEnd: '06:00', updatedBy: '薬局管理者', updatedAt: '2026-03-05 21:20' },
}

function getForwardingSummary(setting: ForwardingSetting) {
  if (setting.mode === 'manual_on') {
    return {
      label: '手動ON',
      detail: `薬局管理者が手動で転送開始`,
      className: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
    }
  }
  if (setting.mode === 'manual_off') {
    return {
      label: '手動OFF',
      detail: `薬局管理者が手動で停止`,
      className: 'border-gray-500/40 bg-gray-500/20 text-gray-300',
    }
  }
  return {
    label: '自動運用',
    detail: `${setting.autoStart}〜${setting.autoEnd} で自動切替`,
    className: 'border-indigo-500/40 bg-indigo-500/20 text-indigo-300',
  }
}

export default function PharmaciesPage() {
  const { role, user } = useAuth()
  const [pharmacies, setPharmacies] = useState<PharmacyItem[]>(pharmacyData)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [forwardingSettings, setForwardingSettings] = useState<Record<string, ForwardingSetting>>(initialForwardingSettings)
  const [formData, setFormData] = useState({
    name: '',
    area: '',
    phone: '',
    patientCount: '0',
    status: 'pending' as PharmacyStatus,
  })

  const visiblePharmacies = useMemo(() => {
    if (role === 'pharmacy_admin' && user?.pharmacy_id) {
      return pharmacies.filter((pharmacy) => pharmacy.id === user.pharmacy_id)
    }
    return pharmacies
  }, [pharmacies, role, user?.pharmacy_id])

  const summary = useMemo(() => {
    const total = visiblePharmacies.length
    const active = visiblePharmacies.filter((pharmacy) => pharmacy.status === 'active').length
    const autoManaged = visiblePharmacies.filter((pharmacy) => forwardingSettings[pharmacy.id]?.mode === 'auto').length
    const pending = visiblePharmacies.filter((pharmacy) => pharmacy.status === 'pending').length

    return { total, active, autoManaged, pending }
  }, [visiblePharmacies, forwardingSettings])

  const updateForwardingMode = (id: string, mode: ForwardingMode) => {
    setForwardingSettings((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? { mode: 'manual_off', autoStart: '22:00', autoEnd: '06:00', updatedBy: '薬局管理者', updatedAt: '—' }),
        mode,
        updatedBy: '薬局管理者',
        updatedAt: '2026-03-15 13:10',
      },
    }))
  }

  const handleAddPharmacy = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const newId = `PH-${Date.now()}`
    const newPharmacy: PharmacyItem = {
      id: newId,
      name: formData.name,
      area: formData.area,
      address: '',
      phone: formData.phone,
      fax: '',
      forwardingPhone: '',
      patientCount: Number(formData.patientCount),
      status: formData.status,
      forwarding: false,
      contractDate: new Date().toISOString().slice(0, 10),
      saasFee: 30000,
      nightFee: 100000,
    }

    setPharmacies((prev) => [newPharmacy, ...prev])
    setForwardingSettings((prev) => ({
      ...prev,
      [newId]: { mode: 'manual_off', autoStart: '22:00', autoEnd: '06:00', updatedBy: '未設定', updatedAt: '—' },
    }))
    setDialogOpen(false)
    setFormData({ name: '', area: '', phone: '', patientCount: '0', status: 'pending' })
  }

  if (role !== 'regional_admin') {
    return (
      <Card className="border-[#2a3553] bg-[#1a2035] text-gray-100">
        <CardHeader>
          <CardTitle className="text-base text-white">加盟店管理</CardTitle>
          <CardDescription className="text-gray-400">このページは管理者のみ閲覧できます。</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4 text-gray-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-white">{role === 'regional_admin' ? '加盟店管理' : '自店設定'}</h1>
          <p className="text-xs text-gray-400">{role === 'regional_admin' ? '加盟薬局の契約状態と転送運用を管理' : '自店の転送運用と基本設定を確認'}</p>
        </div>

        {role === 'regional_admin' && (
          <Button onClick={() => setDialogOpen(true)} className="bg-indigo-500 text-white hover:bg-indigo-500/90">
            <Plus className="h-4 w-4" />
            加盟店を追加
          </Button>
        )}
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-400">総加盟店数</CardDescription>
            <CardTitle className="text-2xl text-white">{summary.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-400">稼働中（active）</CardDescription>
            <CardTitle className="text-2xl text-emerald-300">{summary.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-400">自動切替設定済み</CardDescription>
            <CardTitle className="text-2xl text-indigo-300">{summary.autoManaged}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-400">初期設定待ち</CardDescription>
            <CardTitle className="text-2xl text-amber-300">{summary.pending}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs text-gray-300">
          <div className="space-y-1">
            <p className="font-medium text-white">regional_admin 向け加盟店管理の考え方</p>
            <p>加盟店管理は店舗一覧ではなく、夜間受託・転送設定・受け入れ状態を整えるための運用設定画面として扱います。</p>
          </div>
          <Link href="/dashboard/settings/region" className="inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200">
            <Settings2 className="h-3.5 w-3.5" />地域設定へ
          </Link>
        </CardContent>
      </Card>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {visiblePharmacies.map((pharmacy) => {
          const setting = forwardingSettings[pharmacy.id] ?? { mode: 'manual_off', autoStart: '22:00', autoEnd: '06:00', updatedBy: '未設定', updatedAt: '—' }
          const forwarding = getForwardingSummary(setting)

          return (
            <Card key={pharmacy.id} className="border-[#2a3553] bg-[#1a2035]">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/dashboard/pharmacies/${pharmacy.id}`} className="text-base font-semibold text-white hover:text-indigo-300">
                      {pharmacy.name}
                    </Link>
                    <p className="text-xs text-gray-400">{pharmacy.area}</p>
                  </div>
                  <Badge variant="outline" className={cn('border text-xs', statusClass[pharmacy.status])}>
                    {statusLabel[pharmacy.status]}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <p className="flex items-center gap-1.5 text-gray-300">
                    <Phone className="h-3.5 w-3.5 text-gray-500" />
                    {pharmacy.phone}
                  </p>
                  <p className="flex items-center gap-1.5 text-gray-300">
                    <Users className="h-3.5 w-3.5 text-gray-500" />
                    患者数 {pharmacy.patientCount}名
                  </p>
                </div>

                <div className="space-y-2 rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-indigo-400" />
                      <span className="text-gray-300">転送運用</span>
                    </div>
                    <Badge variant="outline" className={cn('border text-xs', forwarding.className)}>
                      {forwarding.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">{forwarding.detail}</p>
                  <p className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock3 className="h-3 w-3" />
                    最終更新: {setting.updatedAt} / {setting.updatedBy}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" onClick={() => updateForwardingMode(pharmacy.id, 'manual_on')} className="bg-emerald-600 text-white hover:bg-emerald-600/90">
                      手動でON反映
                    </Button>
                    <Button size="sm" onClick={() => updateForwardingMode(pharmacy.id, 'manual_off')} className="bg-[#2a3553] text-white hover:bg-[#334166]">
                      手動でOFF反映
                    </Button>
                    <Button size="sm" onClick={() => updateForwardingMode(pharmacy.id, 'auto')} className="bg-indigo-600 text-white hover:bg-indigo-600/90">
                      自動運用に戻す
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3 text-xs text-gray-300">
                    <p className="inline-flex items-center gap-1 font-medium text-white"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />夜間受託状態</p>
                    <p className="mt-1">{pharmacy.status === 'active' ? '受け入れ可能' : '初期設定または停止中'}</p>
                  </div>
                  <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3 text-xs text-gray-300">
                    <p className="inline-flex items-center gap-1 font-medium text-white"><AlertTriangle className="h-3.5 w-3.5 text-amber-400" />運用メモ</p>
                    <p className="mt-1">{pharmacy.status === 'pending' ? '加盟後の初期設定・受託設定確認が必要' : '地域運用に接続済み。転送ルールの定期見直し対象'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-[#2a3553] bg-[#11182c] text-gray-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">加盟薬局を追加</DialogTitle>
            <DialogDescription className="text-gray-400">基本情報を入力して加盟店を登録します。</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddPharmacy} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">薬局名</Label>
              <Input id="name" value={formData.name} onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))} required className="border-[#2a3553] bg-[#1a2035]" />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="area" className="text-gray-300">エリア</Label>
                <Input id="area" value={formData.area} onChange={(event) => setFormData((prev) => ({ ...prev, area: event.target.value }))} required className="border-[#2a3553] bg-[#1a2035]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-300">電話番号</Label>
                <Input id="phone" value={formData.phone} onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))} required className="border-[#2a3553] bg-[#1a2035]" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="patientCount" className="text-gray-300">患者数</Label>
                <Input id="patientCount" type="number" min={0} value={formData.patientCount} onChange={(event) => setFormData((prev) => ({ ...prev, patientCount: event.target.value }))} className="border-[#2a3553] bg-[#1a2035]" />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">ステータス</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as PharmacyStatus }))}>
                  <SelectTrigger className="border-[#2a3553] bg-[#1a2035]"><SelectValue /></SelectTrigger>
                  <SelectContent className="border-[#2a3553] bg-[#11182c] text-gray-100">
                    <SelectItem value="pending">pending</SelectItem>
                    <SelectItem value="active">active</SelectItem>
                    <SelectItem value="suspended">suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>キャンセル</Button>
              <Button type="submit" className="bg-indigo-500 text-white hover:bg-indigo-500/90">追加する</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
