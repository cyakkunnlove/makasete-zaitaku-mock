'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

// Demo mode: always true unless real Supabase project is configured
const IS_DEMO = true

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Demo mode: auto-redirect to dashboard
  useEffect(() => {
    if (IS_DEMO) {
      window.location.href = '/dashboard'
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (IS_DEMO) {
      router.push('/dashboard')
      return
    }

    // Real Supabase auth (only when env vars are set)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setError('メールアドレスまたはパスワードが正しくありません')
        setLoading(false)
        return
      }

      router.push('/dashboard')
    } catch {
      setError('認証サービスに接続できません')
      setLoading(false)
    }
  }

  if (IS_DEMO) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a]">
        <p className="text-gray-400">デモモードで起動中...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a] p-4">
      <Card className="w-full max-w-md border-[#2a3553] bg-[#111827]">
        <CardHeader className="items-center space-y-2 pb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20">
            <span className="text-2xl">🌙</span>
          </div>
          <h1 className="text-xl font-bold text-white">マカセテ在宅</h1>
          <p className="text-sm text-gray-400">夜間在宅薬局支援システム</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="border-[#2a3553] bg-[#1a2035] text-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="border-[#2a3553] bg-[#1a2035] text-gray-200"
              />
            </div>
            {error && (
              <p className="rounded-md bg-rose-500/10 p-2 text-center text-sm text-rose-400">
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-500 text-white hover:bg-indigo-600"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
