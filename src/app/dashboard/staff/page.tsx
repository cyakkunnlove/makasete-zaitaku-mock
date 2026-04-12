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
  shiftData,
  shiftPharmacists,
  type ShiftEntry,
} from '@/lib/mock-data'

type StaffStatus = 'invited' | 'active' | 'suspended'
type ManagedStaffItem = {
  id: string
  name: string
  role: UserRole
  phone: string
  email: string
  status: StaffStatus
  regionName?: string | null
  pharmacyName?: string | null
}
type InvitationStatus = 'pending' | 'expired' | 'accepted' | 'revoked'

type RoleFilter = 'all' | 'regional_admin' | 'night_pharmacist' | 'pharmacy_admin' | 'pharmacy_staff'
type AddStaffRole = 'regional_admin' | 'night_pharmacist' | 'pharmacy_admin' | 'pharmacy_staff'

const PHARMACY_ADMIN_EMAIL_DOMAIN = '@jonan-ph.jp'
type PageTab = 'staff' | 'shift'

const roleLabel: Record<UserRole, string> = {
  system_admin: 'システム管理者',
  regional_admin: 'リージョン管理者',
  pharmacy_admin: '薬局管理者',
  night_pharmacist: '夜間薬剤師',
  pharmacy_staff: '薬局スタッフ',
}

const roleClass: Record<UserRole, string> = {
  system_admin: 'border-violet-500/40 bg-violet-500/20 text-violet-300',
  regional_admin: 'border-indigo-500/40 bg-indigo-500/20 text-indigo-300',
  pharmacy_admin: 'border-sky-500/40 bg-sky-500/20 text-sky-300',
  night_pharmacist: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
  pharmacy_staff: 'border-amber-500/40 bg-amber-500/20 text-amber-300',
}

const statusClass: Record<StaffStatus, string> = {
  invited: 'border-amber-500/40 bg-amber-500/20 text-amber-300',
  active: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
  suspended: 'border-gray-500/40 bg-gray-500/20 text-gray-300',
}

const invitationStatusClass: Record<InvitationStatus, string> = {
  pending: 'border-amber-500/40 bg-amber-500/20 text-amber-300',
  expired: 'border-gray-500/40 bg-gray-500/20 text-gray-300',
  accepted: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
  revoked: 'border-rose-500/40 bg-rose-500/20 text-rose-300',
}

const statusLabel: Record<StaffStatus, string> = {
  invited: '招待中',
  active: '利用中',
  suspended: '停止中',
}

