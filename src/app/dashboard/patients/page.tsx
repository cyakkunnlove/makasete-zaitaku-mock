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
import { Search, MapPin, GripVertical, Plus } from 'lucide-react'
import { getPatientAttentionFlags, getPatientAttentionFlagClass } from '@/lib/patient-attention'
import { countVisitRuleTouches, formatVisitRuleSummary, loadRegisteredPatients, type RegisteredPatientRecord } from '@/lib/patient-master'
import { canManagePatients, getScopedPharmacyId } from '@/lib/patient-permissions'

function isUuidLike(value: string | null | undefined) {
  if (!value) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}
import { mergePatientSources } from '@/lib/patient-read-model'
import { isPatientInPharmacyScope } from '@/lib/patient-scope'

export default function PatientsPage() {
  const { role, user, authMode } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [registeredPatients, setRegisteredPatients] = useState<RegisteredPatientRecord[]>([])
  const [databasePatients, setDatabasePatients] = useState<RegisteredPatientRecord[]>([])
  const [isSearchLoading, setIsSearchLoading] = useState(false)

  const isNightPharmacist = role === 'night_pharmacist'
  const isRegionalAdmin = role === 'regional_admin'
  const isDayContext = canManagePatients(role)
  const ownPharmacyId = getScopedPharmacyId(user)

  useEffect(() => {
    if (authMode === 'cognito') {
      setRegisteredPatients([])
      return
    }

    const syncPatients = () => setRegisteredPatients(loadRegisteredPatients())
    syncPatients()
    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === 'makasete-patient-master:v1') {
        syncPatients()
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [authMode])

  useEffect(() => {
    if (!isDayContext || !ownPharmacyId) return

    let cancelled = false
    async function fetchPatients() {
      try {
        const response = await fetch(`/api/patients/by-pharmacy/${ownPharmacyId}`, { cache: 'no-store' })
        const result = await response.json()
        if (!cancelled && response.ok && result?.ok && Array.isArray(result.patients)) {
          setDatabasePatients(result.patients)
        }
      } catch {
        if (!cancelled) setDatabasePatients([])
      }
    }

    fetchPatients()
    return () => {
      cancelled = true
    }
  }, [isDayContext, ownPharmacyId])

  useEffect(() => {
    const query = searchQuery.trim()
    if ((!isRegionalAdmin && !isDayContext) || !query) {
      if (isRegionalAdmin) setDatabasePatients([])
      return
    }

    let cancelled = false
    setIsSearchLoading(true)
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

    return () => {
      cancelled = true
    }
  }, [isDayContext, isRegionalAdmin, searchQuery])

  const fallbackRegisteredPatients = useMemo(() => {
    if (authMode === 'cognito') return []
    if (!isDayContext || databasePatients.length === 0 || searchQuery.trim()) return registeredPatients
    return registeredPatients.filter((patient) => !isUuidLike(patient.id))
  }, [authMode, databasePatients.length, isDayContext, registeredPatients, searchQuery])

  const patientMaster = useMemo(
    () =>
      mergePatientSources({
        databasePatients,
        registeredPatients: isRegionalAdmin ? [] : fallbackRegisteredPatients,
        includeMockPatients: authMode !== 'cognito',
      }),
    [authMode, databasePatients, fallbackRegisteredPatients, isRegionalAdmin],
  )

  const visiblePatients = useMemo(() => {
    if (isRegionalAdmin) {
      return databasePatients
    }
    if (isDayContext && searchQuery.trim()) {
      return databasePatients
    }
    if (isDayContext) {
      return patientMaster.filter((patient) => isPatientInPharmacyScope(patient, ownPharmacyId))
    }
    return patientMaster
  }, [databasePatients, isDayContext, isRegionalAdmin, ownPharmacyId, patientMaster, searchQuery])

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

    return [...filteredPatients].sort((a, b) => {
      const aIndex = a.pharmacyId === ownPharmacyId ? 0 : 1
      const bIndex = b.pharmacyId === ownPharmacyId ? 0 : 1
      if (aIndex !== bIndex) return aIndex - bIndex
      return a.name.localeCompare(b.name, 'ja')
    })
  }, [filteredPatients, isDayContext, ownPharmacyId])

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
          <p className="text-xs text-slate-500">{isDayContext ? '日中運用で使う患者一覧。電話・地図導線と並び替えを優先。' : isRegionalAdmin ? '最初から全件は出さず、必要な患者だけ検索して確認します。' : '在宅患者の基本情報・注意事項を確認'}</p>
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

      {isRegionalAdmin && isSearchLoading && (
        <Card className={adminCardClass}>
          <CardContent className="p-6 text-center text-sm text-slate-500">
            患者候補を検索中です...
          </CardContent>
        </Card>
      )}

      {filteredPatients.length === 0 && !isSearchLoading && (
        <Card className={adminCardClass}>
          <CardContent className="p-6 text-center text-sm text-slate-500">
            {isRegionalAdmin && !searchQuery.trim() ? '患者は最初から一覧表示しません。検索すると候補が表示されます。' : '該当する患者が見つかりません。'}
          </CardContent>
        </Card>
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
