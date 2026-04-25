'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { adminCardClass, adminInputClass, adminPageClass, adminTableClass } from '@/components/admin-ui'
import { LoadingState } from '@/components/common/LoadingState'
import { EmptyState } from '@/components/common/EmptyState'
import { Search, MapPin, GripVertical, Plus } from 'lucide-react'
import { getPatientAttentionFlags, getPatientAttentionFlagClass } from '@/lib/patient-attention'
import { countVisitRuleTouches, formatVisitRuleSummary, type RegisteredPatientRecord } from '@/lib/patient-master'
import { canManagePatients, getScopedPharmacyId } from '@/lib/patient-permissions'
import type { DayTaskItem } from '@/lib/mock-data'

import { mergePatientSources } from '@/lib/patient-read-model'

function mapDayTask(task: Record<string, unknown>): DayTaskItem {
  return {
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
  }
}

export default function PatientsPage() {
  const { role, user, authMode } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [databasePatients, setDatabasePatients] = useState<RegisteredPatientRecord[]>([])
  const [todayTasks, setTodayTasks] = useState<DayTaskItem[]>([])
  const [isInitialLoading, setIsInitialLoading] = useState(false)
  const [isSearchLoading, setIsSearchLoading] = useState(false)

  const isNightPharmacist = role === 'night_pharmacist'
  const isRegionalAdmin = role === 'regional_admin'
  const isDayContext = canManagePatients(role)
  const ownPharmacyId = getScopedPharmacyId(user)
  const todayDateKey = useMemo(() => {
    const now = new Date()
    const jst = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))
    const year = jst.getFullYear()
    const month = String(jst.getMonth() + 1).padStart(2, '0')
    const day = String(jst.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }, [])

  useEffect(() => {
    if (!isDayContext || !ownPharmacyId || searchQuery.trim()) return

    let cancelled = false
    async function fetchTodayPatients() {
      setIsInitialLoading(true)
      try {
        const taskResponse = await fetch(`/api/day-flow/${todayDateKey}/tasks`, { cache: 'no-store' })
        const taskResult = await taskResponse.json()
        if (cancelled) return

        const tasks: DayTaskItem[] = taskResponse.ok && taskResult?.ok && Array.isArray(taskResult.tasks)
          ? taskResult.tasks.map((task: Record<string, unknown>) => mapDayTask(task))
          : []
        setTodayTasks(tasks)

        const patientIds = Array.from(new Set(tasks.map((task) => task.patientId).filter(Boolean)))
        if (patientIds.length === 0) {
          setDatabasePatients([])
          return
        }

        const patientResponse = await fetch(`/api/patients/by-pharmacy/${ownPharmacyId}?ids=${encodeURIComponent(patientIds.join(','))}`, { cache: 'no-store' })
        const patientResult = await patientResponse.json()
        if (!cancelled && patientResponse.ok && patientResult?.ok && Array.isArray(patientResult.patients)) {
          setDatabasePatients(patientResult.patients)
        }
      } catch {
        if (!cancelled) {
          setTodayTasks([])
          setDatabasePatients([])
        }
      } finally {
        if (!cancelled) setIsInitialLoading(false)
      }
    }

    fetchTodayPatients()
    return () => {
      cancelled = true
    }
  }, [isDayContext, ownPharmacyId, searchQuery, todayDateKey])

  useEffect(() => {
    const query = searchQuery.trim()
    if ((!isRegionalAdmin && !isDayContext) || !query) {
      if (isRegionalAdmin) setDatabasePatients([])
      return
    }

    let cancelled = false
    setIsSearchLoading(true)
    const timer = window.setTimeout(() => {
      fetch(`/api/patients/search?q=${encodeURIComponent(query)}`, { cache: 'no-store' })
        .then(async (response) => {
          const data = await response.json()
          if (!response.ok || !data.ok) throw new Error(data.error ?? 'patient_search_failed')
          if (cancelled) return
          setDatabasePatients(Array.isArray(data.patients) ? data.patients : [])
        })
        .catch(() => {
          if (cancelled) return
          setDatabasePatients([])
        })
        .finally(() => {
          if (!cancelled) setIsSearchLoading(false)
        })
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [isDayContext, isRegionalAdmin, searchQuery])

  const patientMaster = useMemo(
    () =>
      mergePatientSources({
        databasePatients,
        includeMockPatients: false,
      }),
    [databasePatients],
  )

  const visiblePatients = useMemo(() => {
    if (isRegionalAdmin) {
      return databasePatients
    }
    if (isDayContext && searchQuery.trim()) {
      return databasePatients
    }
    if (isDayContext) {
      const todayPatientIds = new Set(todayTasks.map((task) => task.patientId).filter(Boolean))
      return patientMaster.filter((patient) => todayPatientIds.has(patient.id))
    }
    return patientMaster
  }, [databasePatients, isDayContext, isRegionalAdmin, patientMaster, searchQuery, todayTasks])

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      return isRegionalAdmin ? [] : visiblePatients
    }

    if (isRegionalAdmin || isDayContext) {
      return visiblePatients
    }

    return visiblePatients.filter((patient) =>
      [
        patient.name,
        patient.address,
        patient.phone ?? '',
        patient.pharmacyName,
        patient.emergencyContact?.name ?? '',
      ].some((value) => value.toLowerCase().includes(query)),
    )
  }, [isDayContext, isRegionalAdmin, searchQuery, visiblePatients])

  const orderedPatients = useMemo(() => {
    if (!isDayContext) return filteredPatients
    const taskOrder = new Map(todayTasks.map((task) => [task.patientId, task.sortOrder]))

    return [...filteredPatients].sort((a, b) => {
      const aOrder = taskOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER
      const bOrder = taskOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER
      if (aOrder !== bOrder) return aOrder - bOrder
      const aIndex = a.pharmacyId === ownPharmacyId ? 0 : 1
      const bIndex = b.pharmacyId === ownPharmacyId ? 0 : 1
      if (aIndex !== bIndex) return aIndex - bIndex
      return a.name.localeCompare(b.name, 'ja')
    })
  }, [filteredPatients, isDayContext, ownPharmacyId, todayTasks])
  const isPatientListLoading = isInitialLoading || isSearchLoading

  if (isNightPharmacist) {
    return (
      <div className={`${adminPageClass} space-y-4`}>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">患者情報</h1>
          <p className="text-xs text-slate-500">夜間薬剤師は患者一覧ではなく検索起点で患者にアクセスします。</p>
        </div>

        <Card className={adminCardClass}>
          <CardHeader>
            <CardTitle className="text-base text-slate-900">夜間患者検索へ移動</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>夜間では全患者一覧を表示せず、必要時に検索して患者詳細へ入る設計にしています。</p>
            <Link href="/dashboard/night-patients">
              <span className="inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">夜間患者検索を開く</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`${adminPageClass} space-y-4`}>
      {isDayContext && (
        <Link href="/dashboard/patients/new" className="fixed bottom-24 right-4 z-20 lg:bottom-6 lg:right-6">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-indigo-500/40 bg-indigo-600 text-white shadow-lg transition hover:bg-indigo-500">
            <Plus className="h-6 w-6" />
          </span>
        </Link>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">患者情報</h1>
          <p className="text-xs text-slate-500">{isDayContext ? '初期表示は今日の対応患者だけです。検索すると自局患者の検索結果を表示します。' : isRegionalAdmin ? '最初から全件は出さず、必要な患者だけ検索して確認します。' : '在宅患者の基本情報・注意事項を確認'}</p>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={isRegionalAdmin ? '患者名・住所・電話・薬局名で検索' : '患者名・住所・電話で検索'}
            className={`${adminInputClass} pl-9`}
          />
        </div>
      </div>

      {isPatientListLoading && (
        <Card className={adminCardClass}>
          <CardContent className="p-6">
            <LoadingState message={searchQuery.trim() ? '患者候補を検索中です。' : '今日の対応患者を読み込んでいます。'} />
          </CardContent>
        </Card>
      )}

      {filteredPatients.length === 0 && !isPatientListLoading && (
        <EmptyState
          title={isRegionalAdmin && !searchQuery.trim() ? '患者は最初から一覧表示しません' : isDayContext && !searchQuery.trim() ? '今日の対応患者はいません' : '該当する患者が見つかりません'}
          description={isRegionalAdmin && !searchQuery.trim() ? '検索すると候補が表示されます。' : isDayContext && !searchQuery.trim() ? '検索すると自局の患者だけが表示されます。' : '検索条件を変えると見つかる場合があります。'}
          className={adminCardClass}
        />
      )}

      {filteredPatients.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
            {orderedPatients.map((patient) => {
              const attentionFlags = getPatientAttentionFlags(patient)
              return (
              <Link key={patient.id} href={`/dashboard/patients/${patient.id}`}>
                <Card
                  className={`${adminCardClass} cursor-pointer transition hover:border-indigo-400`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {isDayContext && <GripVertical className="h-4 w-4 text-slate-400" />}
                          <p className="text-base font-semibold text-slate-900">{patient.name}</p>
                        </div>
                        <p className="text-xs text-slate-500">生年月日: {patient.dob}</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2 text-xs">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(patient.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-indigo-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                        {patient.address}
                      </a>
                    </div>
                    <p className="mt-1 text-xs text-indigo-600">{patient.pharmacyName}</p>
                    <p className="mt-1 text-[11px] text-slate-500">訪問ルール: {formatVisitRuleSummary(patient)}</p>
                    {authMode !== 'cognito' && patient.registrationMeta && (
                      <p className="mt-1 text-[11px] text-cyan-300">登録済みメモ / {countVisitRuleTouches(patient)} ルール</p>
                    )}
                    {attentionFlags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {attentionFlags.slice(0, 3).map((flag) => (
                          <Badge key={flag.key} variant="outline" className={cn('border text-[10px]', getPatientAttentionFlagClass(flag.tone))}>
                            {flag.label}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )})}
          </div>

          <Card className={`hidden lg:block ${adminTableClass}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-900">患者一覧</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 hover:bg-slate-50">
                    <TableHead className="text-slate-500">氏名</TableHead>
                    <TableHead className="text-slate-500">生年月日</TableHead>
                    <TableHead className="text-slate-500">住所</TableHead>
                    {!isDayContext && <TableHead className="text-slate-500">薬局</TableHead>}
                    <TableHead className="text-slate-500">注意フラグ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderedPatients.map((patient) => {
                    const attentionFlags = getPatientAttentionFlags(patient)
                    return (
                    <TableRow
                      key={patient.id}
                      className="cursor-pointer border-slate-200 hover:bg-slate-50"
                      onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
                    >
                      <TableCell className="font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          {isDayContext && <GripVertical className="h-4 w-4 text-gray-500" />}
                          <div>
                            <Link href={`/dashboard/patients/${patient.id}`} className="hover:text-indigo-300">
                              {patient.name}
                            </Link>
                            <p className="mt-1 text-[11px] font-normal text-gray-500">{formatVisitRuleSummary(patient)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">{patient.dob}</TableCell>
                      <TableCell className="text-slate-600">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(patient.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:text-indigo-300"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                          {patient.address}
                        </a>
                      </TableCell>
                      {!isDayContext && (
                        <TableCell className="space-y-1">
                          <p className="text-indigo-600">{patient.pharmacyName}</p>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {attentionFlags.slice(0, 3).map((flag) => (
                            <Badge
                              key={flag.key}
                              variant="outline"
                              className={cn('border text-[10px]', getPatientAttentionFlagClass(flag.tone))}
                            >
                              {flag.label}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
