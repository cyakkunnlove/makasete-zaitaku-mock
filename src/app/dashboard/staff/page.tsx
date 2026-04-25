'use client'

import { useCallback, useEffect, useMemo, useState, type ComponentType, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
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
import { AdminPageHeader, AdminStatCard, adminCardClass, adminDialogClass, adminInputClass, adminPageClass, adminPanelClass, adminTableClass } from '@/components/admin-ui'
import { LoadingState } from '@/components/common/LoadingState'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Plus, Calendar, Users, ChevronDown } from 'lucide-react'

import {
  shiftData,
  shiftPharmacists,
  type ShiftEntry,
  type DayTaskItem,
} from '@/lib/mock-data'
import { loadMockFallbackPatients, type RegisteredPatientRecord } from '@/lib/patient-master'
import { getScopedPharmacyId } from '@/lib/patient-permissions'
import { mergePatientSources } from '@/lib/patient-read-model'
import { isPatientInPharmacyScope } from '@/lib/patient-scope'

type StaffStatus = 'invited' | 'active' | 'suspended'
type ManagedStaffItem = {
  id: string
  name: string
  role: UserRole
  phone: string
  email: string
  status: StaffStatus
  regionId?: string | null
  pharmacyId?: string | null
  regionName?: string | null
  pharmacyName?: string | null
}
type InvitationStatus = 'pending' | 'expired' | 'accepted' | 'revoked'

type RoleFilter = 'all' | 'regional_admin' | 'night_pharmacist' | 'pharmacy_admin' | 'pharmacy_staff'
type AddStaffRole = 'regional_admin' | 'night_pharmacist' | 'pharmacy_admin' | 'pharmacy_staff'

const PHARMACY_ADMIN_EMAIL_DOMAIN = '@jonan-ph.jp'
type PageTab = 'staff' | 'shift'
type ActivityRange = '7d' | '30d'

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

type WorkloadTone = 'light' | 'medium' | 'heavy'

const PHARMACY_WORKLOAD_SETTINGS_KEY = 'makasete-pharmacy-workload-settings'

const defaultWorkloadSettings = {
  lightMax: 4,
  mediumMax: 8,
  firstVisitWeight: 1.5,
  inProgressWeight: 1.2,
  distanceWeight: 0.3,
}

function getWorkloadTone(score: number, settings: typeof defaultWorkloadSettings) {
  if (score > settings.mediumMax) return 'heavy' as const
  if (score > settings.lightMax) return 'medium' as const
  return 'light' as const
}

function getHistoryStageLabel(task: Pick<DayTaskItem, 'status' | 'flowDate'>, today: string) {
  if (task.status === 'completed') return '対応済み'
  if (task.flowDate < today) return '持ち越し'
  return '未完了'
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function shiftDateKey(baseDateKey: string, diffDays: number) {
  const date = new Date(`${baseDateKey}T00:00:00`)
  date.setDate(date.getDate() + diffDays)
  return toDateKey(date)
}

function getTodayDateKey() {
  return toDateKey(new Date())
}

const weekDays = [
  { date: '2026-03-02', label: '月', full: '3/2(月)' },
  { date: '2026-03-03', label: '火', full: '3/3(火)' },
  { date: '2026-03-04', label: '水', full: '3/4(水)' },
  { date: '2026-03-05', label: '木', full: '3/5(木)' },
  { date: '2026-03-06', label: '金', full: '3/6(金)' },
  { date: '2026-03-07', label: '土', full: '3/7(土)' },
  { date: '2026-03-08', label: '日', full: '3/8(日)' },
]

function StaffManagementCollapsibleSection({
  title,
  description,
  countLabel,
  icon: Icon,
  defaultOpen = false,
  children,
}: {
  title: string
  description?: string
  countLabel?: string
  icon: ComponentType<{ className?: string }>
  defaultOpen?: boolean
  children: ReactNode
}) {
  return (
    <details open={defaultOpen} className="group rounded-xl border border-slate-200 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:hidden">
        <span className="flex min-w-0 items-start gap-2">
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
              <span>{title}</span>
              {countLabel ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-normal text-slate-500">{countLabel}</span>
              ) : null}
            </span>
            {description ? <span className="mt-0.5 block text-xs font-normal text-slate-500">{description}</span> : null}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-slate-100 p-4">
        {children}
      </div>
    </details>
  )
}

