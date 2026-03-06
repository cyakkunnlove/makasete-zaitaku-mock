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
import { Search } from 'lucide-react'
import { patientData, getRiskClass } from '@/lib/mock-data'

export default function PatientsPage() {
  useAuth()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return patientData

    return patientData.filter((patient) => patient.name.toLowerCase().includes(query))
  }, [searchQuery])

  return (
    <div className="space-y-4 text-gray-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">患者情報</h1>
          <p className="text-xs text-gray-400">在宅患者の基本情報・注意事項を確認</p>
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
            {filteredPatients.map((patient) => (
              <Link key={patient.id} href={`/dashboard/patients/${patient.id}`}>
                <Card
                  className="cursor-pointer border-[#2a3553] bg-[#1a2035] transition hover:border-indigo-500/60"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-base font-semibold text-white">{patient.name}</p>
                        <p className="text-xs text-gray-400">生年月日: {patient.dob}</p>
                      </div>
                      <Badge variant="outline" className={cn('border text-xs', getRiskClass(patient.riskScore))}>
                        リスク {patient.riskScore}
                      </Badge>
                    </div>
                    <p className="mt-3 text-xs text-gray-300">{patient.address}</p>
                    <p className="mt-1 text-xs text-indigo-300">{patient.pharmacyName}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
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
                    <TableHead className="text-right text-gray-400">リスク</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow
                      key={patient.id}
                      className="cursor-pointer border-[#2a3553] hover:bg-[#11182c]"
                    >
                      <TableCell className="font-medium text-white">
                        <Link href={`/dashboard/patients/${patient.id}`} className="hover:text-indigo-300">
                          {patient.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-gray-300">{patient.dob}</TableCell>
                      <TableCell className="text-gray-300">{patient.address}</TableCell>
                      <TableCell className="text-indigo-300">{patient.pharmacyName}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={cn('border text-xs', getRiskClass(patient.riskScore))}
                        >
                          {patient.riskScore}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
