'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useReauthGuard } from '@/hooks/use-reauth-guard'
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
import { Plus, Calendar, Users } from 'lucide-react'

import {
  staffData,
  shiftData,
  shiftPharmacists,
  type StaffItem,
  type ShiftEntry,
} from '@/lib/mock-data'

type StaffStatus = 'active' | 'inactive'

type RoleFilter = 'all' | 'regional_admin' | 'night_pharmacist' | 'pharmacy_admin' | 'pharmacy_staff'
type AddStaffRole = 'regional_admin' | 'night_pharmacist' | 'pharmacy_admin' | 'pharmacy_staff'

const PHARMACY_ADMIN_EMAIL_DOMAIN = '@jonan-ph.jp'
type PageTab = 'staff' | 'shift'

const roleLabel: Record<UserRole, string> = {
  system_admin: 'System Admin',
  regional_admin: 'Regional Admin',
  pharmacy_admin: 'Pharmacy Admin',
  night_pharmacist: 'Night Pharmacist',
  pharmacy_staff: 'Pharmacy Staff',
}

const roleClass: Record<UserRole, string> = {
  system_admin: 'border-violet-500/40 bg-violet-500/20 text-violet-300',
  regional_admin: 'border-indigo-500/40 bg-indigo-500/20 text-indigo-300',
  pharmacy_admin: 'border-sky-500/40 bg-sky-500/20 text-sky-300',
  night_pharmacist: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
  pharmacy_staff: 'border-amber-500/40 bg-amber-500/20 text-amber-300',
}

const statusClass: Record<StaffStatus, string> = {
  active: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
  inactive: 'border-gray-500/40 bg-gray-500/20 text-gray-300',
}

const regionalFilterItems: Array<{ key: RoleFilter; label: string }> = [
  { key: 'all', label: '全員' },
  { key: 'regional_admin', label: 'リージョン管理者' },
  { key: 'night_pharmacist', label: '夜間薬剤師' },
  { key: 'pharmacy_admin', label: '薬局管理者' },
  { key: 'pharmacy_staff', label: '薬局スタッフ' },
]

const pharmacyFilterItems: Array<{ key: RoleFilter; label: string }> = [
  { key: 'all', label: '全員' },
  { key: 'pharmacy_admin', label: 'Pharmacy Admin' },
  { key: 'pharmacy_staff', label: 'Pharmacy Staff' },
]

const weekDays = [
  { date: '2026-03-02', label: '月', full: '3/2(月)' },
  { date: '2026-03-03', label: '火', full: '3/3(火)' },
  { date: '2026-03-04', label: '水', full: '3/4(水)' },
  { date: '2026-03-05', label: '木', full: '3/5(木)' },
  { date: '2026-03-06', label: '金', full: '3/6(金)' },
  { date: '2026-03-07', label: '土', full: '3/7(土)' },
  { date: '2026-03-08', label: '日', full: '3/8(日)' },
]

