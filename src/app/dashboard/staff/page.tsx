'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '@/contexts/auth-context'
import type { UserRole } from '@/types/database'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'

type StaffStatus = 'active' | 'inactive'

type RoleFilter = 'all' | 'pharmacist' | 'pharmacy_admin' | 'pharmacy_staff'
type AddStaffRole = 'pharmacist' | 'pharmacy_admin' | 'pharmacy_staff'

interface StaffItem {
  id: string
  name: string
  role: UserRole
  phone: string
  email: string
  status: StaffStatus
}

const initialStaff: StaffItem[] = [
  {
    id: 'ST-01',
    name: '田中 直樹',
    role: 'admin',
    phone: '090-4400-1022',
    email: 'tanaka.n@makasete.jp',
    status: 'active',
  },
  {
    id: 'ST-02',
    name: '佐藤 健一',
    role: 'pharmacist',
    phone: '090-1122-5566',
    email: 'sato.k@makasete.jp',
    status: 'active',
  },
  {
    id: 'ST-03',
    name: '高橋 奈央',
    role: 'pharmacist',
    phone: '080-7766-1188',
    email: 'takahashi.n@makasete.jp',
    status: 'active',
  },
  {
    id: 'ST-04',
    name: '山口 美咲',
    role: 'pharmacist',
    phone: '090-8821-5544',
    email: 'yamaguchi.m@makasete.jp',
    status: 'inactive',
  },
  {
    id: 'ST-05',
    name: '山田 美咲',
    role: 'pharmacy_admin',
    phone: '090-3301-7145',
    email: 'yamada.m@jonan-ph.jp',
    status: 'active',
  },
  {
    id: 'ST-06',
    name: '小林 恒一',
    role: 'pharmacy_admin',
    phone: '080-6142-9021',
    email: 'kobayashi.k@minami-ph.jp',
    status: 'active',
  },
  {
    id: 'ST-07',
    name: '伊藤 真理',
    role: 'pharmacy_staff',
    phone: '080-2277-6631',
    email: 'ito.m@jonan-ph.jp',
    status: 'active',
  },
  {
    id: 'ST-08',
    name: '木村 恒一',
    role: 'pharmacy_staff',
    phone: '070-4377-1991',
    email: 'kimura.k@kita-ph.jp',
    status: 'inactive',
  },
  {
    id: 'ST-09',
    name: '中村 玲子',
    role: 'pharmacy_staff',
    phone: '070-6622-8900',
    email: 'nakamura.r@nishi-ph.jp',
    status: 'active',
  },
]

const roleLabel: Record<UserRole, string> = {
  admin: '管理者',
  pharmacist: '薬剤師',
  pharmacy_admin: '薬局管理者',
  pharmacy_staff: '薬局スタッフ',
}

const roleClass: Record<UserRole, string> = {
  admin: 'border-indigo-500/40 bg-indigo-500/20 text-indigo-300',
  pharmacist: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
  pharmacy_admin: 'border-sky-500/40 bg-sky-500/20 text-sky-300',
  pharmacy_staff: 'border-amber-500/40 bg-amber-500/20 text-amber-300',
}

const statusClass: Record<StaffStatus, string> = {
  active: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
  inactive: 'border-gray-500/40 bg-gray-500/20 text-gray-300',
}

const filterItems: Array<{ key: RoleFilter; label: string }> = [
  { key: 'all', label: '全員' },
  { key: 'pharmacist', label: '薬剤師' },
  { key: 'pharmacy_admin', label: '薬局管理者' },
  { key: 'pharmacy_staff', label: '薬局スタッフ' },
]

