'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { useReauthGuard } from '@/hooks/use-reauth-guard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { adminCardClass, adminPageClass, adminPanelClass } from '@/components/admin-ui'
import { ArrowLeft, Building2, CheckCircle2, Clock3, CreditCard, Settings2, Users } from 'lucide-react'
import { billingData, requestData, type PharmacyItem } from '@/lib/mock-data'

type PharmacyAdminStatus = 'uninvited' | 'invited' | 'active'
type ForwardingMode = 'manual_on' | 'manual_off' | 'auto'

type PharmacyDetailView = PharmacyItem & {
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

const statusClass: Record<PharmacyItem['status'], string> = {
  active: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
  pending: 'border-amber-500/40 bg-amber-500/20 text-amber-300',
  suspended: 'border-rose-500/40 bg-rose-500/20 text-rose-300',
}

const billingStatusClass: Record<string, string> = {
  paid: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
  unpaid: 'border-amber-500/40 bg-amber-500/20 text-amber-300',
  overdue: 'border-rose-500/40 bg-rose-500/20 text-rose-300',
}

const yen = new Intl.NumberFormat('ja-JP')

const adminStatusLabel: Record<PharmacyAdminStatus, string> = {
  uninvited: '未招待',
  invited: '招待中',
  active: '利用中',
}

const adminStatusClass: Record<PharmacyAdminStatus, string> = {
  uninvited: 'border-gray-500/40 bg-gray-500/20 text-gray-300',
  invited: 'border-amber-500/40 bg-amber-500/20 text-amber-300',
  active: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
}

function formatJst(value?: string | null) {
  if (!value) return '未設定'
  return new Date(value).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
}

export default function PharmacyDetailPage() {
  const { role } = useAuth()
  const { guard, requiresReverification } = useReauthGuard()
  const params = useParams()
  const id = params.id as string

  const [pharmacy, setPharmacy] = useState<PharmacyDetailView | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const billings = billingData.filter((b) => b.pharmacyId === id)
  const requests = requestData.filter((r) => r.pharmacyId === id)
  const recentRequests = requests.slice(0, 5)

  const [forwardingMode, setForwardingMode] = useState<ForwardingMode>('manual_off')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', address: '', phone: '', fax: '', forwardingPhone: '' })
  const [autoStart, setAutoStart] = useState('22:00')
  const [autoEnd, setAutoEnd] = useState('06:00')
  const [lastUpdatedBy, setLastUpdatedBy] = useState('未設定')
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadPharmacy = async () => {
      if (!id) return
      setIsLoading(true)
      setLoadError(null)
      try {
        const response = await fetch(`/api/pharmacies/${id}`, { cache: 'no-store' })
        const data = await response.json()
        if (!response.ok || !data.ok) throw new Error(data.error ?? 'pharmacy_fetch_failed')
        if (cancelled) return
        const nextPharmacy = data.pharmacy as PharmacyDetailView
        setPharmacy(nextPharmacy)
        setForwardingMode(nextPharmacy.forwardingMode ?? (nextPharmacy.forwarding ? 'auto' : 'manual_off'))
        setAutoStart(nextPharmacy.forwardingAutoStart ?? '22:00')
        setAutoEnd(nextPharmacy.forwardingAutoEnd ?? '06:00')
        setLastUpdatedBy(nextPharmacy.forwardingUpdatedByName ?? '未設定')
        setLastUpdatedAt(nextPharmacy.forwardingUpdatedAt ?? null)
        setEditForm({
          name: nextPharmacy.name ?? '',
          address: nextPharmacy.address ?? '',
          phone: nextPharmacy.phone ?? '',
          fax: nextPharmacy.fax ?? '',
          forwardingPhone: nextPharmacy.forwardingPhone ?? '',
        })
      } catch (error) {
        if (cancelled) return
        setLoadError(error instanceof Error ? error.message : 'pharmacy_fetch_failed')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadPharmacy()
    return () => {
      cancelled = true
    }
  }, [id])

  const onboardingChecks = useMemo(() => {
    return pharmacy?.onboarding ?? {
      checks: [],
      completed: 0,
      total: 0,
      ready: false,
      needs: [],
    }
  }, [pharmacy])

  if (role !== 'regional_admin') {
    return (
      <Card className={adminCardClass}>
        <CardHeader>
          <CardTitle className="text-base text-slate-900">加盟店詳細</CardTitle>
          <CardDescription className="text-slate-500">このページは Regional Admin のみ閲覧できます。</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (isLoading && !pharmacy) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className={adminCardClass}>
          <CardHeader>
            <CardTitle className="text-base text-slate-900">加盟店情報を読み込み中です</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!pharmacy) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className={adminCardClass}>
          <CardHeader>
            <CardTitle className="text-base text-slate-900">薬局が見つかりません</CardTitle>
            <CardDescription className="text-slate-500">指定されたIDの薬局は存在しません。</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/pharmacies">
              <Button variant="ghost" className="text-indigo-400 hover:text-indigo-300">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                加盟店一覧に戻る
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const monthlyRequestCount = requests.length
  const forwardingStateLabel = forwardingMode === 'auto' ? '自動運用' : forwardingMode === 'manual_on' ? '手動ON反映' : '手動OFF反映'
  const forwardingStateClass = forwardingMode === 'auto'
    ? 'border-indigo-500/40 bg-indigo-500/20 text-indigo-300'
    : forwardingMode === 'manual_on'
      ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
      : 'border-gray-500/40 bg-gray-500/20 text-gray-300'

  const savePharmacy = async (overrides?: Partial<{ forwardingMode: ForwardingMode; forwardingAutoStart: string; forwardingAutoEnd: string; status: 'pending' | 'active' | 'suspended' | 'terminated' }>) => {
    if (guard()) return false
    setIsSaving(true)
    setSaveError(null)
    try {
      const response = await fetch(`/api/pharmacies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          forwardingMode: overrides?.forwardingMode ?? forwardingMode,
          forwardingAutoStart: overrides?.forwardingAutoStart ?? autoStart,
          forwardingAutoEnd: overrides?.forwardingAutoEnd ?? autoEnd,
          status: overrides?.status,
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.ok) throw new Error(data.error ?? 'pharmacy_update_failed')
      const nextPharmacy = data.pharmacy as PharmacyDetailView
      setPharmacy(nextPharmacy)
      setForwardingMode(nextPharmacy.forwardingMode ?? 'manual_off')
      setAutoStart(nextPharmacy.forwardingAutoStart ?? '22:00')
      setAutoEnd(nextPharmacy.forwardingAutoEnd ?? '06:00')
      setLastUpdatedBy(nextPharmacy.forwardingUpdatedByName ?? '未設定')
      setLastUpdatedAt(nextPharmacy.forwardingUpdatedAt ?? null)
      setEditForm({
        name: nextPharmacy.name ?? '',
        address: nextPharmacy.address ?? '',
        phone: nextPharmacy.phone ?? '',
        fax: nextPharmacy.fax ?? '',
        forwardingPhone: nextPharmacy.forwardingPhone ?? '',
      })
      return true
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'pharmacy_update_failed')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const reflectManual = async (mode: 'manual_on' | 'manual_off') => {
    const saved = await savePharmacy({ forwardingMode: mode })
    if (saved) setForwardingMode(mode)
  }

  const saveAutoSchedule = async () => {
    const saved = await savePharmacy({ forwardingMode: 'auto', forwardingAutoStart: autoStart, forwardingAutoEnd: autoEnd })
    if (saved) setForwardingMode('auto')
  }

  const handleSaveBasicInfo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await savePharmacy()
  }

  return (
    <div className={`${adminPageClass} space-y-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link href="/dashboard/pharmacies">
            <Button variant="ghost" size="icon" className="mt-0.5 text-slate-400 hover:text-slate-700">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold text-slate-900">{pharmacy.name}</h1>
              <Badge variant="outline" className={cn('border text-xs', statusClass[pharmacy.status])}>{pharmacy.status}</Badge>
            </div>
            <p className="text-xs text-slate-500">{pharmacy.id}{pharmacy.regionName ? ` / ${pharmacy.regionName}` : ''}</p>
          </div>
        </div>
        <Link href={`/dashboard/staff?openInvite=1&role=pharmacy_admin&pharmacyId=${encodeURIComponent(pharmacy.id)}`}>
          <Button className="bg-indigo-500 text-white hover:bg-indigo-500/90">薬局管理者を招待</Button>
        </Link>
      </div>

      {loadError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          加盟店データの読み込みで問題がありました: {loadError}
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Card className={adminCardClass}><CardHeader className="pb-2"><CardDescription className="flex items-center gap-1.5 text-slate-500"><Users className="h-3.5 w-3.5" />アクティブ患者数</CardDescription><CardTitle className="text-2xl text-slate-900">{pharmacy.patientCount}名</CardTitle></CardHeader></Card>
        <Card className={adminCardClass}><CardHeader className="pb-2"><CardDescription className="flex items-center gap-1.5 text-slate-500"><Building2 className="h-3.5 w-3.5" />依頼数</CardDescription><CardTitle className="text-2xl text-slate-900">{monthlyRequestCount}件</CardTitle></CardHeader></Card>
        <Card className={adminCardClass}><CardHeader className="pb-2"><CardDescription className="flex items-center gap-1.5 text-slate-500"><CreditCard className="h-3.5 w-3.5" />月額売上</CardDescription><CardTitle className="text-2xl text-indigo-600">{yen.format(pharmacy.saasFee + pharmacy.nightFee)}円</CardTitle></CardHeader></Card>
        <Card className={adminCardClass}><CardHeader className="pb-2"><CardDescription className="flex items-center gap-1.5 text-slate-500"><Clock3 className="h-3.5 w-3.5" />薬局管理者</CardDescription><div className="pt-2"><Badge variant="outline" className={cn('border text-xs', adminStatusClass[pharmacy.pharmacyAdminStatus ?? 'uninvited'])}>{adminStatusLabel[pharmacy.pharmacyAdminStatus ?? 'uninvited']}</Badge></div></CardHeader></Card>
      </section>

      <Card className={adminCardClass}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-slate-900"><CheckCircle2 className="h-4 w-4 text-emerald-600" />利用開始の目安</CardTitle>
          <CardDescription className="text-slate-500">危ない自動切替はまだ入れず、まずは加盟店ごとの準備状況が見えるようにしています。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className={`${adminPanelClass} flex items-center justify-between gap-3 px-4 py-3`}>
            <div>
              <p className="text-sm font-medium text-slate-900">準備状況</p>
              <p className="text-xs text-slate-500">{onboardingChecks.completed} / {onboardingChecks.total} 項目完了</p>
            </div>
            <Badge variant="outline" className={cn('border text-xs', onboardingChecks.ready ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' : 'border-amber-500/40 bg-amber-500/20 text-amber-300')}>
              {onboardingChecks.ready ? '利用開始の目安を満たしています' : 'まだ初期設定があります'}
            </Badge>
          </div>
          {onboardingChecks.needs.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              未完了: {onboardingChecks.needs.join(' / ')}
            </div>
          )}
          <div className="flex justify-end">
            <Button
              type="button"
              disabled={isSaving || pharmacy.status === 'active' || !onboardingChecks.ready}
              onClick={() => void savePharmacy({ status: 'active' })}
              className="bg-emerald-600 text-white hover:bg-emerald-600/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pharmacy.status === 'active' ? '利用開始済み' : '利用開始にする'}
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {onboardingChecks.checks.map((item) => (
              <div key={item.label} className={`${adminPanelClass} flex items-center justify-between px-3 py-2 text-sm`}>
                <span className="text-slate-700">{item.label}</span>
                <span className={item.done ? 'text-emerald-600' : 'text-amber-600'}>{item.done ? '完了' : '未完了'}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2"><CardTitle className="text-base text-white">基本情報</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {saveError && <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">保存で問題がありました: {saveError}</div>}
          <form onSubmit={handleSaveBasicInfo} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2"><Label className="text-gray-300">薬局名</Label><Input value={editForm.name} onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))} className="border-[#2a3553] bg-[#1a2035]" /></div>
              <div className="space-y-2"><Label className="text-gray-300">リージョン</Label><div className="rounded-md border border-[#2a3553] bg-[#11182c] px-3 py-2 text-sm text-gray-300">{pharmacy.regionName || '未設定'}</div></div>
            </div>
            <div className="space-y-2"><Label className="text-gray-300">住所</Label><Input value={editForm.address} onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))} className="border-[#2a3553] bg-[#1a2035]" /></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2"><Label className="text-gray-300">電話</Label><Input value={editForm.phone} onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))} className="border-[#2a3553] bg-[#1a2035]" /></div>
              <div className="space-y-2"><Label className="text-gray-300">FAX</Label><Input value={editForm.fax} onChange={(e) => setEditForm((prev) => ({ ...prev, fax: e.target.value }))} className="border-[#2a3553] bg-[#1a2035]" /></div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2"><Label className="text-gray-300">転送先電話</Label><Input value={editForm.forwardingPhone} onChange={(e) => setEditForm((prev) => ({ ...prev, forwardingPhone: e.target.value }))} className="border-[#2a3553] bg-[#1a2035]" /></div>
              <div className="space-y-2"><Label className="text-gray-300">契約日</Label><div className="rounded-md border border-[#2a3553] bg-[#11182c] px-3 py-2 text-sm text-gray-300">{pharmacy.contractDate || '未設定'}</div></div>
            </div>
            <div className="flex justify-end"><Button type="submit" className="bg-indigo-500 text-white hover:bg-indigo-500/90" disabled={isSaving}>{isSaving ? '保存中...' : '基本情報を保存'}</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-white"><Settings2 className="h-4 w-4 text-indigo-400" />電話転送の運用設定</CardTitle>
          <CardDescription className="text-gray-400">加盟店管理者が手動反映する運用と、店舗ごとの規定時間による自動切替の両方に対応します。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn('border text-xs', forwardingStateClass)}>{forwardingStateLabel}</Badge>
            <span className="text-xs text-gray-500">最終更新: {formatJst(lastUpdatedAt)} / {lastUpdatedBy}</span>
          </div>
          {requiresReverification && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              転送設定の変更は再認証が必要です。操作するとセキュリティ確認画面へ移動します。
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-4 space-y-3">
              <p className="text-sm font-medium text-white">手動反映</p>
              <p className="text-xs text-gray-400">加盟店の管理者アカウントが、実際に転送をかけた/止めたタイミングで反映します。</p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void reflectManual('manual_on')} disabled={isSaving} className="bg-emerald-600 text-white hover:bg-emerald-600/90">転送をかけた</Button>
                <Button onClick={() => void reflectManual('manual_off')} disabled={isSaving} className="bg-[#2a3553] text-white hover:bg-[#334166]">転送を止めた</Button>
              </div>
            </div>

            <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-4 space-y-3">
              <p className="text-sm font-medium text-white">自動切替時間</p>
              <p className="text-xs text-gray-400">各加盟店ごとに夜間の規定時間を設定し、その時間帯は自動でON/OFFが切り替わる前提です。</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label className="text-gray-300">自動ON</Label><Input type="time" value={autoStart} onChange={(e) => setAutoStart(e.target.value)} className="border-[#2a3553] bg-[#1a2035]" /></div>
                <div className="space-y-2"><Label className="text-gray-300">自動OFF</Label><Input type="time" value={autoEnd} onChange={(e) => setAutoEnd(e.target.value)} className="border-[#2a3553] bg-[#1a2035]" /></div>
              </div>
              <Button onClick={() => void saveAutoSchedule()} disabled={isSaving} className="bg-indigo-600 text-white hover:bg-indigo-600/90">自動運用として保存</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2"><CardTitle className="text-base text-white">請求履歴</CardTitle></CardHeader>
        <CardContent>
          {billings.length === 0 ? <p className="py-4 text-center text-sm text-gray-400">請求データはありません</p> : (
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-[#2a3553] text-left text-xs text-gray-400"><th className="pb-2 pr-4">対象月</th><th className="pb-2 pr-4">SaaS</th><th className="pb-2 pr-4">夜間連携</th><th className="pb-2 pr-4">合計</th><th className="pb-2">状態</th></tr></thead><tbody>{billings.map((bill) => (<tr key={bill.id} className="border-b border-[#2a3553]/50"><td className="py-2.5 pr-4 text-gray-300">{bill.month}</td><td className="py-2.5 pr-4 text-gray-300">{yen.format(bill.saasFee)}円</td><td className="py-2.5 pr-4 text-gray-300">{yen.format(bill.nightFee)}円</td><td className="py-2.5 pr-4 font-medium text-white">{yen.format(bill.total)}円</td><td className="py-2.5"><Badge variant="outline" className={cn('border text-xs', billingStatusClass[bill.status])}>{bill.status}</Badge></td></tr>))}</tbody></table></div>
          )}
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2"><CardTitle className="text-base text-white">最近の依頼</CardTitle></CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? <p className="py-4 text-center text-sm text-gray-400">依頼データはありません</p> : (
            <div className="space-y-2">{recentRequests.map((request) => (<div key={request.id} className="rounded-lg border border-[#2a3553] bg-[#11182c] px-3 py-2 text-sm text-gray-300"><div className="flex items-center justify-between gap-3"><span>{request.patientName ?? '患者未特定'}</span><span className="text-xs text-gray-500">{request.receivedDate} {request.receivedAt}</span></div></div>))}</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
