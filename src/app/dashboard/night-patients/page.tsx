'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, TriangleAlert } from 'lucide-react'
import { patientData } from '@/lib/mock-data'

function calculateAge(dob: string): number {
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default function NightPatientsPage() {
  const { role } = useAuth()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return patientData.filter((patient) => {
      const age = String(calculateAge(patient.dob))
      return (
        patient.id.toLowerCase().includes(q) ||
        patient.name.toLowerCase().includes(q) ||
        patient.dob.includes(q) ||
        patient.pharmacyName.toLowerCase().includes(q) ||
        age === q
      )
    })
  }, [query])

  if (role !== 'night_pharmacist' && role !== 'regional_admin') {
    return (
      <Card className="border-[#2a3553] bg-[#1a2035] text-gray-100">
        <CardContent className="p-6 text-sm text-gray-400">この画面はNight PharmacistまたはRegional Adminのみ利用できます。</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 text-gray-100">
      <div>
        <h1 className="text-lg font-semibold text-white">夜間患者検索</h1>
        <p className="text-xs text-gray-400">患者一覧は表示せず、検索ヒットした患者だけを詳細確認します。</p>
      </div>

      <Card className="border-amber-500/30 bg-amber-500/10">
        <CardContent className="p-4 text-xs text-amber-100">
          night_pharmacist は、原則として依頼詳細からこの画面へ入り、患者照合を行います。独立検索はモック上の簡易導線として残しています。
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm text-white">
            <Search className="h-4 w-4 text-indigo-400" />
            患者検索
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="氏名・生年月日を主に、患者ID・薬局名でも検索"
            className="border-[#2a3553] bg-[#11182c] text-gray-100"
          />
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
            <div className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 h-4 w-4 text-amber-300" />
              <p>検索結果には最小限の情報のみ表示します。詳細は患者を選択して確認してください。</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {query.trim() && (
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white">検索結果 {filtered.length}件</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400">該当患者が見つかりません。</p>
            ) : (
              filtered.map((patient) => (
                <Link key={patient.id} href={`/dashboard/night-patients/${patient.id}`}>
                  <div className="rounded-lg border border-[#2a3553] bg-[#111827] p-4 transition hover:border-indigo-500/40 hover:bg-[#151d30]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{patient.name}</p>
                          <Badge
                            variant="outline"
                            className={patient.status === 'active' ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' : 'border-gray-500/40 bg-gray-500/20 text-gray-300'}
                          >
                            {patient.status === 'active' ? '利用中' : '休止'}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-gray-400">{patient.id} / {patient.dob} / {calculateAge(patient.dob)}歳</p>
                        <p className="mt-1 text-xs text-indigo-300">{patient.pharmacyName}</p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        詳細を見る
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardContent className="p-4 text-xs text-gray-400">
          検索キーは MVP として「氏名 / 生年月日」を主軸に、「患者ID / 薬局名」を補助で採用。電話番号は患者本人への連絡用情報として保持し、検索主軸にはしません。
        </CardContent>
      </Card>
    </div>
  )
}