export default function StaffPage() {
  const { role } = useAuth()
  const [staffMembers, setStaffMembers] = useState<StaffItem[]>(initialStaff)
  const [activeFilter, setActiveFilter] = useState<RoleFilter>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    role: 'pharmacist' as AddStaffRole,
    phone: '',
    email: '',
    status: 'active' as StaffStatus,
  })

  const filteredStaff = useMemo(() => {
    if (activeFilter === 'all') return staffMembers
    return staffMembers.filter((member) => member.role === activeFilter)
  }, [activeFilter, staffMembers])

  const handleAddStaff = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const newStaff: StaffItem = {
      id: `ST-${Date.now()}`,
      name: formData.name,
      role: formData.role,
      phone: formData.phone,
      email: formData.email,
      status: formData.status,
    }

    setStaffMembers((prev) => [newStaff, ...prev])
    setDialogOpen(false)
    setFormData({
      name: '',
      role: 'pharmacist',
      phone: '',
      email: '',
      status: 'active',
    })
  }

  if (role !== 'admin') {
    return (
      <Card className="border-[#2a3553] bg-[#1a2035] text-gray-100">
        <CardHeader>
          <CardTitle className="text-base text-white">スタッフ管理</CardTitle>
          <CardDescription className="text-gray-400">このページは管理者のみ閲覧できます。</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4 text-gray-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-white">スタッフ管理</h1>
          <p className="text-xs text-gray-400">権限別にスタッフ情報を管理</p>
        </div>

        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-indigo-500 text-white hover:bg-indigo-500/90"
        >
          <Plus className="h-4 w-4" />
          スタッフ追加
        </Button>
      </div>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardContent className="p-4">
          <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as RoleFilter)}>
            <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-lg bg-[#11182c] p-1">
              {filterItems.map((item) => (
                <TabsTrigger
                  key={item.key}
                  value={item.key}
                  className="rounded-md border border-[#2a3553] bg-[#11182c] px-3 py-1.5 text-xs text-gray-300 data-[state=active]:border-indigo-500 data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
                >
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:hidden">
        {filteredStaff.map((member) => (
          <Card key={member.id} className="border-[#2a3553] bg-[#1a2035]">
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-base font-semibold text-white">{member.name}</p>
                <Badge variant="outline" className={cn('border text-xs', roleClass[member.role])}>
                  {roleLabel[member.role]}
                </Badge>
              </div>
              <div className="space-y-1 text-xs text-gray-300">
                <p>電話: {member.phone}</p>
                <p>メール: {member.email}</p>
              </div>
              <Badge variant="outline" className={cn('border text-xs', statusClass[member.status])}>
                {member.status === 'active' ? 'active' : 'inactive'}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="hidden border-[#2a3553] bg-[#1a2035] lg:block">
        <Table>
          <TableHeader>
            <TableRow className="border-[#2a3553] hover:bg-[#1a2035]">
              <TableHead className="text-gray-400">氏名</TableHead>
              <TableHead className="text-gray-400">役割</TableHead>
              <TableHead className="text-gray-400">電話</TableHead>
              <TableHead className="text-gray-400">メール</TableHead>
              <TableHead className="text-right text-gray-400">状態</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStaff.map((member) => (
              <TableRow key={member.id} className="border-[#2a3553] hover:bg-[#11182c]">
                <TableCell className="font-medium text-white">{member.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn('border text-xs', roleClass[member.role])}>
                    {roleLabel[member.role]}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-300">{member.phone}</TableCell>
                <TableCell className="text-gray-300">{member.email}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className={cn('border text-xs', statusClass[member.status])}>
                    {member.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-[#2a3553] bg-[#11182c] text-gray-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">スタッフを追加</DialogTitle>
            <DialogDescription className="text-gray-400">権限と連絡先を登録します。</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddStaff} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">氏名</Label>
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
                <Label className="text-gray-300">役割</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, role: value as AddStaffRole }))
                  }
                >
                  <SelectTrigger className="border-[#2a3553] bg-[#1a2035]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#2a3553] bg-[#11182c] text-gray-100">
                    <SelectItem value="pharmacist">薬剤師</SelectItem>
                    <SelectItem value="pharmacy_admin">薬局管理者</SelectItem>
                    <SelectItem value="pharmacy_staff">薬局スタッフ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">状態</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value as StaffStatus }))
                  }
                >
                  <SelectTrigger className="border-[#2a3553] bg-[#1a2035]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#2a3553] bg-[#11182c] text-gray-100">
                    <SelectItem value="active">active</SelectItem>
                    <SelectItem value="inactive">inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-300">電話</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
                required
                className="border-[#2a3553] bg-[#1a2035]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">メール</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                required
                className="border-[#2a3553] bg-[#1a2035]"
              />
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
