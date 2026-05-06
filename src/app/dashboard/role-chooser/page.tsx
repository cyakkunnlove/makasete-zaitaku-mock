'use client'

import { useState } from 'react'
import { ArrowLeftRight, Building2, CheckCircle2, LogOut, Shield, Store, UserCircle2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useRoleContexts } from '@/hooks/use-role-contexts'
import type { UserRole } from '@/types/database'

const roleLabels: Record<UserRole, string> = {
  system_admin: 'システム管理者',
  regional_admin: 'リージョン管理者',
  pharmacy_admin: '薬局管理者',
  pharmacy_staff: '薬局スタッフ',
  night_pharmacist: '夜間薬剤師',
}

const roleBadgeClass: Record<UserRole, string> = {
  system_admin: 'border-violet-500/40 bg-violet-500/20 text-violet-300',
  regional_admin: 'border-indigo-500/40 bg-indigo-500/20 text-indigo-300',
  pharmacy_admin: 'border-sky-500/40 bg-sky-500/20 text-sky-300',
  pharmacy_staff: 'border-amber-500/40 bg-amber-500/20 text-amber-300',
  night_pharmacist: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
}

const roleDetails: Record<UserRole, { scope: string; actions: string[]; note: string }> = {
  system_admin: {
    scope: '全体設定、リージョン管理、管理者アカウント管理を中心に扱います。',
    actions: ['リージョン管理者の管理', '全体集計と監査ログ確認', '上位設定の確認'],
    note: '患者単位の実務操作や請求詳細更新は原則として主担当外です。',
  },
  regional_admin: {
    scope: '担当リージョン内の薬局、夜間運用、未完了案件を監督します。',
    actions: ['薬局管理者・夜間薬剤師の管理', 'リージョン内の進捗確認', '夜間運用の監督'],
    note: '患者単位情報は事故対応・監査対応など必要時の例外閲覧が中心です。',
  },
  pharmacy_admin: {
    scope: '自薬局の患者、日中業務、翌日確認、請求・回収管理を扱います。',
    actions: ['自薬局患者の登録・編集', '夜間対応の翌日確認', '回収管理への接続と更新'],
    note: '薬局スタッフの管理と、自薬局内の重要操作の確認責任を持ちます。',
  },
  pharmacy_staff: {
    scope: '自薬局の実務担当として、患者情報や日中業務を必要範囲で扱います。',
    actions: ['自薬局患者の閲覧・実務更新', '日中業務の操作', '確認済み処理と回収管理更新'],
    note: '高リスク操作は確認、理由、監査ログ、修正依頼の前提で扱います。',
  },
  night_pharmacist: {
    scope: '夜間受付起点の対応に必要な範囲で患者情報とFAXを扱います。',
    actions: ['管轄内患者検索', 'FAX閲覧・紐付け', '夜間対応の開始・完了・申し送り作成'],
    note: '患者情報編集や患者単位の請求・回収詳細は原則対象外です。',
  },
}

export default function RoleChooserPage() {
  const { user, role, signOut } = useAuth()
  const { assignments, loading, saving, error, selectAssignment } = useRoleContexts()
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null)

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
              <p>現在のロール表示: {role ? roleLabels[role] : '未選択'}</p>
            </div>
          </div>

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-xs leading-6 text-amber-100/90">
            <p className="font-medium">現在は確認用の接続です</p>
            <p className="mt-1">
              複数の立場を持つアカウントでは、ここで選んだ立場を基準に表示範囲と操作範囲を切り替えます。
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-xs leading-6 text-rose-100/90">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {loading ? (
          <Card className="border-[#2a3553] bg-[#1a2035]">
            <CardContent className="p-5 text-sm text-gray-400">立場候補を読み込み中です...</CardContent>
          </Card>
        ) : assignments.map((assignment) => {
          const details = roleDetails[assignment.role]
          const detailsId = `role-details-${assignment.assignmentId}`
          const isExpanded = expandedAssignmentId === assignment.assignmentId

          return (
            <Card key={assignment.assignmentId} className="border-[#2a3553] bg-[#1a2035]">
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
                  {!assignment.isActive && (
                    <Badge variant="outline" className="border-rose-500/40 bg-rose-500/10 text-rose-200">
                      無効
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <UserCircle2 className="h-4 w-4 text-gray-500" />
                    <span>{assignment.isDefault ? '通常使う立場として設定' : '追加で持っている立場'}</span>
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

                {isExpanded && (
                  <div id={detailsId} className="rounded-lg border border-[#2a3553] bg-[#11182c] p-4 text-sm text-gray-300">
                    <p className="font-medium text-white">この立場で見える・できること</p>
                    <p className="mt-2 leading-6">{details.scope}</p>
                    <ul className="mt-3 space-y-2">
                      {details.actions.map((action) => (
                        <li key={action} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-indigo-300" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs leading-5 text-gray-400">{details.note}</p>
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    className="bg-indigo-600 text-white hover:bg-indigo-500"
                    disabled={saving || !assignment.isActive}
                    onClick={async () => {
                      const ok = await selectAssignment(assignment.assignmentId)
                      if (ok) window.location.assign('/dashboard')
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {saving ? '保存中...' : 'この立場で入る'}
                  </Button>
                  <Button
                    variant="outline"
                    aria-expanded={isExpanded}
                    aria-controls={detailsId}
                    onClick={() => setExpandedAssignmentId(isExpanded ? null : assignment.assignmentId)}
                    className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#1a2035]"
                  >
                    {isExpanded ? '詳細を閉じる' : '詳細を見る'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-400">
            立場を切り替えると、表示メニューや操作可能範囲がその立場基準に変わる想定です。
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
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
