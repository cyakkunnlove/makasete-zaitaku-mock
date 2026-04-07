'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DEMO_ROLE, MOCK_USERS } from '@/lib/mock-data'

const roleOptions = [
  { value: 'system_admin', label: 'System Admin', destination: '/dashboard' },
  { value: 'regional_admin', label: 'Regional Admin', destination: '/dashboard' },
  { value: 'pharmacy_admin', label: 'Pharmacy Admin', destination: '/dashboard' },
  { value: 'pharmacy_staff', label: 'Pharmacy Staff', destination: '/dashboard' },
  { value: 'night_pharmacist', label: 'Night Pharmacist', destination: '/dashboard/night-patients' },
]

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [role, setRole] = useState(DEMO_ROLE)
  const selected = useMemo(() => roleOptions.find((item) => item.value === role) ?? roleOptions[0], [role])
  const loggedOut = searchParams.get('logged_out') === '1'

  const handleDemoLogin = () => {
    router.push(`/api/demo-login?role=${role}`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a] p-4">
      <Card className="w-full max-w-xl border-[#2a3553] bg-[#111827]">
        <CardHeader className="space-y-2 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-2xl">🧭</div>
            <div>
              <h1 className="text-xl font-bold text-white">ログイン</h1>
              <p className="text-sm text-gray-400">Cognito 本番ログインと、移行期間用のデモログインを選べます。対応環境では、ログイン時にパスキーを利用できる場合があります。</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {loggedOut && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100/90">
              <p className="font-medium text-white">ログアウトしました</p>
              <p className="mt-1 text-xs leading-6">必要に応じて、ここから再度ログインできます。</p>
            </div>
          )}

          <div className="rounded-lg border border-[#2a3553] bg-[#1a2035] p-4 text-sm text-gray-300">
            <p>本番は Cognito 認証で入り、アカウント属性に応じた role / 表示内容へ切り替えます。移行期間中はデモログインも残します。</p>
          </div>

          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100/90">
            <p className="font-medium text-white">ログイン方法について</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-6">
              <li>パスキーは任意です</li>
              <li>対応環境では、Eメール入力後にパスキーを利用できる場合があります</li>
              <li>パスキーが使えない場合でも、通常ログインを利用できます</li>
            </ul>
          </div>

          <div className="space-y-3 rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-4">
            <div>
              <p className="text-sm font-semibold text-white">本番ログイン</p>
              <p className="mt-1 text-xs text-indigo-100/80">Cognito の認証画面に移動してログインします。対応環境では、Eメール入力後にパスキーを利用できる場合があります。うまくいかない場合は通常のログイン方法も利用できます。</p>
            </div>
            <Button className="w-full bg-indigo-600 text-white hover:bg-indigo-500" onClick={() => router.push('/api/auth/login')}>
              Cognitoでログイン
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">デモログインするロール</Label>
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
            <p className="text-gray-400">遷移先: {selected.destination}（デモ）</p>
          </div>

          <div className="flex gap-3">
            <Button className="flex-1 bg-indigo-600 text-white hover:bg-indigo-500" onClick={handleDemoLogin}>
              このロールでデモログイン
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
