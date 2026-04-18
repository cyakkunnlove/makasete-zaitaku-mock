'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
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
import { cn } from '@/lib/utils'
import {
  AdminPageHeader,
  AdminStatCard,
  adminCardClass,
  adminDialogClass,
  adminInputClass,
  adminMutedCardClass,
  adminPageClass,
  adminPanelClass,
} from '@/components/admin-ui'
import { Building2, Plus, Phone, Users, Clock3, ShieldCheck, Settings2, AlertTriangle } from 'lucide-react'
import { pharmacyData, type PharmacyItem } from '@/lib/mock-data'
import { pharmacyStatusMeta } from '@/lib/status-meta'

type PharmacyAdminStatus = 'uninvited' | 'invited' | 'active'
type ForwardingMode = 'manual_on' | 'manual_off' | 'auto'

type PharmacyView = PharmacyItem & {
  regionId?: string | null
  regionName?: string | null
  pharmacyAdminStatus?: PharmacyAdminStatus
  forwardingMode?: ForwardingMode
  forwardingAutoStart?: string | null
  forwardingAutoEnd?: string | null
  forwardingUpdatedByName?: string | null
  forwardingUpdatedAt?: string | null
  onboarding?: {
    checks: { key: string; label: string; done: boolean }[]
    completed: number
    total: number
    ready: boolean
    needs: string[]
  }
}

const adminStatusLabel: Record<PharmacyAdminStatus, string> = {
  uninvited: '未招待',
  invited: '招待中',
  active: '利用中',
}