const invitationStatusLabel: Record<InvitationStatus, string> = {
  pending: '招待中',
  expired: '期限切れ',
  accepted: '受諾済み',
  revoked: '取消済み',
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
  { key: 'pharmacy_admin', label: '薬局管理者' },
  { key: 'pharmacy_staff', label: '薬局スタッフ' },
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
  const { role, user } = useAuth()
  const isSystemAdmin = role === 'system_admin'
  const isRegionalAdmin = role === 'regional_admin'
  const isPharmacyAdmin = role === 'pharmacy_admin'
  const { guard, requiresReverification } = useReauthGuard()
  const [pageTab, setPageTab] = useState<PageTab>('staff')

  // Staff list state
  const [staffMembers, setStaffMembers] = useState<ManagedStaffItem[]>([])
  const [activeFilter, setActiveFilter] = useState<RoleFilter>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    role: 'regional_admin' as AddStaffRole,
    phone: '',
    email: '',
    status: 'invited' as StaffStatus,
    regionId: '',
    pharmacyId: '',
  })
  const [regions, setRegions] = useState<Array<{ id: string; name: string }>>([])
  const [pharmacies, setPharmacies] = useState<Array<{ id: string; name: string; region_id: string | null }>>([])
  const [toast, setToast] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [invitations, setInvitations] = useState<Array<{ id: string; email: string; role: UserRole; status: InvitationStatus; expires_at: string; last_sent_at: string | null; region_name?: string | null; pharmacy_name?: string | null }>>([])
  const [staffSearch, setStaffSearch] = useState('')
  const [invitationSearch, setInvitationSearch] = useState('')
  const [isUserListLoading, setIsUserListLoading] = useState(false)
  const [isInvitationListLoading, setIsInvitationListLoading] = useState(false)
  const [invitationActionId, setInvitationActionId] = useState<string | null>(null)
  const [userActionId, setUserActionId] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    regionId: '',
    pharmacyId: '',
  })

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
    const base = activeFilter === 'all'
      ? visibleStaffMembers
      : visibleStaffMembers.filter((member) => member.role === activeFilter)

    const query = staffSearch.trim().toLowerCase()
    if (!query) return base

    return base.filter((member) =>
      [member.name, member.email, member.phone, member.regionName ?? '', member.pharmacyName ?? '', roleLabel[member.role], statusLabel[member.status]]
        .some((value) => value.toLowerCase().includes(query)),
    )
  }, [activeFilter, staffSearch, visibleStaffMembers])

  const filteredInvitations = useMemo(() => {
    const query = invitationSearch.trim().toLowerCase()
    if (!query) return invitations

    return invitations.filter((invitation) =>
      [invitation.email, invitation.region_name ?? '', invitation.pharmacy_name ?? '', roleLabel[invitation.role], invitationStatusLabel[invitation.status]]
        .some((value) => value.toLowerCase().includes(query)),
    )
  }, [invitationSearch, invitations])

  const activeStaffCount = visibleStaffMembers.filter((member) => member.status === 'active').length
  const inactiveStaffCount = visibleStaffMembers.filter((member) => member.status === 'suspended').length
  const pendingInvitationCount = invitations.filter((invitation) => invitation.status === 'pending').length

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

  useEffect(() => {
    if (!isRegionalAdmin) return
    let cancelled = false
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json()
        const actorRegionId = data?.user?.activeRoleContext?.regionId ?? data?.user?.region_id ?? null
        if (cancelled || !actorRegionId) return
        setFormData((prev) => ({ ...prev, regionId: actorRegionId }))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [isRegionalAdmin])

  useEffect(() => {
    if (!isRegionalAdmin && !isPharmacyAdmin) return
    let cancelled = false
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json()
        const actorRegionId = data?.user?.activeRoleContext?.regionId ?? data?.user?.region_id ?? null
        if (!actorRegionId) return
        const pharmacyResponse = await fetch(`/api/pharmacies/by-region/${actorRegionId}`, { cache: 'no-store' })
        const pharmacyData = await pharmacyResponse.json()
        if (!pharmacyResponse.ok || !pharmacyData.ok) throw new Error(pharmacyData.error ?? 'pharmacies_fetch_failed')
        if (cancelled) return
        setPharmacies(pharmacyData.pharmacies ?? [])
        if (isPharmacyAdmin) {
          const actorPharmacyId = data?.user?.activeRoleContext?.pharmacyId ?? data?.user?.pharmacy_id ?? ''
          setFormData((prev) => ({ ...prev, regionId: actorRegionId, pharmacyId: actorPharmacyId || prev.pharmacyId }))
        }
      })
      .catch(() => {
        if (cancelled) return
        setPharmacies([])
      })
    return () => {
      cancelled = true
    }
  }, [isRegionalAdmin, isPharmacyAdmin])

  useEffect(() => {
    if (!isSystemAdmin && !isRegionalAdmin && !isPharmacyAdmin) return
    let cancelled = false
    setIsUserListLoading(true)
    setIsInvitationListLoading(true)

    fetch('/api/account-invitations?resource=users', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok || !data.ok) throw new Error(data.error ?? 'managed_users_list_failed')
        if (cancelled) return
        setStaffMembers(data.users ?? [])
      })
      .catch(() => {
        if (cancelled) return
        setStaffMembers([])
      })
      .finally(() => {
        if (cancelled) return
        setIsUserListLoading(false)
      })

    fetch('/api/account-invitations', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok || !data.ok) throw new Error(data.error ?? 'invitation_list_failed')
        if (cancelled) return
        setInvitations(data.invitations ?? [])
      })
      .catch(() => {
        if (cancelled) return
        setInvitations([])
      })
      .finally(() => {
        if (cancelled) return
        setIsInvitationListLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isSystemAdmin, isRegionalAdmin, isPharmacyAdmin])

  const handleAddStaff = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (guard()) return
    setErrorMessage(null)
    setIsSubmitting(true)

    if (isSystemAdmin || isRegionalAdmin || isPharmacyAdmin) {
      try {
        const response = await fetch('/api/account-invitations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: formData.name,
            email: formData.email,
            phone: formData.phone,
            regionId: formData.regionId,
            pharmacyId: formData.pharmacyId,
            targetRole: isSystemAdmin
              ? 'regional_admin'
              : isRegionalAdmin
                ? formData.role
                : 'pharmacy_staff',
          }),
        })
        const data = await response.json()
        if (!response.ok || !data.ok) {
          throw new Error(data.error ?? 'regional_admin_create_failed')
        }

        const createdRoleLabel =
          isSystemAdmin ? 'リージョン管理者' : isRegionalAdmin ? (formData.role === 'pharmacy_admin' ? '薬局管理者' : '夜間薬剤師') : '薬局スタッフ'
        setToast(
          data.invitation?.emailSent
            ? `${createdRoleLabel}を作成し、招待メールも送信しました: ${data.user.email}`
            : `${createdRoleLabel}は作成済みですが、招待メール送信は未完了です: ${data.user.email}`,
        )
        setStaffMembers((prev) => [
          {
            id: data.user.id,
            name: data.user.full_name,
            role: (isSystemAdmin
              ? 'regional_admin'
              : isRegionalAdmin
                ? formData.role
                : 'pharmacy_staff') as AddStaffRole,
            phone: formData.phone,
            email: data.user.email,
            status: 'invited',
          },
          ...prev,
        ])
        setInvitations((prev) => [
          {
            id: data.invitation.id,
            email: data.user.email,
            role: (isSystemAdmin ? 'regional_admin' : isRegionalAdmin ? formData.role : 'pharmacy_staff') as UserRole,
            status: 'pending',
            expires_at: data.invitation.expiresAt,
            last_sent_at: data.invitation.emailSent ? new Date().toISOString() : null,
          },
          ...prev,
        ])
        setDialogOpen(false)
        setFormData({
          name: '',
          role: isSystemAdmin ? 'regional_admin' : isRegionalAdmin ? 'night_pharmacist' : 'pharmacy_staff',
          phone: '',
          email: '',
          status: 'invited',
          regionId: isSystemAdmin ? (regions[0]?.id ?? '') : (user?.activeRoleContext?.regionId ?? user?.region_id ?? ''),
          pharmacyId: isPharmacyAdmin ? (user?.activeRoleContext?.pharmacyId ?? user?.pharmacy_id ?? '') : '',
        })
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'regional_admin_create_failed')
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    setIsSubmitting(false)
  }

  const openEditDialog = (member: ManagedStaffItem) => {
    setEditingMemberId(member.id)
    setEditFormData({
      name: member.name,
      phone: member.phone,
      regionId: user?.activeRoleContext?.regionId ?? user?.region_id ?? formData.regionId,
      pharmacyId: user?.activeRoleContext?.pharmacyId ?? user?.pharmacy_id ?? formData.pharmacyId,
    })
    setEditDialogOpen(true)
  }

  const handleEditStaff = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingMemberId || guard()) return
    setUserActionId(editingMemberId)
    setErrorMessage(null)
    try {
      const response = await fetch(`/api/users/${editingMemberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editFormData.name,
          phone: editFormData.phone,
          regionId: editFormData.regionId,
          pharmacyId: editFormData.pharmacyId,
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.ok) throw new Error(data.error ?? 'user_update_failed')
      setToast('アカウント情報を更新しました')
      setStaffMembers((prev) => prev.map((item) => item.id === editingMemberId ? { ...item, name: editFormData.name, phone: editFormData.phone } : item))
      setEditDialogOpen(false)
      setEditingMemberId(null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'user_update_failed')
    } finally {
      setUserActionId(null)
    }
  }

  const handleUserStatusChange = async (userId: string, nextStatus: 'active' | 'suspended') => {
    if (guard()) return
    setUserActionId(userId)
    setErrorMessage(null)
    try {
      const endpoint = nextStatus === 'active' ? `/api/users/${userId}/activate` : `/api/users/${userId}/suspend`
      const response = await fetch(endpoint, { method: 'POST' })
      const data = await response.json()
      if (!response.ok || !data.ok) throw new Error(data.error ?? 'user_status_update_failed')
      setToast(
        data.cognitoSync === 'ok'
          ? nextStatus === 'active'
            ? 'アカウントを再開しました（認証側も同期済み）'
            : 'アカウントを停止しました（認証側も同期済み）'
          : nextStatus === 'active'
            ? 'アカウントは再開しましたが、認証側の同期は未完了です'
            : 'アカウントは停止しましたが、認証側の同期は未完了です',
      )
      setStaffMembers((prev) => prev.map((item) => item.id === userId ? { ...item, status: nextStatus } : item))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'user_status_update_failed')
    } finally {
      setUserActionId(null)
    }
  }

  const handleResendInvitation = async (invitationId: string) => {
    if (guard()) return
    setInvitationActionId(invitationId)
    setErrorMessage(null)
    try {
      const response = await fetch(`/api/account-invitations/${invitationId}/resend`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok || !data.ok) throw new Error(data.error ?? 'invitation_resend_failed')
      setToast(`招待メールを再送しました: ${data.email}`)
      setInvitations((prev) => prev.map((item) => item.id === invitationId ? { ...item, status: 'pending', last_sent_at: new Date().toISOString() } : item))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'invitation_resend_failed')
    } finally {
      setInvitationActionId(null)
    }
  }

  const handleRevokeInvitation = async (invitationId: string) => {
    if (guard()) return
    setInvitationActionId(invitationId)
    setErrorMessage(null)
    try {
      const response = await fetch(`/api/account-invitations/${invitationId}/revoke`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok || !data.ok) throw new Error(data.error ?? 'invitation_revoke_failed')
      setToast('招待を取り消しました')
      setInvitations((prev) => prev.map((item) => item.id === invitationId ? { ...item, status: 'revoked' } : item))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'invitation_revoke_failed')
    } finally {
      setInvitationActionId(null)
    }
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
          <h1 className="text-lg font-semibold text-white">{isSystemAdmin ? '管理者アカウント管理' : isRegionalAdmin ? 'リージョン配下アカウント管理' : '自店スタッフ管理'}</h1>
          <p className="text-xs text-gray-400">{isSystemAdmin ? 'リージョン管理者の招待、状態変更、連絡先更新を行います' : isRegionalAdmin ? '薬局管理者と夜間薬剤師の招待、状態変更、夜間シフト管理を行います' : '自店スタッフの招待、状態変更、連絡先更新を行います'}</p>
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
            招待する
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
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Card className="border-[#2a3553] bg-[#1a2035]">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400">現在利用中</p>
                <p className="mt-1 text-2xl font-semibold text-white">{activeStaffCount}人</p>
              </CardContent>
            </Card>
            <Card className="border-[#2a3553] bg-[#1a2035]">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400">停止中</p>
                <p className="mt-1 text-2xl font-semibold text-white">{inactiveStaffCount}人</p>
              </CardContent>
            </Card>
            <Card className="border-[#2a3553] bg-[#1a2035]">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400">招待中</p>
                <p className="mt-1 text-2xl font-semibold text-white">{pendingInvitationCount}件</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-[#2a3553] bg-[#1a2035]">
            <CardContent className="space-y-3 p-4">
              <Input
                value={staffSearch}
                onChange={(event) => setStaffSearch(event.target.value)}
                placeholder="氏名、メール、電話、所属で検索"
                className="border-[#2a3553] bg-[#11182c]"
              />
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
            {isUserListLoading ? (
              <Card className="border-[#2a3553] bg-[#1a2035]">
                <CardContent className="p-4 text-sm text-gray-400">アカウント一覧を読み込み中です。</CardContent>
              </Card>
            ) : filteredStaff.length === 0 ? (
              <Card className="border-[#2a3553] bg-[#1a2035]">
                <CardContent className="p-4 text-sm text-gray-400">表示できるアカウントはまだありません。</CardContent>
              </Card>
            ) : filteredStaff.map((member) => (
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
                    {member.regionName && <p>リージョン: {member.regionName}</p>}
                    {member.pharmacyName && <p>薬局: {member.pharmacyName}</p>}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className={cn('border text-xs', statusClass[member.status])}>
                      {statusLabel[member.status]}
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-[#2a3553] bg-[#11182c] px-2 py-1 text-xs text-gray-200 hover:bg-[#24304d]"
                        disabled={userActionId === member.id}
                        onClick={() => openEditDialog(member)}
                      >
                        編集
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-[#2a3553] bg-[#11182c] px-2 py-1 text-xs text-gray-200 hover:bg-[#24304d]"
                        onClick={() => handleUserStatusChange(member.id, member.status === 'active' ? 'suspended' : 'active')}
                        disabled={userActionId === member.id || member.status === 'invited'}
                      >
                        {member.status === 'active' ? '停止' : '再開'}
                      </Button>
                    </div>
                  </div>
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
                  <TableHead className="text-gray-400">所属</TableHead>
                  <TableHead className="text-gray-400">状態</TableHead>
                  <TableHead className="text-right text-gray-400">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isUserListLoading ? (
                  <TableRow className="border-[#2a3553] hover:bg-[#1a2035]">
                    <TableCell colSpan={7} className="text-center text-sm text-gray-400">アカウント一覧を読み込み中です。</TableCell>
                  </TableRow>
                ) : filteredStaff.length === 0 ? (
                  <TableRow className="border-[#2a3553] hover:bg-[#1a2035]">
                    <TableCell colSpan={7} className="text-center text-sm text-gray-400">表示できるアカウントはまだありません。</TableCell>
                  </TableRow>
                ) : filteredStaff.map((member) => (
                  <TableRow key={member.id} className="border-[#2a3553] hover:bg-[#11182c]">
                    <TableCell className="font-medium text-white">{member.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('border text-xs', roleClass[member.role])}>
                        {roleLabel[member.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">{member.phone}</TableCell>
                    <TableCell className="text-gray-300">{member.email}</TableCell>
                    <TableCell className="text-xs text-gray-300">
                      <div className="space-y-1">
                        {member.regionName && <p>リージョン: {member.regionName}</p>}
                        {member.pharmacyName && <p>薬局: {member.pharmacyName}</p>}
                        {!member.regionName && !member.pharmacyName && <p>未設定</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('border text-xs', statusClass[member.status])}>
                        {statusLabel[member.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#24304d]"
                          disabled={userActionId === member.id}
                          onClick={() => openEditDialog(member)}
                        >
                          編集
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#24304d]"
                          disabled={userActionId === member.id || member.status === 'invited'}
                          onClick={() => handleUserStatusChange(member.id, member.status === 'active' ? 'suspended' : 'active')}
                        >
                          {member.status === 'active' ? '停止' : '再開'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card className="border-[#2a3553] bg-[#1a2035]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white">招待中アカウント</CardTitle>
              <CardDescription className="text-gray-400">未受諾の招待は再送または取消できます。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={invitationSearch}
                onChange={(event) => setInvitationSearch(event.target.value)}
                placeholder="メール、役割、所属で検索"
                className="border-[#2a3553] bg-[#11182c]"
              />
              {isInvitationListLoading ? (
                <p className="text-sm text-gray-400">招待一覧を読み込み中です。</p>
              ) : filteredInvitations.length === 0 ? (
                <p className="text-sm text-gray-400">条件に合う招待はまだありません。</p>
              ) : (
                filteredInvitations.map((invitation) => (
                  <div key={invitation.id} className="flex flex-col gap-3 rounded-lg border border-[#2a3553] bg-[#11182c] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1 text-sm text-gray-300">
                      <p className="font-medium text-white">{invitation.email}</p>
                      <p>役割: {roleLabel[invitation.role]}</p>
                      <div className="flex items-center gap-2">
                        <span>状態:</span>
                        <Badge variant="outline" className={cn('border text-xs', invitationStatusClass[invitation.status])}>
                          {invitationStatusLabel[invitation.status]}
                        </Badge>
                      </div>
                      {invitation.region_name && <p>リージョン: {invitation.region_name}</p>}
                      {invitation.pharmacy_name && <p>薬局: {invitation.pharmacy_name}</p>}
                      <p>有効期限: {new Date(invitation.expires_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</p>
                      {invitation.last_sent_at && (
                        <p>最終送信: {new Date(invitation.last_sent_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-[#2a3553] bg-[#1a2035] text-gray-200 hover:bg-[#24304d]"
                        disabled={invitationActionId === invitation.id || !['pending', 'expired'].includes(invitation.status)}
                        onClick={() => handleResendInvitation(invitation.id)}
                      >
                        再送
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
                        disabled={invitationActionId === invitation.id || invitation.status !== 'pending'}
                        onClick={() => handleRevokeInvitation(invitation.id)}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="border-[#2a3553] bg-[#11182c] text-gray-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">アカウント情報を編集</DialogTitle>
            <DialogDescription className="text-gray-400">氏名、電話、必要に応じて所属を更新します。</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditStaff} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">氏名</Label>
              <Input
                value={editFormData.name}
                onChange={(event) => setEditFormData((prev) => ({ ...prev, name: event.target.value }))}
                required
                className="border-[#2a3553] bg-[#1a2035]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">電話</Label>
              <Input
                value={editFormData.phone}
                onChange={(event) => setEditFormData((prev) => ({ ...prev, phone: event.target.value }))}
                className="border-[#2a3553] bg-[#1a2035]"
              />
            </div>

            {isSystemAdmin && (
              <div className="space-y-2">
                <Label className="text-gray-300">所属リージョン</Label>
                <Select value={editFormData.regionId} onValueChange={(value) => setEditFormData((prev) => ({ ...prev, regionId: value, pharmacyId: '' }))}>
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

            {isRegionalAdmin && (
              <div className="space-y-2">
                <Label className="text-gray-300">対象薬局</Label>
                <Select value={editFormData.pharmacyId} onValueChange={(value) => setEditFormData((prev) => ({ ...prev, pharmacyId: value }))}>
                  <SelectTrigger className="border-[#2a3553] bg-[#1a2035]">
                    <SelectValue placeholder="薬局を選択" />
                  </SelectTrigger>
                  <SelectContent className="border-[#2a3553] bg-[#11182c] text-gray-100">
                    {pharmacies.map((pharmacy) => (
                      <SelectItem key={pharmacy.id} value={pharmacy.id}>{pharmacy.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditDialogOpen(false)} disabled={Boolean(userActionId)}>
                キャンセル
              </Button>
              <Button type="submit" className="bg-indigo-500 text-white hover:bg-indigo-500/90" disabled={Boolean(userActionId)}>
                保存する
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Staff Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-[#2a3553] bg-[#11182c] text-gray-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">アカウントを招待</DialogTitle>
            <DialogDescription className="text-gray-400">氏名、役割、連絡先を登録して招待メールを送ります。</DialogDescription>
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
                    {isRegionalAdmin && <SelectItem value="pharmacy_admin">薬局管理者</SelectItem>}
                    {isPharmacyAdmin && <SelectItem value="pharmacy_staff">薬局スタッフ</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">招待後の扱い</Label>
                <div className="rounded-md border border-[#2a3553] bg-[#1a2035] px-3 py-2 text-sm text-gray-300">
                  招待メールを送信し、受諾後に利用開始します。
                </div>
              </div>
            </div>

            {isSystemAdmin && (
              <div className="space-y-2">
                <Label className="text-gray-300">所属リージョン</Label>
                <Select
                  value={formData.regionId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, regionId: value, pharmacyId: '' }))}
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

            {isRegionalAdmin && (
              <div className="space-y-2">
                <Label className="text-gray-300">対象薬局</Label>
                <Select
                  value={formData.pharmacyId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, pharmacyId: value }))}
                  disabled={false}
                >
                  <SelectTrigger className="border-[#2a3553] bg-[#1a2035]">
                    <SelectValue placeholder="薬局を選択" />
                  </SelectTrigger>
                  <SelectContent className="border-[#2a3553] bg-[#11182c] text-gray-100">
                    {pharmacies.map((pharmacy) => (
                      <SelectItem key={pharmacy.id} value={pharmacy.id}>{pharmacy.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-gray-500">薬局管理者と夜間薬剤師には対象薬局が必要です。</p>
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
