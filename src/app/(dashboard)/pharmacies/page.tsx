'use client'

import { useMemo, useState, type FormEvent } from 'react'
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
import { Building2, Plus, Phone, Users } from 'lucide-react'

type PharmacyStatus = 'active' | 'pending' | 'suspended'

interface PharmacyItem {
  id: string
  name: string
  area: string
  phone: string
  patientCount: number
  status: PharmacyStatus
  forwarding: boolean
}

const initialPharmacies: PharmacyItem[] = [
  {
    id: 'PH-01',
    name: '城南みらい薬局',
    area: '世田谷区',
    phone: '03-3412-2290',
    patientCount: 84,
    status: 'active',
    forwarding: true,
  },
  {
    id: 'PH-02',
    name: '港北さくら薬局',
    area: '横浜市港北区',
    phone: '045-533-1870',
    patientCount: 62,
    status: 'active',
    forwarding: true,
  },
  {
    id: 'PH-03',
    name: '中野しらさぎ薬局',
    area: '中野区',
    phone: '03-5327-2288',
    patientCount: 47,
    status: 'pending',
    forwarding: false,
  },
  {
    id: 'PH-04',
    name: '池袋みどり薬局',
    area: '豊島区',
    phone: '03-5985-6620',
    patientCount: 53,
    status: 'suspended',
    forwarding: false,
  },
  {
    id: 'PH-05',
    name: '西新宿いろは薬局',
    area: '新宿区',
    phone: '03-6279-5180',
    patientCount: 71,
    status: 'active',
    forwarding: true,
  },
]

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

export default function PharmaciesPage() {
  const { role } = useAuth()
  const [pharmacies, setPharmacies] = useState<PharmacyItem[]>(initialPharmacies)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    area: '',
    phone: '',
    patientCount: '0',
    status: 'pending' as PharmacyStatus,
  })

  const summary = useMemo(() => {
    const total = pharmacies.length
    const active = pharmacies.filter((pharmacy) => pharmacy.status === 'active').length
    const forwardingOn = pharmacies.filter((pharmacy) => pharmacy.forwarding).length

    return { total, active, forwardingOn }
  }, [pharmacies])

  const toggleForwarding = (id: string) => {
    setPharmacies((prev) =>
      prev.map((pharmacy) =>
        pharmacy.id === id ? { ...pharmacy, forwarding: !pharmacy.forwarding } : pharmacy
      )
    )
  }

  const handleAddPharmacy = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const newPharmacy: PharmacyItem = {
      id: `PH-${Date.now()}`,
      name: formData.name,
      area: formData.area,
      phone: formData.phone,
      patientCount: Number(formData.patientCount),
      status: formData.status,
      forwarding: false,
    }

    setPharmacies((prev) => [newPharmacy, ...prev])
    setDialogOpen(false)
    setFormData({
      name: '',
      area: '',
      phone: '',
      patientCount: '0',
      status: 'pending',
    })
  }

  if (role !== 'admin') {
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
          <h1 className="text-lg font-semibold text-white">加盟店管理</h1>
          <p className="text-xs text-gray-400">加盟薬局の契約状態と転送設定を管理</p>
        </div>

        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-indigo-500 text-white hover:bg-indigo-500/90"
        >
          <Plus className="h-4 w-4" />
          加盟店を追加
        </Button>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
            <CardDescription className="text-gray-400">転送設定 ON</CardDescription>
            <CardTitle className="text-2xl text-indigo-300">{summary.forwardingOn}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {pharmacies.map((pharmacy) => (
          <Card key={pharmacy.id} className="border-[#2a3553] bg-[#1a2035]">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-semibold text-white">{pharmacy.name}</p>
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

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-indigo-400" />
                  <span className="text-gray-300">転送設定</span>
                  <span className={cn('font-semibold', pharmacy.forwarding ? 'text-emerald-300' : 'text-gray-400')}>
                    {pharmacy.forwarding ? 'ON' : 'OFF'}
                  </span>
                </div>

                <Button
                  size="sm"
                  onClick={() => toggleForwarding(pharmacy.id)}
                  className={cn(
                    'text-white',
                    pharmacy.forwarding
                      ? 'bg-emerald-600 hover:bg-emerald-600/90'
                      : 'bg-[#2a3553] hover:bg-[#334166]'
                  )}
                >
                  {pharmacy.forwarding ? 'OFFにする' : 'ONにする'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-[#2a3553] bg-[#11182c] text-gray-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">加盟薬局を追加</DialogTitle>
            <DialogDescription className="text-gray-400">
              基本情報を入力して加盟店を登録します。
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddPharmacy} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">薬局名</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                required
                className="border-[#2a3553] bg-[#1a2035]"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="area" className="text-gray-300">エリア</Label>
                <Input
                  id="area"
                  value={formData.area}
                  onChange={(event) => setFormData((prev) => ({ ...prev, area: event.target.value }))}
                  required
                  className="border-[#2a3553] bg-[#1a2035]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-300">電話番号</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
                  required
                  className="border-[#2a3553] bg-[#1a2035]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="patientCount" className="text-gray-300">患者数</Label>
                <Input
                  id="patientCount"
                  type="number"
                  min={0}
                  value={formData.patientCount}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, patientCount: event.target.value }))
                  }
                  className="border-[#2a3553] bg-[#1a2035]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">ステータス</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value as PharmacyStatus }))
                  }
                >
                  <SelectTrigger className="border-[#2a3553] bg-[#1a2035]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#2a3553] bg-[#11182c] text-gray-100">
                    <SelectItem value="pending">pending</SelectItem>
                    <SelectItem value="active">active</SelectItem>
                    <SelectItem value="suspended">suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit" className="bg-indigo-500 text-white hover:bg-indigo-500/90">
                追加する
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
