'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DEMO_ROLE, MOCK_USERS } from '@/lib/mock-data'

const IS_DEMO = true
const DEMO_ROLE_STORAGE_KEY = 'makasete-demo-role'

const roleOptions = [
  { value: 'regional_admin', label: 'regional_admin / 地域管理者', destination: '/dashboard/onboarding' },
  { value: 'pharmacy_admin', label: 'pharmacy_admin / 薬局管理者', destination: '/dashboard/onboarding' },
  { value: 'day_pharmacist', label: 'day_pharmacist / 日中薬剤師', destination: '/dashboard' },
  { value: 'night_pharmacist', label: 'night_pharmacist / 夜間薬剤師', destination: '/dashboard/night-patients' },
  { value: 'system_admin', label: 'system_admin / システム管理者', destination: '/dashboard' },
]

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState(DEMO_ROLE)
  const selected = useMemo(() => roleOptions.find((item) => item.value === role) ?? roleOptions[0], [role])

  const handleDemoLogin = () => {
    window.localStorage.setItem(DEMO_ROLE_STORAGE_KEY, role)
    router.push(selected.destination)
  }

  if (!IS_DEMO) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a] text-gray-400">
        本番認証画面は Supabase 接続後に有効化されます。
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a] p-4">
      <Card className="w-full max-w-xl border-[#2a3553] bg-[#111827]">
        <CardHeader className="space-y-2 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-2xl">🧭</div>
            <div>
              <h1 className="text-xl font-bold text-white">簡易ログイン（デモ）</h1>
              <p className="text-sm text-gray-400">Supabase 未接続のため、ロールを選んで画面確認できます。</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-[#2a3553] bg-[#1a2035] p-4 text-sm text-gray-300">
            <p>入口ページから今後ログインする想定に合わせ、まずはロール別の見え方を確認できる状態にしています。</p>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">ログインするロール</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="border-[#2a3553] bg-[#1a2035] text-gray-200">
                <SelectValue placeholder="ロールを選択" />
              </SelectTrigger>
              <SelectContent className="border-[#2a3553] bg-[#111827] text-gray-200">
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-[#2a3553] bg-[#0f172a] p-4 text-sm text-gray-300">
            <p className="font-medium text-white">選択中</p>
            <p className="mt-2">ユーザー: {MOCK_USERS[role]?.full_name}</p>
            <p className="text-gray-400">遷移先: {selected.destination}</p>
          </div>

          <div className="flex gap-3">
            <Button className="flex-1 bg-indigo-600 text-white hover:bg-indigo-500" onClick={handleDemoLogin}>
              このロールで入る
            </Button>
            <Button variant="outline" className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#1a2035]" onClick={() => router.push('/')}>
              入口へ戻る
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
