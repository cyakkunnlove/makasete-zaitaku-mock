'use client'

import Link from 'next/link'
import { ArrowLeftRight, Building2, CheckCircle2, LogOut, Shield, Store, UserCircle2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'

type RoleAssignmentCard = {
  id: string
  role: 'system_admin' | 'regional_admin' | 'pharmacy_admin' | 'pharmacy_staff' | 'night_pharmacist'
  regionName: string | null
  pharmacyName: string | null
  operationUnitName: string | null
  isDefault: boolean
  note?: string
}

const mockAssignmentsByRole: Record<string, RoleAssignmentCard[]> = {
  system_admin: [
    {
      id: 'assign-system-admin-kanto',
      role: 'system_admin',
      regionName: null,
      pharmacyName: null,
      operationUnitName: null,
      isDefault: true,
      note: 'システム管理全体',
    },
    {
      id: 'assign-regional-admin-kanto',
      role: 'regional_admin',
      regionName: '関東リージョン',
      pharmacyName: null,
      operationUnitName: null,
      isDefault: false,
      note: '関東の加盟店・夜間体制を管理',
    },
  ],
  regional_admin: [
    {
      id: 'assign-regional-admin-kanto',
      role: 'regional_admin',
      regionName: '関東リージョン',
      pharmacyName: null,
      operationUnitName: null,
      isDefault: true,
      note: '関東リージョンの管理者',
    },
    {
      id: 'assign-night-pharmacist-jonan',
      role: 'night_pharmacist',
      regionName: '関東リージョン',
      pharmacyName: '城南みらい薬局',
      operationUnitName: '夜間運用ユニットA',
      isDefault: false,
      note: '夜間の実務応援に入る想定',
    },
  ],
  pharmacy_admin: [
    {
      id: 'assign-pharmacy-admin-jonan',
      role: 'pharmacy_admin',
      regionName: '関東リージョン',
      pharmacyName: '城南みらい薬局',
      operationUnitName: null,
      isDefault: true,
      note: '自局の管理責任者',
    },
    {
      id: 'assign-night-pharmacist-jonan',
      role: 'night_pharmacist',
      regionName: '関東リージョン',
      pharmacyName: '城南みらい薬局',
      operationUnitName: '夜間運用ユニットA',
      isDefault: false,
      note: '夜間担当も兼務する想定',
    },
  ],
  pharmacy_staff: [
    {
      id: 'assign-pharmacy-staff-jonan',
      role: 'pharmacy_staff',
      regionName: '関東リージョン',
      pharmacyName: '城南みらい薬局',
      operationUnitName: null,
      isDefault: true,
      note: '自局の実務担当',
    },
  ],
  night_pharmacist: [
    {
      id: 'assign-night-pharmacist-jonan',
      role: 'night_pharmacist',
      regionName: '関東リージョン',
      pharmacyName: '城南みらい薬局',
      operationUnitName: '夜間運用ユニットA',
      isDefault: true,
      note: '夜間専任の想定',
    },
  ],
}

const roleLabels: Record<RoleAssignmentCard['role'], string> = {
  system_admin: 'System Admin',
  regional_admin: 'Regional Admin',
  pharmacy_admin: 'Pharmacy Admin',
  pharmacy_staff: 'Pharmacy Staff',
  night_pharmacist: 'Night Pharmacist',
}

const roleBadgeClass: Record<RoleAssignmentCard['role'], string> = {
  system_admin: 'border-violet-500/40 bg-violet-500/20 text-violet-300',
  regional_admin: 'border-indigo-500/40 bg-indigo-500/20 text-indigo-300',
  pharmacy_admin: 'border-sky-500/40 bg-sky-500/20 text-sky-300',
  pharmacy_staff: 'border-amber-500/40 bg-amber-500/20 text-amber-300',
  night_pharmacist: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
}

export default function RoleChooserPage() {
  const { user, role, signOut } = useAuth()
  const assignments = mockAssignmentsByRole[role ?? 'pharmacy_staff'] ?? []

  return (
    <div className="space-y-6 text-gray-100">
      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-indigo-500/15 p-3 text-indigo-300">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-white">どの立場で利用しますか？</CardTitle>
              <CardDescription className="text-gray-400">
                ログイン自体は同じアカウントですが、見る情報と操作できる範囲は立場ごとに変わります。
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-[#2a3553] bg-[#0f172a] p-4 text-sm text-gray-300">
            <p className="font-medium text-white">現在のアカウント</p>
            <div className="mt-2 space-y-1 text-xs text-gray-400">
              <p>氏名: {user?.full_name ?? '不明'}</p>
              <p>メール: {user?.email ?? '不明'}</p>
              <p>現在のロール表示: {role ? roleLabels[role as RoleAssignmentCard['role']] ?? role : '未選択'}</p>
            </div>
          </div>

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-xs leading-6 text-amber-100/90">
            <p className="font-medium">これは UI モックです</p>
            <p className="mt-1">
              実装時は `user_role_assignments` と active role context cookie を使って、ここで選んだ立場を session に保存します。
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="border-[#2a3553] bg-[#1a2035]">
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={roleBadgeClass[assignment.role]}>
                  {roleLabels[assignment.role]}
                </Badge>
                {assignment.isDefault && (
                  <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-200">
                    通常使う立場
                  </Badge>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <UserCircle2 className="h-4 w-4 text-gray-500" />
                  <span>{assignment.note ?? '役割説明なし'}</span>
                </div>
                {assignment.regionName && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span>{assignment.regionName}</span>
                  </div>
                )}
                {assignment.pharmacyName && (
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-gray-500" />
                    <span>{assignment.pharmacyName}</span>
                  </div>
                )}
                {assignment.operationUnitName && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <span>{assignment.operationUnitName}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button className="bg-indigo-600 text-white hover:bg-indigo-500">
                  <CheckCircle2 className="h-4 w-4" />
                  この立場で入る
                </Button>
                <Button variant="outline" className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#1a2035]">
                  詳細を見る
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-400">
            立場を切り替えると、表示メニューや操作可能範囲がその立場基準に変わる想定です。
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#1a2035]">
              <Link href="/dashboard/more">その他へ戻る</Link>
            </Button>
            <Button variant="ghost" onClick={signOut} className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300">
              <LogOut className="h-4 w-4" />
              いったんログアウト
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
