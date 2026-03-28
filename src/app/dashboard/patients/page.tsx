'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
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
import { Search, Phone, MapPin, GripVertical, Plus } from 'lucide-react'
import { patientData, pharmacyData, getAttentionFlags, getAttentionFlagClass } from '@/lib/mock-data'

export default function PatientsPage() {
  const { role } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')

  const isNightPharmacist = role === 'night_pharmacist'
  const isDayContext = role === 'pharmacy_admin' || role === 'pharmacy_staff'

  const visiblePatients = useMemo(() => {
    if (isDayContext) {
      return patientData.filter((patient) => patient.pharmacyId === 'PH-01')
    }
    return patientData
  }, [isDayContext])

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return visiblePatients

    return visiblePatients.filter((patient) => patient.name.toLowerCase().includes(query))
  }, [searchQuery, visiblePatients])

  const orderedPatients = useMemo(() => {
    const ownPharmacyId = 'PH-01'
    if (!isDayContext) return filteredPatients

    return [...filteredPatients].sort((a, b) => {
      const aIndex = a.pharmacyId === ownPharmacyId ? 0 : 1
      const bIndex = b.pharmacyId === ownPharmacyId ? 0 : 1
      if (aIndex !== bIndex) return aIndex - bIndex
      return a.name.localeCompare(b.name, 'ja')
    })
  }, [filteredPatients, isDayContext])

  if (isNightPharmacist) {
    return (
      <div className="space-y-4 text-gray-100">
        <div>
          <h1 className="text-lg font-semibold text-white">患者情報</h1>
          <p className="text-xs text-gray-400">夜間薬剤師は患者一覧ではなく検索起点で患者にアクセスします。</p>
        </div>

        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader>
            <CardTitle className="text-base text-white">夜間患者検索へ移動</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-300">
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
    <div className="space-y-4 text-gray-100">
      {isDayContext && (
        <Link href="/dashboard/patients/new" className="fixed bottom-24 right-4 z-20 lg:bottom-6 lg:right-6">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-indigo-500/40 bg-indigo-600 text-white shadow-lg transition hover:bg-indigo-500">
            <Plus className="h-6 w-6" />
          </span>
        </Link>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">患者情報</h1>
          <p className="text-xs text-gray-400">{isDayContext ? '日中運用で使う患者一覧。電話・地図導線と並び替えを優先。' : '在宅患者の基本情報・注意事項を確認'}</p>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="患者名で検索"
            className="border-[#2a3553] bg-[#1a2035] pl-9"
          />
        </div>
      </div>

      {filteredPatients.length === 0 && (
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardContent className="p-6 text-center text-sm text-gray-400">
            該当する患者が見つかりません。
          </CardContent>
        </Card>
      )}

      {filteredPatients.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
            {orderedPatients.map((patient) => {
              const attentionFlags = getAttentionFlags(patient)
              const pharmacy = pharmacyData.find((item) => item.id === patient.pharmacyId)
              return (
              <Link key={patient.id} href={`/dashboard/patients/${patient.id}`}>
                <Card
                  className="cursor-pointer border-[#2a3553] bg-[#1a2035] transition hover:border-indigo-500/60"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {isDayContext && <GripVertical className="h-4 w-4 text-gray-500" />}
                          <p className="text-base font-semibold text-white">{patient.name}</p>
                        </div>
                        <p className="text-xs text-gray-400">生年月日: {patient.dob}</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2 text-xs">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(patient.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-gray-300 hover:text-indigo-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                        {patient.address}
                      </a>
                      {pharmacy?.phone && (
                        <div>
                          <a
                            href={`tel:${pharmacy.phone}`}
                            className="inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="h-3.5 w-3.5" />
                            {pharmacy.phone}
                          </a>
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-indigo-300">{patient.pharmacyName}</p>
                    {attentionFlags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {attentionFlags.slice(0, 3).map((flag) => (
                          <Badge key={flag.key} variant="outline" className={cn('border text-[10px]', getAttentionFlagClass(flag.tone))}>
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

          <Card className="hidden border-[#2a3553] bg-[#1a2035] lg:block">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white">患者一覧</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-[#2a3553] hover:bg-[#1a2035]">
                    <TableHead className="text-gray-400">氏名</TableHead>
                    <TableHead className="text-gray-400">生年月日</TableHead>
                    <TableHead className="text-gray-400">住所</TableHead>
                    <TableHead className="text-gray-400">薬局</TableHead>
                    <TableHead className="text-gray-400">注意フラグ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderedPatients.map((patient) => {
                    const attentionFlags = getAttentionFlags(patient)
                    const pharmacy = pharmacyData.find((item) => item.id === patient.pharmacyId)
                    return (
                    <TableRow
                      key={patient.id}
                      className="cursor-pointer border-[#2a3553] hover:bg-[#11182c]"
                    >
                      <TableCell className="font-medium text-white">
                        <div className="flex items-center gap-2">
                          {isDayContext && <GripVertical className="h-4 w-4 text-gray-500" />}
                          <Link href={`/dashboard/patients/${patient.id}`} className="hover:text-indigo-300">
                            {patient.name}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">{patient.dob}</TableCell>
                      <TableCell className="text-gray-300">
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
                      <TableCell className="space-y-1">
                        <p className="text-indigo-300">{patient.pharmacyName}</p>
                        {pharmacy?.phone && (
                          <a
                            href={`tel:${pharmacy.phone}`}
                            className="inline-flex items-center gap-1 text-xs text-sky-300 hover:text-sky-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="h-3.5 w-3.5" />
                            {pharmacy.phone}
                          </a>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {attentionFlags.slice(0, 3).map((flag) => (
                            <Badge
                              key={flag.key}
                              variant="outline"
                              className={cn('border text-[10px]', getAttentionFlagClass(flag.tone))}
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