const adminStatusClass: Record<PharmacyAdminStatus, string> = {
  uninvited: 'border-slate-200 bg-slate-100 text-slate-700',
  invited: 'border-amber-200 bg-amber-50 text-amber-700',
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

function getForwardingSummary(pharmacy: PharmacyView) {
  const mode = pharmacy.forwardingMode ?? (pharmacy.forwarding ? 'auto' : 'manual_off')
  const autoStart = pharmacy.forwardingAutoStart ?? '22:00'
  const autoEnd = pharmacy.forwardingAutoEnd ?? '06:00'

  if (mode === 'manual_on') {
    return {
      label: '手動ON',
      detail: '薬局管理者が手動で転送開始',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    }
  }
  if (mode === 'manual_off') {
    return {
      label: '手動OFF',
      detail: '薬局管理者が手動で停止',
      className: 'border-slate-200 bg-slate-100 text-slate-700',
    }
  }
  return {
    label: '自動運用',
    detail: `${autoStart}〜${autoEnd} で自動切替`,
    className: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  }
}

export default function PharmaciesPage() {
  const { role, user } = useAuth()
  const [pharmacies, setPharmacies] = useState<PharmacyView[]>(pharmacyData)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    fax: '',
    forwardingPhone: '',
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
    const autoManaged = visiblePharmacies.filter((pharmacy) => (pharmacy.forwardingMode ?? (pharmacy.forwarding ? 'auto' : 'manual_off')) === 'auto').length
    const pending = visiblePharmacies.filter((pharmacy) => pharmacy.status === 'pending').length

    return { total, active, autoManaged, pending }
  }, [visiblePharmacies])

  useEffect(() => {
    let cancelled = false

    const loadPharmacies = async () => {
      if (role !== 'regional_admin') return
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const response = await fetch('/api/pharmacies', { cache: 'no-store' })
        const data = await response.json()
        if (!response.ok || !data.ok) throw new Error(data.error ?? 'pharmacies_fetch_failed')
        if (cancelled) return
        const rows = (data.pharmacies ?? []) as PharmacyView[]
        setPharmacies(rows)
      } catch (error) {
        if (cancelled) return
        setErrorMessage(error instanceof Error ? error.message : 'pharmacies_fetch_failed')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadPharmacies()
    return () => {
      cancelled = true
    }
  }, [role])

  const handleAddPharmacy = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)

    try {
      const response = await fetch('/api/pharmacies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          fax: formData.fax,
          forwardingPhone: formData.forwardingPhone,
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.ok) throw new Error(data.error ?? 'pharmacy_create_failed')

      const newPharmacy = data.pharmacy as PharmacyView
      setPharmacies((prev) => [newPharmacy, ...prev])
      setDialogOpen(false)
      setFormData({ name: '', address: '', phone: '', fax: '', forwardingPhone: '' })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'pharmacy_create_failed')
    }
  }

  if (role !== 'regional_admin') {
    return (
      <Card className={adminCardClass}>
        <CardHeader>
          <CardTitle className="text-base text-slate-900">加盟店管理</CardTitle>
          <CardDescription className="text-slate-600">このページは管理者のみ閲覧できます。</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className={adminPageClass}>
      <AdminPageHeader
        title={role === 'regional_admin' ? '加盟店管理' : '自店設定'}
        description={role === 'regional_admin' ? '加盟店の基本情報と受け入れ準備を管理します。' : '自店の転送運用と基本設定を確認します。'}
        actions={role === 'regional_admin' ? (
          <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 text-white hover:bg-indigo-500">
            <Plus className="h-4 w-4" />
            加盟店を追加
          </Button>
        ) : undefined}
      />

      {errorMessage && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          加盟店データの読み込みまたは保存で問題がありました: {errorMessage}
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <AdminStatCard label="総加盟店数" value={summary.total} icon={<Building2 className="h-4 w-4" />} />
        <AdminStatCard label="利用中" value={summary.active} tone="success" icon={<ShieldCheck className="h-4 w-4" />} />
        <AdminStatCard label="自動切替設定済み" value={summary.autoManaged} tone="primary" icon={<Clock3 className="h-4 w-4" />} />
        <AdminStatCard label="初期設定待ち" value={summary.pending} tone="warning" icon={<AlertTriangle className="h-4 w-4" />} />
      </section>

      <Card className={adminMutedCardClass}>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs text-slate-600">
          <div className="space-y-1">
            <p className="font-medium text-slate-900">加盟店管理の見方</p>
            <p>対象範囲: 現在のリージョン配下のみ表示します。まずは「初期設定中」の加盟店から確認すると進めやすいです。</p>
            <p>加盟店追加では基本情報だけを先に登録します。患者数や細かな運用状態は、後続の実データや設定画面で反映します。</p>
          </div>
          <Link href="/dashboard/settings/region" className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-500">
            <Settings2 className="h-3.5 w-3.5" />地域設定へ
          </Link>
        </CardContent>
      </Card>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {isLoading ? (
          <Card className={`${adminCardClass} lg:col-span-2`}>
            <CardContent className="p-6 text-sm text-slate-500">加盟店データを読み込み中です...</CardContent>
          </Card>
        ) : visiblePharmacies.length === 0 ? (
          <Card className={`${adminCardClass} lg:col-span-2`}>
            <CardContent className="p-6 text-sm text-slate-500">このリージョンにはまだ加盟店が登録されていません。右上の「加盟店を追加」から基本情報を登録すると、ここに表示されます。</CardContent>
          </Card>
        ) : visiblePharmacies.map((pharmacy) => {
          const forwarding = getForwardingSummary(pharmacy)

          return (
            <Card key={pharmacy.id} className={adminCardClass}>
              <CardContent className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <Link href={`/dashboard/pharmacies/${pharmacy.id}`} className="text-base font-semibold text-slate-900 hover:text-indigo-600">
                      {pharmacy.name}
                    </Link>
                    <p className="text-xs text-slate-500">{pharmacy.area}</p>
                  </div>
                  <StatusBadge meta={pharmacyStatusMeta[pharmacy.status]} />
                </div>

                <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <p className="flex items-center gap-1.5 text-slate-600">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {pharmacy.phone}
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-600">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    患者数 {pharmacy.patientCount}名
                  </p>
                </div>

                <div className={`${adminPanelClass} space-y-2 p-3`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Building2 className="h-4 w-4 text-indigo-500" />
                      <span>転送運用</span>
                    </div>
                    <Badge variant="outline" className={cn('border text-xs', forwarding.className)}>
                      {forwarding.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600">{forwarding.detail}</p>
                  <p className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock3 className="h-3 w-3" />
                    最終更新: {pharmacy.forwardingUpdatedAt ? new Date(pharmacy.forwardingUpdatedAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '未設定'} / {pharmacy.forwardingUpdatedByName ?? '未設定'}
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className={`${adminPanelClass} p-3 text-xs text-slate-600`}>
                    <p className="inline-flex items-center gap-1 font-medium text-slate-900"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />薬局管理者</p>
                    <div className="mt-2">
                      <Badge variant="outline" className={cn('border text-xs', adminStatusClass[pharmacy.pharmacyAdminStatus ?? 'uninvited'])}>
                        {adminStatusLabel[pharmacy.pharmacyAdminStatus ?? 'uninvited']}
                      </Badge>
                    </div>
                  </div>
                  <div className={`${adminPanelClass} p-3 text-xs text-slate-600`}>
                    <p className="inline-flex items-center gap-1 font-medium text-slate-900"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" />運用メモ</p>
                    <p className="mt-1">
                      {pharmacy.status === 'pending'
                        ? ((pharmacy.onboarding?.needs?.length ?? 0) > 0
                            ? `未完了: ${pharmacy.onboarding?.needs?.join(' / ')}`
                            : '加盟後の初期設定・受託設定確認が必要')
                        : '地域運用に接続済み。転送ルールの定期見直し対象'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={`${adminDialogClass} sm:max-w-lg`}>
          <DialogHeader>
            <DialogTitle className="text-slate-900">加盟店を追加</DialogTitle>
            <DialogDescription className="text-slate-600">まずは薬局名、住所、電話などの基本情報だけを登録します。</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddPharmacy} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700">薬局名</Label>
              <Input id="name" value={formData.name} onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))} required className={adminInputClass} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-slate-700">住所</Label>
              <Input id="address" value={formData.address} onChange={(event) => setFormData((prev) => ({ ...prev, address: event.target.value }))} required className={adminInputClass} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-700">電話番号</Label>
              <Input id="phone" value={formData.phone} onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))} required className={adminInputClass} />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fax" className="text-slate-700">FAX</Label>
                <Input id="fax" value={formData.fax} onChange={(event) => setFormData((prev) => ({ ...prev, fax: event.target.value }))} className={adminInputClass} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="forwardingPhone" className="text-slate-700">転送先電話</Label>
                <Input id="forwardingPhone" value={formData.forwardingPhone} onChange={(event) => setFormData((prev) => ({ ...prev, forwardingPhone: event.target.value }))} className={adminInputClass} />
              </div>
            </div>

            <div className={`${adminPanelClass} p-3 text-xs text-slate-600`}>
              登録時点では <span className="font-medium text-slate-900">初期設定中</span> で作成されます。患者数は患者データの有効件数から自動反映する前提です。薬局管理者の招待導線は次段で接続します。
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>キャンセル</Button>
              <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-500">追加する</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
