'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  Building2,
  Phone,
  Printer,
  MapPin,
  Users,
  CreditCard,
  Calendar,
  ToggleRight,
} from 'lucide-react'
import {
  pharmacyData,
  patientData,
  billingData,
  requestData,
  statusMeta,
  getAttentionFlags,
  getAttentionFlagClass,
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
  const params = useParams()
  const id = params.id as string

  const pharmacy = pharmacyData.find((p) => p.id === id)
  const patients = patientData.filter((p) => p.pharmacyId === id)
  const billings = billingData.filter((b) => b.pharmacyId === id)
  const requests = requestData.filter((r) => r.pharmacyId === id)
  const recentRequests = requests.slice(0, 5)

  const [forwarding, setForwarding] = useState(pharmacy?.forwarding ?? false)

  if (!pharmacy) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className="border-[#2a3553] bg-[#1a2035] text-gray-100">
          <CardHeader>
            <CardTitle className="text-base text-white">薬局が見つかりません</CardTitle>
            <CardDescription className="text-gray-400">
              指定されたIDの薬局は存在しません。
            </CardDescription>
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

  return (
    <div className="space-y-4 text-gray-100">
      {/* Header */}
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
              <Badge variant="outline" className={cn('border text-xs', statusClass[pharmacy.status])}>
                {pharmacy.status}
              </Badge>
            </div>
            <p className="text-xs text-gray-400">{pharmacy.id} / {pharmacy.area}</p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-gray-400">
              <Users className="h-3.5 w-3.5" />
              患者数
            </CardDescription>
            <CardTitle className="text-2xl text-white">{pharmacy.patientCount}名</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-gray-400">
              <Building2 className="h-3.5 w-3.5" />
              依頼数
            </CardDescription>
            <CardTitle className="text-2xl text-white">{monthlyRequestCount}件</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-gray-400">
              <CreditCard className="h-3.5 w-3.5" />
              月額売上
            </CardDescription>
            <CardTitle className="text-2xl text-indigo-300">
              {yen.format(pharmacy.saasFee + pharmacy.nightFee)}円
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      {/* Contract info */}
      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-white">契約情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2 text-gray-300">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-400">契約日:</span>
              {pharmacy.contractDate}
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-gray-400">エリア:</span>
              {pharmacy.area}
            </div>
            <div className="flex items-start gap-2 text-gray-300 sm:col-span-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
              <span className="text-gray-400">住所:</span>
              {pharmacy.address}
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Phone className="h-4 w-4 text-gray-500" />
              <span className="text-gray-400">電話:</span>
              {pharmacy.phone}
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Printer className="h-4 w-4 text-gray-500" />
              <span className="text-gray-400">FAX:</span>
              {pharmacy.fax}
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Phone className="h-4 w-4 text-gray-500" />
              <span className="text-gray-400">転送先:</span>
              {pharmacy.forwardingPhone}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forwarding toggle */}
      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ToggleRight className="h-5 w-5 text-indigo-400" />
              <div>
                <p className="text-sm font-medium text-white">電話転送設定</p>
                <p className="text-xs text-gray-400">
                  夜間の電話転送を{forwarding ? '受付中' : '停止中'}です
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'text-sm font-semibold',
                  forwarding ? 'text-emerald-300' : 'text-gray-400'
                )}
              >
                {forwarding ? 'ON' : 'OFF'}
              </span>
              <Switch
                checked={forwarding}
                onCheckedChange={setForwarding}
                className={cn(
                  forwarding
                    ? 'data-[state=checked]:bg-emerald-500'
                    : 'data-[state=unchecked]:bg-gray-600'
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee info */}
      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-white">料金情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
              <p className="text-xs text-gray-400">SaaS月額</p>
              <p className="text-lg font-semibold text-white">{yen.format(pharmacy.saasFee)}円</p>
            </div>
            <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
              <p className="text-xs text-gray-400">夜間連携月額</p>
              <p className="text-lg font-semibold text-white">{yen.format(pharmacy.nightFee)}円</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient list */}
      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-white">患者一覧 ({patients.length}名)</CardTitle>
        </CardHeader>
        <CardContent>
          {patients.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">登録患者はいません</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {patients.map((patient) => (
                <Link key={patient.id} href={`/dashboard/patients/${patient.id}`}>
                  <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3 transition-colors hover:border-indigo-500/40">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-white">{patient.name}</p>
                        <p className="text-xs text-gray-400">{patient.dob}</p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {getAttentionFlags(patient).slice(0, 2).map((flag) => (
                          <Badge
                            key={flag.key}
                            variant="outline"
                            className={cn('border text-[10px]', getAttentionFlagClass(flag.tone))}
                          >
                            {flag.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent billing */}
      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-white">請求履歴</CardTitle>
        </CardHeader>
        <CardContent>
          {billings.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">請求データはありません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a3553] text-left text-xs text-gray-400">
                    <th className="pb-2 pr-4">対象月</th>
                    <th className="pb-2 pr-4">SaaS</th>
                    <th className="pb-2 pr-4">夜間連携</th>
                    <th className="pb-2 pr-4">合計</th>
                    <th className="pb-2">状態</th>
                  </tr>
                </thead>
                <tbody>
                  {billings.map((bill) => (
                    <tr key={bill.id} className="border-b border-[#2a3553]/50">
                      <td className="py-2.5 pr-4 text-gray-300">{bill.month}</td>
                      <td className="py-2.5 pr-4 text-gray-300">{yen.format(bill.saasFee)}円</td>
                      <td className="py-2.5 pr-4 text-gray-300">{yen.format(bill.nightFee)}円</td>
                      <td className="py-2.5 pr-4 font-medium text-white">{yen.format(bill.total)}円</td>
                      <td className="py-2.5">
                        <Badge
                          variant="outline"
                          className={cn('border text-xs', billingStatusClass[bill.status])}
                        >
                          {bill.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent requests */}
      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-white">最近の依頼</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">依頼データはありません</p>
          ) : (
            <div className="space-y-2">
              {recentRequests.map((req) => (
                <Link key={req.id} href={`/dashboard/requests/${req.id}`}>
                  <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3 transition-colors hover:border-indigo-500/40">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-gray-400">{req.id}</span>
                        <span className="text-sm text-white">{req.patientName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {req.receivedDate} {req.receivedAt}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn('border text-xs', statusMeta[req.status].className)}
                        >
                          {statusMeta[req.status].label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