export default function StaffPage() {
  const { role, user } = useAuth()
  const searchParams = useSearchParams()
  const isSystemAdmin = role === 'system_admin'
  const isRegionalAdmin = role === 'regional_admin'
  const isPharmacyAdmin = role === 'pharmacy_admin'
  const { guard, requiresReverification } = useReauthGuard()
  const [pageTab, setPageTab] = useState<PageTab>('staff')
  const [activityRange, setActivityRange] = useState<ActivityRange>('7d')
  const [registeredPatients, setRegisteredPatients] = useState<RegisteredPatientRecord[]>([])
  const [databasePatients, setDatabasePatients] = useState<RegisteredPatientRecord[]>([])
  const [recentDayTasks, setRecentDayTasks] = useState<DayTaskItem[]>([])
  const [isActivityLoading, setIsActivityLoading] = useState(false)
  const [workloadSettings, setWorkloadSettings] = useState(defaultWorkloadSettings)
  const [expandedActivityCardId, setExpandedActivityCardId] = useState<string | null>(null)

  // Staff list state
  const [staffMembers, setStaffMembers] = useState<ManagedStaffItem[]>([])
  const [activeFilter, setActiveFilter] = useState<RoleFilter>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [regionDialogOpen, setRegionDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    role: 'regional_admin' as AddStaffRole,
    phone: '',
    email: '',
    status: 'invited' as StaffStatus,
    regionId: '',
    regionIds: [] as string[],
    pharmacyId: '',
  })
  const [regions, setRegions] = useState<Array<{ id: string; name: string }>>([])
  const [pharmacies, setPharmacies] = useState<Array<{ id: string; name: string; region_id: string | null }>>([])
  const [toast, setToast] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCreatingRegion, setIsCreatingRegion] = useState(false)
  const [invitations, setInvitations] = useState<Array<{ id: string; email: string; role: UserRole; status: InvitationStatus; expires_at: string; last_sent_at: string | null; region_name?: string | null; pharmacy_name?: string | null }>>([])
  const [staffSearch, setStaffSearch] = useState('')
  const [invitationSearch, setInvitationSearch] = useState('')
  const [isUserListLoading, setIsUserListLoading] = useState(false)
  const [isInvitationListLoading, setIsInvitationListLoading] = useState(false)
  const [invitationActionId, setInvitationActionId] = useState<string | null>(null)
  const [userActionId, setUserActionId] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [editingMemberRole, setEditingMemberRole] = useState<UserRole | null>(null)
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false)
  const [assignmentTarget, setAssignmentTarget] = useState<ManagedStaffItem | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    regionId: '',
    pharmacyId: '',
  })
  const [newRegionName, setNewRegionName] = useState('')
  const [assignmentRegionIds, setAssignmentRegionIds] = useState<string[]>([])

  // Shift state
  const [shifts, setShifts] = useState<ShiftEntry[]>(shiftData)

  const ownPharmacyId = getScopedPharmacyId(user)

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

  const ownPatients = useMemo(() => {
    const merged = mergePatientSources({ databasePatients, registeredPatients })
    return merged.filter((patient) => isPatientInPharmacyScope(patient, ownPharmacyId))
  }, [databasePatients, registeredPatients, ownPharmacyId])

  const staffActivitySummaries = useMemo(() => {
    const days = activityRange === '30d' ? 30 : 7
    const today = getTodayDateKey()
    const startDate = shiftDateKey(today, -(days - 1))
    const patientNameMap = new Map(ownPatients.map((patient) => [patient.id, patient.name]))
    const counts = new Map<string, {
      id: string
      name: string
      role: UserRole
      pendingCount: number
      completedCount: number
      carriedOverCount: number
      firstVisitCount: number
      patientCount: number
      estimatedDistanceKm: number
      workloadScore: number
      tone: WorkloadTone
      patientStages: { patientName: string; stageLabel: string; stagePriority: number }[]
    }>()

    recentDayTasks
      .filter((task) => task.flowDate >= startDate && task.flowDate <= today)
      .forEach((task) => {
        const actorId = task.handledById ?? task.plannedById
        const actorName = task.handledBy ?? task.plannedBy
        if (!actorId || !actorName) return
        const member = visibleStaffMembers.find((item) => item.id === actorId)
        const role = member?.role ?? 'pharmacy_staff'
        const current = counts.get(actorId) ?? {
          id: actorId,
          name: actorName,
          role,
          pendingCount: 0,
          completedCount: 0,
          carriedOverCount: 0,
          firstVisitCount: 0,
          patientCount: 0,
          estimatedDistanceKm: 0,
          workloadScore: 0,
          tone: 'light' as WorkloadTone,
          patientStages: [],
        }
        if (task.status === 'completed') current.completedCount += 1
        else current.pendingCount += 1
        if (task.note.includes('初回') || task.visitType === '臨時') current.firstVisitCount += 1
        current.estimatedDistanceKm += 3

        const patientName = patientNameMap.get(task.patientId) ?? task.patientId
        const stageLabel = getHistoryStageLabel(task, today)
        if (stageLabel === '持ち越し') current.carriedOverCount += 1
        const stagePriority = stageLabel === '持ち越し' ? 3 : stageLabel === '未完了' ? 2 : 1
        const existingIndex = current.patientStages.findIndex((item) => item.patientName === patientName)
        if (existingIndex >= 0) {
          if (current.patientStages[existingIndex].stagePriority < stagePriority) {
            current.patientStages[existingIndex] = { patientName, stageLabel, stagePriority }
          }
        } else {
          current.patientStages.push({ patientName, stageLabel, stagePriority })
        }

        current.workloadScore = current.completedCount + current.pendingCount + current.carriedOverCount * workloadSettings.inProgressWeight + current.firstVisitCount * workloadSettings.firstVisitWeight + current.estimatedDistanceKm * workloadSettings.distanceWeight
        current.tone = getWorkloadTone(current.workloadScore, workloadSettings)
        counts.set(actorId, current)
      })

    return Array.from(counts.values())
      .map((item) => {
        const totalCount = item.completedCount + item.pendingCount
        const completionRate = totalCount > 0 ? Math.round((item.completedCount / totalCount) * 100) : 0
        const progressLabel = completionRate >= 80 ? '進み良好' : completionRate >= 50 ? '進行中' : '要フォロー'
        return {
          ...item,
          completionRate,
          progressLabel,
          estimatedDistanceKm: Number(item.estimatedDistanceKm.toFixed(1)),
          patientCount: item.patientStages.length,
          patientStages: item.patientStages
            .sort((a, b) => b.stagePriority - a.stagePriority || a.patientName.localeCompare(b.patientName, 'ja'))
            .slice(0, 4)
            .map(({ patientName, stageLabel }) => ({ patientName, stageLabel })),
        }
      })
      .sort((a, b) => {
        if (b.carriedOverCount !== a.carriedOverCount) return b.carriedOverCount - a.carriedOverCount
        if (b.pendingCount !== a.pendingCount) return b.pendingCount - a.pendingCount
        if (b.completedCount !== a.completedCount) return b.completedCount - a.completedCount
        if (b.firstVisitCount !== a.firstVisitCount) return b.firstVisitCount - a.firstVisitCount
        return a.name.localeCompare(b.name, 'ja')
      })
  }, [activityRange, ownPatients, recentDayTasks, visibleStaffMembers, workloadSettings])

  useEffect(() => {
    if (!isSystemAdmin) return
    let cancelled = false
    fetch('/api/admin/regions', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok || !data.ok) throw new Error(data.error ?? 'regions_fetch_failed')
        if (cancelled) return
        setRegions(data.regions ?? [])
        setFormData((prev) => ({
          ...prev,
          regionId: prev.regionId || data.regions?.[0]?.id || '',
          regionIds: prev.regionIds.length > 0 ? prev.regionIds : (data.regions?.[0]?.id ? [data.regions[0].id] : []),
        }))
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
    const syncPatients = () => setRegisteredPatients(loadMockFallbackPatients())
    syncPatients()
    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === 'makasete-patient-master:v1') syncPatients()
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PHARMACY_WORKLOAD_SETTINGS_KEY)
      if (!raw) return
      setWorkloadSettings({ ...defaultWorkloadSettings, ...JSON.parse(raw) })
    } catch {}
  }, [])

  useEffect(() => {
    if (!ownPharmacyId) return
    let cancelled = false
    fetch(`/api/patients/by-pharmacy/${ownPharmacyId}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok || !data.ok) throw new Error('patients_fetch_failed')
        if (cancelled) return
        setDatabasePatients(data.patients ?? [])
      })
      .catch(() => {
        if (cancelled) return
        setDatabasePatients([])
      })
    return () => {
      cancelled = true
    }
  }, [ownPharmacyId])

  useEffect(() => {
    if (!ownPharmacyId) return
    let cancelled = false
    const today = getTodayDateKey()
    const dateKeys = Array.from({ length: 30 }, (_, index) => shiftDateKey(today, -index)).reverse()
    const mapPersistedTask = (task: Record<string, unknown>): DayTaskItem => ({
      id: String(task.id),
      patientId: String(task.patient_id ?? ''),
      pharmacyId: String(task.pharmacy_id ?? ''),
      flowDate: String(task.flow_date),
      sortOrder: Number(task.sort_order ?? 1),
      scheduledTime: String(task.scheduled_time ?? '10:00'),
      visitType: (task.visit_type as DayTaskItem['visitType']) ?? '定期',
      source: (task.source as DayTaskItem['source']) ?? '自動生成',
      status: (task.status as DayTaskItem['status']) ?? 'scheduled',
      planningStatus: (task.planning_status as DayTaskItem['planningStatus']) ?? 'unplanned',
      plannedBy: (task.planned_by as string | null) ?? null,
      plannedById: (task.planned_by_id as string | null) ?? null,
      plannedAt: (task.planned_at as string | null) ?? null,
      handledBy: (task.handled_by as string | null) ?? null,
      handledById: (task.handled_by_id as string | null) ?? null,
      handledAt: (task.handled_at as string | null) ?? null,
      completedAt: (task.completed_at as string | null) ?? null,
      billable: Boolean(task.billable),
      collectionStatus: (task.collection_status as DayTaskItem['collectionStatus']) ?? '未着手',
      amount: Number(task.amount ?? 0),
      note: String(task.note ?? ''),
      updatedAt: (task.updated_at as string | null) ?? null,
      updatedById: (task.updated_by_id as string | null) ?? null,
    })

    async function loadRecentActivity() {
      if (!cancelled) setIsActivityLoading(true)
      try {
        const results = await Promise.all(
          dateKeys.map(async (dateKey) => {
            const response = await fetch(`/api/day-flow/${dateKey}/tasks`, { cache: 'no-store' })
            const data = await response.json().catch(() => null)
            if (!response.ok || !data?.ok || !Array.isArray(data.tasks)) return [] as DayTaskItem[]
            return data.tasks.map((task: Record<string, unknown>) => mapPersistedTask(task))
          }),
        )
        if (cancelled) return
        setRecentDayTasks(results.flat())
      } catch {
        if (cancelled) return
        setRecentDayTasks([])
      } finally {
        if (!cancelled) setIsActivityLoading(false)
      }
    }

    loadRecentActivity()
    return () => {
      cancelled = true
    }
  }, [ownPharmacyId])

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
    if (!isRegionalAdmin) return
    const shouldOpenInvite = searchParams.get('openInvite') === '1'
    const inviteRole = searchParams.get('role')
    const pharmacyId = searchParams.get('pharmacyId')
    if (!shouldOpenInvite || inviteRole !== 'pharmacy_admin' || !pharmacyId) return

    setDialogOpen(true)
    setFormData((prev) => ({
      ...prev,
      role: 'pharmacy_admin',
      pharmacyId,
    }))
  }, [isRegionalAdmin, searchParams])

  const loadAccountManagementLists = useCallback(() => {
    if (!isSystemAdmin && !isRegionalAdmin && !isPharmacyAdmin) return () => undefined

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

  useEffect(() => loadAccountManagementLists(), [loadAccountManagementLists])

  const handleAddStaff = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (guard()) return
    setErrorMessage(null)
    setIsSubmitting(true)

    if (isSystemAdmin || isRegionalAdmin || isPharmacyAdmin) {
      try {
        const endpoint = isSystemAdmin ? '/api/admin/regional-admins' : '/api/account-invitations'
        const payload = isSystemAdmin
          ? {
              fullName: formData.name,
              email: formData.email,
              phone: formData.phone,
              regionIds: formData.regionIds,
            }
          : {
              fullName: formData.name,
              email: formData.email,
              phone: formData.phone,
              regionId: formData.regionId,
              pharmacyId: formData.pharmacyId,
              targetRole: isRegionalAdmin ? formData.role : 'pharmacy_staff',
            }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
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
        loadAccountManagementLists()
        setDialogOpen(false)
        setFormData({
          name: '',
          role: isSystemAdmin ? 'regional_admin' : isRegionalAdmin ? 'night_pharmacist' : 'pharmacy_staff',
          phone: '',
          email: '',
          status: 'invited',
          regionId: isSystemAdmin ? (regions[0]?.id ?? '') : (user?.activeRoleContext?.regionId ?? user?.region_id ?? ''),
          regionIds: isSystemAdmin && regions[0]?.id ? [regions[0].id] : [],
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
    setEditingMemberRole(member.role)
    setEditFormData({
      name: member.name,
      phone: member.phone,
      regionId: member.regionId ?? user?.activeRoleContext?.regionId ?? user?.region_id ?? formData.regionId,
      pharmacyId: member.pharmacyId ?? user?.activeRoleContext?.pharmacyId ?? user?.pharmacy_id ?? formData.pharmacyId,
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
      setEditingMemberRole(null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'user_update_failed')
    } finally {
      setUserActionId(null)
    }
  }

  const handleCreateRegion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isSystemAdmin || guard()) return
    setErrorMessage(null)
    setIsCreatingRegion(true)

    try {
      const response = await fetch('/api/admin/regions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRegionName }),
      })
      const data = await response.json()
      if (!response.ok || !data.ok) throw new Error(data.error ?? 'region_create_failed')

      setRegions((prev) => [...prev, data.region])
      setFormData((prev) => ({
        ...prev,
        regionId: prev.regionId || data.region.id,
        regionIds: prev.regionIds.includes(data.region.id) ? prev.regionIds : [...prev.regionIds, data.region.id],
      }))
      setToast(`リージョンを追加しました: ${data.region.name}`)
      setRegionDialogOpen(false)
      setNewRegionName('')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'region_create_failed')
    } finally {
      setIsCreatingRegion(false)
    }
  }

  const openAssignmentDialog = (member: ManagedStaffItem) => {
    setAssignmentTarget(member)
    setAssignmentRegionIds([])
    setAssignmentDialogOpen(true)
  }

  const handleAddAssignment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!assignmentTarget || !isSystemAdmin || guard()) return
    setUserActionId(assignmentTarget.id)
    setErrorMessage(null)
    try {
      const response = await fetch(`/api/users/${assignmentTarget.id}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole: 'regional_admin', regionIds: assignmentRegionIds }),
      })
      const data = await response.json()
      if (!response.ok || !data.ok) throw new Error(data.error ?? 'role_assignment_create_failed')
      setToast(data.alreadyApplied ? '追加済みの所属でした' : '既存アカウントにリージョン管理者権限を追加しました')
      loadAccountManagementLists()
      setAssignmentDialogOpen(false)
      setAssignmentTarget(null)
      setAssignmentRegionIds([])
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'role_assignment_create_failed')
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
      loadAccountManagementLists()
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
      loadAccountManagementLists()
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
      <Card className={adminCardClass}>
        <CardHeader>
          <CardTitle className="text-base text-slate-900">スタッフ管理</CardTitle>
          <CardDescription className="text-slate-600">このページは管理者のみ閲覧できます。</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className={adminPageClass}>
      <AdminPageHeader
        title={isSystemAdmin ? '管理者アカウント管理' : isRegionalAdmin ? 'リージョン配下アカウント管理' : '自店スタッフ管理'}
        description={isSystemAdmin ? 'リージョン管理者の招待、状態変更、連絡先更新を行います。' : isRegionalAdmin ? '薬局管理者と夜間薬剤師の招待、状態変更、シフト管理を行います。' : '自店スタッフの招待、状態変更、連絡先更新を行います。'}
        actions={pageTab === 'staff' ? (
          <Button
            onClick={() => {
              if (guard()) return
              setDialogOpen(true)
            }}
            className="bg-indigo-600 text-white hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            招待する
          </Button>
        ) : undefined}
      />

      {toast && (
        <Card className="fade-in-up border-emerald-200 bg-emerald-50 text-emerald-900 shadow-sm">
          <CardContent className="p-4 text-sm">{toast}</CardContent>
        </Card>
      )}

      {errorMessage && (
        <ErrorState
          title="スタッフ管理で問題がありました"
          description={errorMessage}
          className="px-4 py-6"
        />
      )}

      {requiresReverification && (
        <Card className="border-amber-200 bg-amber-50 text-amber-900 shadow-sm">
          <CardContent className="p-4 text-sm">
            スタッフ追加やシフト変更などの管理操作には再認証が必要です。操作時はセキュリティ確認画面へ移動します。
          </CardContent>
        </Card>
      )}

      {/* Page-level tabs */}
      
      {isRegionalAdmin && (<Card className={adminCardClass}>
        <CardContent className="p-4">
          <Tabs value={pageTab} onValueChange={(value) => setPageTab(value as PageTab)}>
            <TabsList className="h-auto w-full justify-start gap-2 rounded-lg bg-slate-100 p-1">
              <TabsTrigger
                value="staff"
                className="press-squish focus-ring flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 data-[state=active]:border-indigo-500 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
              >
                <Users className="h-4 w-4" />
                スタッフ一覧
              </TabsTrigger>
              <TabsTrigger
                value="shift"
                className="press-squish focus-ring flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 data-[state=active]:border-indigo-500 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
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
            <AdminStatCard label="現在利用中" value={`${activeStaffCount}人`} tone="success" icon={<Users className="h-4 w-4" />} />
            <AdminStatCard label="停止中" value={`${inactiveStaffCount}人`} tone="warning" icon={<Users className="h-4 w-4" />} />
            <AdminStatCard label="招待中" value={`${pendingInvitationCount}件`} tone="primary" icon={<Plus className="h-4 w-4" />} />
          </div>

          <Card className={adminCardClass}>
            <CardContent className="space-y-3 p-4">
              <Input
                value={staffSearch}
                onChange={(event) => setStaffSearch(event.target.value)}
                placeholder="氏名、メール、電話、所属で検索"
                className={adminInputClass}
              />
              <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as RoleFilter)}>
                <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-lg bg-slate-100 p-1">
                  {availableFilterItems.map((item) => (
                    <TabsTrigger
                      key={item.key}
                      value={item.key}
                      className="press-squish focus-ring rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 data-[state=active]:border-indigo-500 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
                    >
                      {item.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          <StaffManagementCollapsibleSection
            title="スタッフ活動量の詳細"
            description="直近 7日 / 30日 の実績を、持ち越しと未完了を優先して見やすくまとめます。"
            countLabel={`${staffActivitySummaries.length}名`}
            icon={Users}
          >
            <div className="space-y-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <Tabs value={activityRange} onValueChange={(value) => setActivityRange(value as ActivityRange)}>
                  <TabsList className="h-auto rounded-lg bg-slate-100 p-1">
                    <TabsTrigger value="7d" className="press-squish focus-ring rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 data-[state=active]:border-indigo-500 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">7日</TabsTrigger>
                    <TabsTrigger value="30d" className="press-squish focus-ring rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 data-[state=active]:border-indigo-500 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">30日</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              {isActivityLoading ? (
                <LoadingState message="活動量データを読み込み中です。" />
              ) : staffActivitySummaries.length === 0 ? (
                <EmptyState
                  title="表示できる活動量データはまだありません"
                  description="活動量データが入るとここに表示されます。"
                  className="px-4 py-8 shadow-none"
                />
              ) : (
                <div className="grid grid-cols-1 gap-2 xl:grid-cols-2 2xl:grid-cols-3">
                  {staffActivitySummaries.map((item) => {
                    const isExpanded = expandedActivityCardId === item.id
                    return (
                      <button
                        key={`${activityRange}-${item.id}`}
                        type="button"
                        onClick={() => setExpandedActivityCardId((current) => current === item.id ? null : item.id)}
                        className={`${adminPanelClass} soft-pop space-y-2 p-2.5 text-left cursor-pointer hover:border-slate-300 hover:bg-white hover:shadow-md`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-1.5">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                            <p className="text-[11px] text-slate-500">{roleLabel[item.role]}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            {item.carriedOverCount > 0 ? (
                              <Badge variant="outline" className="border-rose-200 bg-rose-50 text-[11px] text-rose-700">持ち越し {item.carriedOverCount}件</Badge>
                            ) : null}
                            {item.pendingCount > 0 ? (
                              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[11px] text-amber-700">未完了 {item.pendingCount}件</Badge>
                            ) : (
                              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[11px] text-emerald-700">完了中心</Badge>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                          <div className="rounded-md border border-slate-200 bg-white px-1.5 py-1.5"><p className="text-slate-500">完了</p><p className="mt-0.5 font-semibold text-emerald-700">{item.completedCount}</p></div>
                          <div className="rounded-md border border-slate-200 bg-white px-1.5 py-1.5"><p className="text-slate-500">未完了</p><p className="mt-0.5 font-semibold text-amber-700">{item.pendingCount}</p></div>
                          <div className="rounded-md border border-slate-200 bg-white px-1.5 py-1.5"><p className="text-slate-500">持越</p><p className="mt-0.5 font-semibold text-rose-700">{item.carriedOverCount}</p></div>
                          <div className="rounded-md border border-slate-200 bg-white px-1.5 py-1.5"><p className="text-slate-500">患者</p><p className="mt-0.5 font-semibold text-slate-900">{item.patientCount}</p></div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>{isExpanded ? 'タップで閉じる' : 'タップで詳細'}</span>
                          <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', isExpanded && 'rotate-180')} />
                        </div>
                        {isExpanded ? (
                          <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-2.5">
                            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                              <div className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-1.5"><p className="text-slate-500">初回</p><p className="mt-0.5 font-semibold text-violet-700">{item.firstVisitCount}件</p></div>
                              <div className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-1.5"><p className="text-slate-500">完了率</p><p className="mt-0.5 font-semibold text-slate-900">{item.completionRate}%</p></div>
                              <div className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-1.5"><p className="text-slate-500">負荷感</p><p className="mt-0.5 font-semibold text-slate-900">{item.tone === 'heavy' ? '高め' : item.tone === 'medium' ? '中' : '軽め'}</p></div>
                            </div>
                            <div>
                              <p className="text-[11px] font-medium text-slate-600">期間内の患者状況</p>
                              {item.patientStages.length === 0 ? (
                                <p className="mt-2 text-[11px] text-slate-500">期間内の患者記録はありません。</p>
                              ) : (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {item.patientStages.map((patient) => (
                                    <span key={`${item.id}-${patient.patientName}`} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-700">
                                      {patient.patientName} / {patient.stageLabel}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </StaffManagementCollapsibleSection>

          <StaffManagementCollapsibleSection
            title="スタッフ一覧"
            description="検索・絞り込み後のアカウントを確認し、編集や停止・再開を行います。"
            countLabel={`${filteredStaff.length}名`}
            icon={Users}
          >
            <div className="grid grid-cols-1 gap-3 lg:hidden">
              {isUserListLoading ? (
                <Card className={adminCardClass}>
                  <CardContent className="p-4">
                    <LoadingState message="アカウント一覧を読み込み中です。" />
                  </CardContent>
                </Card>
              ) : filteredStaff.length === 0 ? (
                <EmptyState
                  title="表示できるアカウントはまだありません"
                  description="条件に合うアカウントが入るとここに表示されます。"
                  className={adminCardClass}
                />
              ) : filteredStaff.map((member) => (
                <Card key={member.id} className={adminCardClass}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-base font-semibold text-slate-900">{member.name}</p>
                      <Badge variant="outline" className={cn('border text-xs', roleClass[member.role])}>
                        {roleLabel[member.role]}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-slate-600">
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
                          className="border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                          disabled={userActionId === member.id}
                          onClick={() => openEditDialog(member)}
                        >
                          編集
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
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

            <Card className={`hidden lg:block ${adminTableClass}`}>
              <Table>
              <TableHeader>
                <TableRow className="border-slate-200 hover:bg-slate-50">
                  <TableHead className="text-slate-500">氏名</TableHead>
                  <TableHead className="text-slate-500">役割</TableHead>
                  <TableHead className="text-slate-500">電話</TableHead>
                  <TableHead className="text-slate-500">メール</TableHead>
                  <TableHead className="text-slate-500">所属</TableHead>
                  <TableHead className="text-slate-500">状態</TableHead>
                  <TableHead className="text-right text-slate-500">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isUserListLoading ? (
                  <TableRow className="border-slate-200 hover:bg-slate-50">
                    <TableCell colSpan={7} className="py-4">
                      <LoadingState message="アカウント一覧を読み込み中です。" className="justify-center" />
                    </TableCell>
                  </TableRow>
                ) : filteredStaff.length === 0 ? (
                  <TableRow className="border-slate-200 hover:bg-slate-50">
                    <TableCell colSpan={7} className="py-4">
                      <EmptyState
                        title="表示できるアカウントはまだありません"
                        description="条件に合うアカウントが入るとここに表示されます。"
                        className="border-0 bg-transparent px-0 py-2 shadow-none"
                      />
                    </TableCell>
                  </TableRow>
                ) : filteredStaff.map((member) => {
                  const isSelf = member.id === user?.id
                  return (
                  <TableRow key={member.id} className="border-slate-200 transition hover:bg-slate-50">
                    <TableCell className="font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{member.name}</span>
                        {isSelf && <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-[10px] text-cyan-700">自分</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('border text-xs', roleClass[member.role])}>
                        {roleLabel[member.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">{member.phone}</TableCell>
                    <TableCell className="text-slate-600">{member.email}</TableCell>
                    <TableCell className="text-xs text-slate-600">
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
                          className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          disabled={userActionId === member.id}
                          onClick={() => openEditDialog(member)}
                        >
                          編集
                        </Button>
                        {isSystemAdmin && member.role === 'system_admin' && (
                          <Button
                            type="button"
                            variant="outline"
                            className="border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                            disabled={userActionId === member.id}
                            onClick={() => openAssignmentDialog(member)}
                          >
                            権限を追加
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          disabled={isSelf || userActionId === member.id || member.status === 'invited'}
                          onClick={() => handleUserStatusChange(member.id, member.status === 'active' ? 'suspended' : 'active')}
                        >
                          {member.status === 'active' ? '停止' : '再開'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
              </Table>
            </Card>
          </StaffManagementCollapsibleSection>

          <StaffManagementCollapsibleSection
            title="招待中アカウント"
            description="未受諾の招待は再送または取消できます。"
            countLabel={`${pendingInvitationCount}件`}
            icon={Plus}
          >
            <div className="space-y-3">
              <Input
                value={invitationSearch}
                onChange={(event) => setInvitationSearch(event.target.value)}
                placeholder="メール、役割、所属で検索"
                className={adminInputClass}
              />
              {isInvitationListLoading ? (
                <LoadingState message="招待一覧を読み込み中です。" />
              ) : filteredInvitations.length === 0 ? (
                <EmptyState
                  title="条件に合う招待はまだありません"
                  description="招待中アカウントがあるとここに表示されます。"
                  className="px-4 py-8 shadow-none"
                />
              ) : (
                filteredInvitations.map((invitation) => (
                  <div key={invitation.id} className={`${adminPanelClass} soft-pop flex flex-col gap-3 p-4 cursor-pointer hover:border-slate-300 hover:bg-white hover:shadow-md sm:flex-row sm:items-center sm:justify-between`}>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p className="font-medium text-slate-900">{invitation.email}</p>
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
                        className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        disabled={invitationActionId === invitation.id || !['pending', 'expired'].includes(invitation.status)}
                        onClick={() => handleResendInvitation(invitation.id)}
                      >
                        再送
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                        disabled={invitationActionId === invitation.id || invitation.status !== 'pending'}
                        onClick={() => handleRevokeInvitation(invitation.id)}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </StaffManagementCollapsibleSection>
        </>
      )}

      {/* ===== Shift Management Tab ===== */}
      {role === 'regional_admin' && pageTab === 'shift' && (
        <>
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-900">週間シフト</CardTitle>
              <CardDescription className="text-slate-500">
                2026-03-02 Mon ~ 2026-03-08 Sun
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-slate-500">
                セルをクリックして当番種別を切り替えられます
              </p>
            </CardContent>
          </Card>

          {/* Desktop: table grid */}
          <Card className="hidden border-slate-200 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 hover:bg-slate-50">
                    <TableHead className="min-w-[120px] text-slate-500">夜間薬剤師</TableHead>
                    {weekDays.map((day) => (
                      <TableHead
                        key={day.date}
                        className={cn(
                          'min-w-[100px] text-center text-slate-500',
                          (day.label === '土' || day.label === '日') && 'text-slate-400'
                        )}
                      >
                        <div className="text-xs">{day.full}</div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shiftPharmacists.map((pharmacist) => (
                    <TableRow key={pharmacist.id} className="border-slate-200 hover:bg-slate-50">
                      <TableCell className="font-medium text-slate-900">{pharmacist.name}</TableCell>
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
                                      : 'border-slate-200 bg-slate-50 text-slate-600'
                                  )}
                                >
                                  {shift.shiftType === 'primary' ? '当番' : 'バックアップ'}
                                </Badge>
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
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
                <Card key={day.date} className="border-slate-200 bg-white shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle
                      className={cn(
                        'text-sm',
                        day.label === '土' || day.label === '日' ? 'text-slate-400' : 'text-slate-900'
                      )}
                    >
                      {day.full}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 p-4 pt-0">
                    {dayShifts.length === 0 ? (
                      <p className="text-xs text-slate-500">シフトなし</p>
                    ) : (
                      dayShifts.map((shift) => (
                        <div
                          key={shift.id}
                          className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                        >
                          <span className="text-sm text-slate-700">{shift.pharmacistName}</span>
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
                                  : 'border-slate-200 bg-slate-50 text-slate-600'
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

      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open)
        if (!open) {
          setEditingMemberId(null)
          setEditingMemberRole(null)
        }
      }}>
        <DialogContent className={`${adminDialogClass} sm:max-w-lg`}>
          <DialogHeader>
            <DialogTitle className="text-slate-900">アカウント情報を編集</DialogTitle>
            <DialogDescription className="text-slate-600">氏名、電話、必要に応じて所属を更新します。</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditStaff} className="space-y-4">
            {(() => {
              const isSelfEditing = editingMemberId === user?.id
              const canEditRegionalAffiliation = isSystemAdmin && editingMemberRole === 'regional_admin' && !isSelfEditing
              const canEditPharmacyAffiliation = isRegionalAdmin && !isSelfEditing

              return (
                <>
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

            {canEditRegionalAffiliation && (
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
                <p className="text-[11px] text-gray-500">所属変更は system_admin のみ行えます。</p>
              </div>
            )}

            {canEditPharmacyAffiliation && (
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

            {!canEditRegionalAffiliation && isSystemAdmin && editingMemberRole === 'regional_admin' && isSelfEditing && (
              <p className="text-[11px] text-gray-500">自分の所属リージョンはここでは変更できません。</p>
            )}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditDialogOpen(false)} disabled={Boolean(userActionId)}>
                キャンセル
              </Button>
              <Button type="submit" className="bg-indigo-500 text-white hover:bg-indigo-500/90" disabled={Boolean(userActionId)}>
                保存する
              </Button>
            </DialogFooter>
                </>
              )
            })()}
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={assignmentDialogOpen} onOpenChange={(open) => {
        setAssignmentDialogOpen(open)
        if (!open) {
          setAssignmentTarget(null)
          setAssignmentRegionIds([])
        }
      }}>
        <DialogContent className={`${adminDialogClass} sm:max-w-lg`}>
          <DialogHeader>
            <DialogTitle className="text-slate-900">既存アカウントに権限を追加</DialogTitle>
            <DialogDescription className="text-slate-600">system_admin の既存アカウントに regional_admin 権限を追加します。</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAssignment} className="space-y-4">
            <div className="space-y-1 text-sm text-gray-300">
              <p className="font-medium text-white">{assignmentTarget?.email ?? '—'}</p>
              <p>追加する権限: リージョン管理者</p>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">所属リージョン</Label>
              <div className="rounded-md border border-[#2a3553] bg-[#1a2035] p-3">
                <div className="flex flex-wrap gap-2">
                  {regions.map((region) => {
                    const selected = assignmentRegionIds.includes(region.id)
                    return (
                      <button
                        key={region.id}
                        type="button"
                        onClick={() => setAssignmentRegionIds((prev) => prev.includes(region.id) ? prev.filter((id) => id !== region.id) : [...prev, region.id])}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-sm transition-colors',
                          selected
                            ? 'border-cyan-300 bg-cyan-400/25 text-white shadow-[0_0_0_1px_rgba(103,232,249,0.35)]'
                            : 'border-[#2a3553] bg-[#11182c] text-gray-300 hover:border-indigo-500/30',
                        )}
                      >
                        {region.name}
                      </button>
                    )
                  })}
                </div>
              </div>
              <p className="text-[11px] text-gray-500">複数選択できます。既に付与済みのリージョンは重複追加されません。</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAssignmentDialogOpen(false)} disabled={Boolean(userActionId)}>
                キャンセル
              </Button>
              <Button type="submit" className="bg-indigo-500 text-white hover:bg-indigo-500/90" disabled={Boolean(userActionId) || assignmentRegionIds.length === 0}>
                権限を追加する
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={regionDialogOpen} onOpenChange={setRegionDialogOpen}>
        <DialogContent className={`${adminDialogClass} sm:max-w-md`}>
          <DialogHeader>
            <DialogTitle className="text-slate-900">リージョンを追加</DialogTitle>
            <DialogDescription className="text-slate-600">system_admin が招待前に新しいリージョンを登録します。</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRegion} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-region-name" className="text-gray-300">リージョン名</Label>
              <Input
                id="new-region-name"
                value={newRegionName}
                onChange={(event) => setNewRegionName(event.target.value)}
                required
                className={adminInputClass}
                placeholder="例: 北海道リージョン"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setRegionDialogOpen(false)} disabled={isCreatingRegion}>
                キャンセル
              </Button>
              <Button type="submit" className="bg-indigo-500 text-white hover:bg-indigo-500/90" disabled={isCreatingRegion}>
                {isCreatingRegion ? '作成中...' : 'リージョンを追加'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Staff Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={`${adminDialogClass} sm:max-w-lg`}>
          <DialogHeader>
            <DialogTitle className="text-slate-900">アカウントを招待</DialogTitle>
            <DialogDescription className="text-slate-600">氏名、役割、連絡先を登録して招待メールを送ります。</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddStaff} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700">氏名</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                required
                className={adminInputClass}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-700">役割</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, role: value as AddStaffRole }))
                  }
                  disabled={isSystemAdmin}
                >
                  <SelectTrigger className={adminInputClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 bg-white text-slate-900">
                    {isSystemAdmin && <SelectItem value="regional_admin">リージョン管理者</SelectItem>}
                    {isRegionalAdmin && <SelectItem value="night_pharmacist">夜間薬剤師</SelectItem>}
                    {isRegionalAdmin && <SelectItem value="pharmacy_admin">薬局管理者</SelectItem>}
                    {isPharmacyAdmin && <SelectItem value="pharmacy_staff">薬局スタッフ</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">招待後の扱い</Label>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  招待メールを送信し、受諾後に利用開始します。
                </div>
              </div>
            </div>

            {isSystemAdmin && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label className="text-slate-700">所属リージョン</Label>
                  <Button type="button" variant="outline" size="sm" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50" onClick={() => setRegionDialogOpen(true)}>
                    新しいリージョンを追加
                  </Button>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap gap-2">
                    {regions.map((region) => {
                      const selected = formData.regionIds.includes(region.id)
                      return (
                        <button
                          key={region.id}
                          type="button"
                          onClick={() => setFormData((prev) => {
                            const exists = prev.regionIds.includes(region.id)
                            const nextRegionIds = exists
                              ? prev.regionIds.filter((id) => id !== region.id)
                              : [...prev.regionIds, region.id]
                            return {
                              ...prev,
                              regionIds: nextRegionIds,
                              regionId: nextRegionIds[0] ?? '',
                              pharmacyId: '',
                            }
                          })}
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-sm transition-colors',
                            selected
                              ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm'
                              : 'border-slate-300 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50',
                          )}
                        >
                          {region.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">複数選択できます。最初に選ばれたリージョンを初期所属として扱います。</p>
              </div>
            )}

            {isRegionalAdmin && (
              <div className="space-y-2">
                <Label className="text-slate-700">対象薬局</Label>
                <Select
                  value={formData.pharmacyId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, pharmacyId: value }))}
                  disabled={false}
                >
                  <SelectTrigger className={adminInputClass}>
                    <SelectValue placeholder="薬局を選択" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 bg-white text-slate-900">
                    {pharmacies.map((pharmacy) => (
                      <SelectItem key={pharmacy.id} value={pharmacy.id}>{pharmacy.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-500">薬局管理者と夜間薬剤師には対象薬局が必要です。加盟店詳細から来た場合は自動で選択されます。</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-700">電話</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
                required
                className={adminInputClass}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">メール</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                required
                className={adminInputClass}
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
