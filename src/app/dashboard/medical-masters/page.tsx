'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Building2, Stethoscope } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/auth-context'
import { canManagePatients } from '@/lib/patient-permissions'

type MedicalInstitutionOption = {
  id: string
  name: string
  phone: string
  address: string
  doctorCount: number
  isActive?: boolean
}

type DoctorOption = {
  id: string
  fullName: string
  department: string
  phone: string
  isActive?: boolean
}

export default function MedicalMastersPage() {
  const { role } = useAuth()
  const [query, setQuery] = useState('')
  const [institutions, setInstitutions] = useState<MedicalInstitutionOption[]>([])
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | null>(null)
  const [doctors, setDoctors] = useState<DoctorOption[]>([])

  const canUse = canManagePatients(role)

  useEffect(() => {
    if (!canUse) return
    void fetch(`/api/medical-institutions?q=${encodeURIComponent(query)}&includeInactive=1`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((result) => {
        if (result?.ok && Array.isArray(result.medicalInstitutions)) {
          setInstitutions(result.medicalInstitutions)
        }
      })
  }, [canUse, query])

  useEffect(() => {
    if (!selectedInstitutionId) {
      setDoctors([])
      return
    }
    void fetch(`/api/medical-institutions/${selectedInstitutionId}/doctors?includeInactive=1`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((result) => {
        if (result?.ok && Array.isArray(result.doctors)) {
          setDoctors(result.doctors)
        }
      })
  }, [selectedInstitutionId])

  const selectedInstitution = useMemo(
    () => institutions.find((item) => item.id === selectedInstitutionId) ?? null,
    [institutions, selectedInstitutionId],
  )

  if (!canUse) {
    return (
      <div className="space-y-4 text-slate-900">
        <Link href="/dashboard/more"><Button variant="ghost" className="text-slate-600 hover:text-slate-900"><ArrowLeft className="mr-2 h-4 w-4" />戻る</Button></Link>
        <Card className="border-slate-200 bg-white shadow-sm"><CardContent className="p-6 text-sm text-slate-600">この画面は 薬局管理者 / 薬局スタッフ 向けです。</CardContent></Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 text-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">病院・医師管理</h1>
          <p className="text-xs text-slate-500">重複候補の確認や、候補の軽い整理に使います。</p>
        </div>
        <Link href="/dashboard/more"><Button variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"><ArrowLeft className="mr-2 h-4 w-4" />戻る</Button></Link>
      </div>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="p-4">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} className="border-slate-200 bg-white text-slate-900" placeholder="病院名で検索" />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-slate-900"><Building2 className="h-4 w-4 text-indigo-500" />病院候補</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {institutions.map((item) => (
              <button key={item.id} type="button" onClick={() => setSelectedInstitutionId(item.id)} className={`w-full rounded-lg border px-3 py-3 text-left ${selectedInstitutionId === item.id ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:bg-white'}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">{item.name}</p>
                  {item.isActive === false && <span className="text-[10px] text-rose-600">非表示</span>}
                </div>
                <p className="mt-1 text-xs text-slate-500">{item.address || '住所未設定'} / 医師候補 {item.doctorCount}件</p>
              </button>
            ))}
            {institutions.length === 0 && (
              <EmptyState
                title="該当する病院候補はありません"
                description="検索条件を変えると候補が見つかる場合があります。"
                className="px-4 py-8 shadow-none"
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-slate-900"><Stethoscope className="h-4 w-4 text-sky-500" />医師候補</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {selectedInstitution ? <p className="text-xs text-slate-500">{selectedInstitution.name} に紐づく医師候補</p> : <p className="text-xs text-slate-500">左で病院を選ぶと医師候補を表示します。</p>}
            {doctors.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">{item.fullName}</p>
                  {item.isActive === false && <span className="text-[10px] text-rose-600">非表示</span>}
                </div>
                <p className="mt-1 text-xs text-slate-500">{item.department || '診療科未設定'}{item.phone ? ` / ${item.phone}` : ''}</p>
              </div>
            ))}
            {selectedInstitutionId && doctors.length === 0 && (
              <EmptyState
                title="この病院に紐づく医師候補はありません"
                description="候補が追加されるとここに表示されます。"
                className="px-4 py-8 shadow-none"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