export default function StaffPage() {
  const { role } = useAuth()
  const isSystemAdmin = role === 'system_admin'
  const isRegionalAdmin = role === 'regional_admin'
  const isPharmacyAdmin = role === 'pharmacy_admin'
  const { guard, requiresReverification } = useReauthGuard()
  const [pageTab, setPageTab] = useState<PageTab>('staff')

  // Staff list state
  const [staffMembers, setStaffMembers] = useState<StaffItem[]>(staffData)
  const [activeFilter, setActiveFilter] = useState<RoleFilter>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    role: 'regional_admin' as AddStaffRole,
    phone: '',
    email: '',
    status: 'active' as StaffStatus,
    regionId: '',
  })
  const [regions, setRegions] = useState<Array<{ id: string; name: string }>>([])
  const [toast, setToast] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Shift state
  const [shifts, setShifts] = useState<ShiftEntry[]>(shiftData)

  const visibleStaffMembers = useMemo(() => {
    if (isPharmacyAdmin) {
      return staffMembers.filter((member) => ['pharmacy_admin', 'pharmacy_staff'].includes(member.role) && member.email.endsWith(PHARMACY_ADMIN_EMAIL_DOMAIN))
    }
    return staffMembers
  }, [isPharmacyAdmin, staffMembers])

  const availableFilterItems = isPharmacyAdmin ? pharmacyFilterItems : regionalFilterItems

  const filteredStaff = useMemo(() => {
    if (activeFilter === 'all') return visibleStaffMembers
    return visibleStaffMembers.filter((member) => member.role === activeFilter)
  }, [activeFilter, visibleStaffMembers])

  useEffect(() => {
    if (!isSystemAdmin) return
    let cancelled = false
    fetch('/api/admin/regions', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok || !data.ok) throw new Error(data.error ?? 'regions_fetch_failed')
        if (cancelled) return
        setRegions(data.regions ?? [])
        setFormData((prev) => ({ ...prev, regionId: prev.regionId || data.regions?.[0]?.id || '' }))
      })
      .catch(() => {
        if (cancelled) return
        setRegions([])
      })
    return () => {
      cancelled = true
    }
  }, [isSystemAdmin])

  const handleAddStaff = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (guard()) return
    setErrorMessage(null)
    setIsSubmitting(true)

    if (isSystemAdmin) {
      try {
        const response = await fetch('/api/admin/regional-admins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: formData.name,
            email: formData.email,
            phone: formData.phone,
            regionId: formData.regionId,
          }),
        })
        const data = await response.json()
        if (!response.ok || !data.ok) {
          throw new Error(data.error ?? 'regional_admin_create_failed')
        }

        setToast(`リージョン管理者を作成しました: ${data.user.email}`)
        setStaffMembers((prev) => [
          {
            id: data.user.id,
            name: data.user.full_name,
            role: 'regional_admin',
            phone: formData.phone,
            email: data.user.email,
            status: 'active',
          },
          ...prev,
        ])
        setDialogOpen(false)
        setFormData({ name: '', role: 'regional_admin', phone: '', email: '', status: 'active', regionId: regions[0]?.id ?? '' })
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'regional_admin_create_failed')
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    const newStaff: StaffItem = {
      id: `ST-${Date.now()}`,
      name: formData.name,
      role: isPharmacyAdmin ? (formData.role === 'pharmacy_admin' ? 'pharmacy_admin' : 'pharmacy_staff') : formData.role,
      phone: formData.phone,
      email: formData.email,
      status: formData.status,
    }

    setStaffMembers((prev) => [newStaff, ...prev])
    setDialogOpen(false)
    setFormData({
      name: '',
      role: isRegionalAdmin ? 'night_pharmacist' : 'regional_admin',
      phone: '',
      email: '',
      status: 'active',
      regionId: regions[0]?.id ?? '',
    })
    setIsSubmitting(false)
  }

  const toggleShiftType = (shiftId: string) => {
    setShifts((prev) =>
      prev.map((s) =>
        s.id === shiftId
          ? { ...s, shiftType: s.shiftType === 'primary' ? 'backup' : 'primary' }
          : s
      )
    )
  }

  const getShiftForCell = (pharmacistId: string, date: string) => {
    return shifts.find((s) => s.pharmacistId === pharmacistId && s.shiftDate === date)
  }

  if (!isSystemAdmin && !isRegionalAdmin && !isPharmacyAdmin) {
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
          <h1 className="text-lg font-semibold text-white">{isSystemAdmin ? '管理者アカウント管理' : isRegionalAdmin ? '夜間スタッフ管理' : '自店スタッフ管理'}</h1>
          <p className="text-xs text-gray-400">{isSystemAdmin ? 'リージョン管理者の作成と招待前準備を行います' : isRegionalAdmin ? '夜間対応スタッフの情報とシフトを管理' : '自店スタッフの作成・停止・連絡先を管理'}</p>
        </div>

        {pageTab === 'staff' && (
          <Button
            onClick={() => {
              if (guard()) return
              setDialogOpen(true)
            }}
            className="bg-indigo-500 text-white hover:bg-indigo-500/90"
          >
            <Plus className="h-4 w-4" />
            スタッフ追加
          </Button>
        )}
      </div>

      {toast && (
        <Card className="border-emerald-500/30 bg-emerald-500/10">
          <CardContent className="p-4 text-sm text-emerald-200">{toast}</CardContent>
        </Card>
      )}

      {errorMessage && (
        <Card className="border-rose-500/30 bg-rose-500/10">
          <CardContent className="p-4 text-sm text-rose-200">{errorMessage}</CardContent>
        </Card>
      )}

      {requiresReverification && (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="p-4 text-sm text-amber-200">
            スタッフ追加やシフト変更などの管理操作には再認証が必要です。操作時はセキュリティ確認画面へ移動します。
          </CardContent>
        </Card>
      )}

      {/* Page-level tabs */}
      
      {isRegionalAdmin && (<Card className="border-[#2a3553] bg-[#1a2035]">
        <CardContent className="p-4">
          <Tabs value={pageTab} onValueChange={(value) => setPageTab(value as PageTab)}>
            <TabsList className="h-auto w-full justify-start gap-2 rounded-lg bg-[#11182c] p-1">
              <TabsTrigger
                value="staff"
                className="flex items-center gap-1.5 rounded-md border border-[#2a3553] bg-[#11182c] px-4 py-2 text-sm text-gray-300 data-[state=active]:border-indigo-500 data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
              >
                <Users className="h-4 w-4" />
                スタッフ一覧
              </TabsTrigger>
              <TabsTrigger
                value="shift"
                className="flex items-center gap-1.5 rounded-md border border-[#2a3553] bg-[#11182c] px-4 py-2 text-sm text-gray-300 data-[state=active]:border-indigo-500 data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
              >
                <Calendar className="h-4 w-4" />
                シフト管理
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>)}

      {/* ===== Staff List Tab ===== */}
      {(isSystemAdmin || isPharmacyAdmin || pageTab === 'staff') && (
        <>
          <Card className="border-[#2a3553] bg-[#1a2035]">
            <CardContent className="p-4">
              <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as RoleFilter)}>
                <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-lg bg-[#11182c] p-1">
                  {availableFilterItems.map((item) => (
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
        </>
      )}

      {/* ===== Shift Management Tab ===== */}
      {role === 'regional_admin' && pageTab === 'shift' && (
        <>
          <Card className="border-[#2a3553] bg-[#1a2035]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white">週間シフト</CardTitle>
              <CardDescription className="text-gray-400">
                2026-03-02 Mon ~ 2026-03-08 Sun
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-gray-500">
                セルをクリックして当番種別を切り替えられます
              </p>
            </CardContent>
          </Card>

          {/* Desktop: table grid */}
          <Card className="hidden border-[#2a3553] bg-[#1a2035] lg:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#2a3553] hover:bg-[#1a2035]">
                    <TableHead className="min-w-[120px] text-gray-400">夜間薬剤師</TableHead>
                    {weekDays.map((day) => (
                      <TableHead
                        key={day.date}
                        className={cn(
                          'min-w-[100px] text-center text-gray-400',
                          (day.label === '土' || day.label === '日') && 'text-gray-500'
                        )}
                      >
                        <div className="text-xs">{day.full}</div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shiftPharmacists.map((pharmacist) => (
                    <TableRow key={pharmacist.id} className="border-[#2a3553] hover:bg-[#11182c]">
                      <TableCell className="font-medium text-white">{pharmacist.name}</TableCell>
                      {weekDays.map((day) => {
                        const shift = getShiftForCell(pharmacist.id, day.date)
                        return (
                          <TableCell key={day.date} className="text-center">
                            {shift ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (guard()) return
                                  toggleShiftType(shift.id)
                                }}
                                className="inline-block cursor-pointer transition-opacity hover:opacity-80"
                              >
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'border text-xs',
                                    shift.shiftType === 'primary'
                                      ? 'border-indigo-500/40 bg-indigo-500/20 text-indigo-300'
                                      : 'border-gray-500/40 bg-gray-500/20 text-gray-400'
                                  )}
                                >
                                  {shift.shiftType === 'primary' ? '当番' : 'バックアップ'}
                                </Badge>
                              </button>
                            ) : (
                              <span className="text-xs text-gray-600">-</span>
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Mobile: day cards */}
          <div className="grid grid-cols-1 gap-3 lg:hidden">
            {weekDays.map((day) => {
              const dayShifts = shifts.filter((s) => s.shiftDate === day.date)
              return (
                <Card key={day.date} className="border-[#2a3553] bg-[#1a2035]">
                  <CardHeader className="pb-2">
                    <CardTitle
                      className={cn(
                        'text-sm',
                        day.label === '土' || day.label === '日' ? 'text-gray-500' : 'text-white'
                      )}
                    >
                      {day.full}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 p-4 pt-0">
                    {dayShifts.length === 0 ? (
                      <p className="text-xs text-gray-600">シフトなし</p>
                    ) : (
                      dayShifts.map((shift) => (
                        <div
                          key={shift.id}
                          className="flex items-center justify-between rounded-md border border-[#2a3553] bg-[#11182c] px-3 py-2"
                        >
                          <span className="text-sm text-gray-200">{shift.pharmacistName}</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (guard()) return
                              toggleShiftType(shift.id)
                            }}
                            className="cursor-pointer transition-opacity hover:opacity-80"
                          >
                            <Badge
                              variant="outline"
                              className={cn(
                                'border text-xs',
                                shift.shiftType === 'primary'
                                  ? 'border-indigo-500/40 bg-indigo-500/20 text-indigo-300'
                                  : 'border-gray-500/40 bg-gray-500/20 text-gray-400'
                              )}
                            >
                              {shift.shiftType === 'primary' ? '当番' : 'バックアップ'}
                            </Badge>
                          </button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* Add Staff Dialog */}
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
                  disabled={isSystemAdmin}
                >
                  <SelectTrigger className="border-[#2a3553] bg-[#1a2035]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#2a3553] bg-[#11182c] text-gray-100">
                    {isSystemAdmin && <SelectItem value="regional_admin">リージョン管理者</SelectItem>}
                    {isRegionalAdmin && <SelectItem value="night_pharmacist">夜間薬剤師</SelectItem>}
                    {!isSystemAdmin && <SelectItem value="pharmacy_admin">薬局管理者</SelectItem>}
                    {!isSystemAdmin && <SelectItem value="pharmacy_staff">薬局スタッフ</SelectItem>}
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
                  disabled={isSystemAdmin}
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

            {isSystemAdmin && (
              <div className="space-y-2">
                <Label className="text-gray-300">所属リージョン</Label>
                <Select
                  value={formData.regionId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, regionId: value }))}
                >
                  <SelectTrigger className="border-[#2a3553] bg-[#1a2035]">
                    <SelectValue placeholder="リージョンを選択" />
                  </SelectTrigger>
                  <SelectContent className="border-[#2a3553] bg-[#11182c] text-gray-100">
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={region.id}>{region.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
                キャンセル
              </Button>
              <Button type="submit" className="bg-indigo-500 text-white hover:bg-indigo-500/90" disabled={isSubmitting}>
                {isSubmitting ? '作成中...' : '追加する'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
