'use client'

import { useState } from 'react'
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
import {
  ArrowLeft,
  Building2,
  Phone,
  Printer,
  MapPin,
  CreditCard,
  Calendar,
  Clock3,
  Settings2,
} from 'lucide-react'
import {
  pharmacyData,
  billingData,
  requestData,
  statusMeta,
  type PharmacyItem,
} from '@/lib/mock-data'

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

export default function PharmacyDetailPage() {
  useAuth()
  const { guard, requiresReverification } = useReauthGuard()
  const params = useParams()
  const id = params.id as string

  const pharmacy = pharmacyData.find((p) => p.id === id)
  const billings = billingData.filter((b) => b.pharmacyId === id)
  const requests = requestData.filter((r) => r.pharmacyId === id)
  const recentRequests = requests.slice(0, 5)

  const [forwardingMode, setForwardingMode] = useState<'manual_on' | 'manual_off' | 'auto'>(pharmacy?.forwarding ? 'auto' : 'manual_off')
  const [autoStart, setAutoStart] = useState('22:00')
  const [autoEnd, setAutoEnd] = useState('06:00')
  const [lastUpdatedBy, setLastUpdatedBy] = useState('薬局管理者')
  const [lastUpdatedAt, setLastUpdatedAt] = useState('2026-03-15 13:10')

  if (!pharmacy) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className="border-[#2a3553] bg-[#1a2035] text-gray-100">
          <CardHeader>
            <CardTitle className="text-base text-white">薬局が見つかりません</CardTitle>
            <CardDescription className="text-gray-400">指定されたIDの薬局は存在しません。</CardDescription>
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

  const reflectManual = (mode: 'manual_on' | 'manual_off') => {
    if (guard()) return
    setForwardingMode(mode)
    setLastUpdatedBy('薬局管理者')
    setLastUpdatedAt('2026-03-15 13:10')
  }

  const saveAutoSchedule = () => {
    if (guard()) return
    setForwardingMode('auto')
    setLastUpdatedBy('薬局管理者')
    setLastUpdatedAt('2026-03-15 13:10')
  }

  return (
    <div className="space-y-4 text-gray-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link href="/dashboard/pharmacies">
            <Button variant="ghost" size="icon" className="mt-0.5 text-gray-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold text-white">{pharmacy.name}</h1>
              <Badge variant="outline" className={cn('border text-xs', statusClass[pharmacy.status])}>{pharmacy.status}</Badge>
            </div>
            <p className="text-xs text-gray-400">{pharmacy.id} / {pharmacy.area}</p>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-[#2a3553] bg-[#1a2035]"><CardHeader className="pb-2"><CardDescription className="flex items-center gap-1.5 text-gray-400"><Building2 className="h-3.5 w-3.5" />依頼数</CardDescription><CardTitle className="text-2xl text-white">{monthlyRequestCount}件</CardTitle></CardHeader></Card>
        <Card className="border-[#2a3553] bg-[#1a2035]"><CardHeader className="pb-2"><CardDescription className="flex items-center gap-1.5 text-gray-400"><CreditCard className="h-3.5 w-3.5" />月額売上</CardDescription><CardTitle className="text-2xl text-indigo-300">{yen.format(pharmacy.saasFee + pharmacy.nightFee)}円</CardTitle></CardHeader></Card>
        <Card className="border-[#2a3553] bg-[#1a2035]"><CardHeader className="pb-2"><CardDescription className="flex items-center gap-1.5 text-gray-400"><Clock3 className="h-3.5 w-3.5" />転送運用</CardDescription><CardTitle className="text-xl text-white">{forwardingStateLabel}</CardTitle></CardHeader></Card>
      </section>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2"><CardTitle className="text-base text-white">契約情報</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2 text-gray-300"><Calendar className="h-4 w-4 text-gray-500" /><span className="text-gray-400">契約日:</span>{pharmacy.contractDate}</div>
            <div className="flex items-center gap-2 text-gray-300"><MapPin className="h-4 w-4 text-gray-500" /><span className="text-gray-400">エリア:</span>{pharmacy.area}</div>
            <div className="flex items-start gap-2 text-gray-300 sm:col-span-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" /><span className="text-gray-400">住所:</span>{pharmacy.address}</div>
            <div className="flex items-center gap-2 text-gray-300"><Phone className="h-4 w-4 text-gray-500" /><span className="text-gray-400">電話:</span>{pharmacy.phone}</div>
            <div className="flex items-center gap-2 text-gray-300"><Printer className="h-4 w-4 text-gray-500" /><span className="text-gray-400">FAX:</span>{pharmacy.fax}</div>
            <div className="flex items-center gap-2 text-gray-300"><Phone className="h-4 w-4 text-gray-500" /><span className="text-gray-400">転送先:</span>{pharmacy.forwardingPhone}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-white"><Settings2 className="h-4 w-4 text-indigo-400" />電話転送の運用設定</CardTitle>
          <CardDescription className="text-gray-400">加盟店管理者が手動反映する運用と、店舗ごとの規定時間による自動切替の両方に対応する想定です。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn('border text-xs', forwardingStateClass)}>{forwardingStateLabel}</Badge>
            <span className="text-xs text-gray-500">最終更新: {lastUpdatedAt} / {lastUpdatedBy}</span>
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
                <Button onClick={() => reflectManual('manual_on')} className="bg-emerald-600 text-white hover:bg-emerald-600/90">転送をかけた</Button>
                <Button onClick={() => reflectManual('manual_off')} className="bg-[#2a3553] text-white hover:bg-[#334166]">転送を止めた</Button>
              </div>
            </div>

            <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-4 space-y-3">
              <p className="text-sm font-medium text-white">自動切替時間</p>
              <p className="text-xs text-gray-400">各加盟店ごとに夜間の規定時間を設定し、その時間帯は自動でON/OFFが切り替わる想定です。</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label className="text-gray-300">自動ON</Label><Input type="time" value={autoStart} onChange={(e) => setAutoStart(e.target.value)} className="border-[#2a3553] bg-[#1a2035]" /></div>
                <div className="space-y-2"><Label className="text-gray-300">自動OFF</Label><Input type="time" value={autoEnd} onChange={(e) => setAutoEnd(e.target.value)} className="border-[#2a3553] bg-[#1a2035]" /></div>
              </div>
              <Button onClick={saveAutoSchedule} className="bg-indigo-600 text-white hover:bg-indigo-600/90">自動運用として保存</Button>
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
            <div className="space-y-2">{recentRequests.map((req) => (<div key={req.id} className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-3"><span className="text-xs font-mono text-gray-400">{req.id}</span><span className="text-sm text-white">{req.patientId ? '患者特定済' : '患者未特定'}</span></div><div className="flex items-center gap-2"><span className="text-xs text-gray-400">{req.receivedDate} {req.receivedAt}</span><Badge variant="outline" className={cn('border text-xs', statusMeta[req.status].className)}>{statusMeta[req.status].label}</Badge></div></div></div>))}</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
