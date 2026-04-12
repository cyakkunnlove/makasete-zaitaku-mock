import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { hashInvitationToken } from '@/lib/account-invitations'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

export default async function InvitationAcceptPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = searchParams.token?.trim()
  let error: string | null = null
  let invitation: {
    email: string
    role: string
    status: string
    expiresAt: string
  } | null = null

  if (!token) {
    error = '招待トークンが見つかりませんでした。'
  } else {
    const supabase = createServerSupabaseClient()
    const response = await supabase
      .from('account_invitations')
      .select('email, role, status, expires_at')
      .eq('token_hash', hashInvitationToken(token))
      .maybeSingle()

    if (response.error) {
      error = response.error.message
    } else if (!response.data) {
      error = 'この招待リンクは確認できませんでした。'
    } else {
      const row = response.data as {
        email: string
        role: string
        status: string
        expires_at: string
      }
      invitation = {
        email: row.email,
        role: row.role,
        status:
          row.status === 'pending' && new Date(row.expires_at).getTime() < Date.now()
            ? 'expired'
            : row.status,
        expiresAt: row.expires_at,
      }
    }
  }

  return (
    <main className="min-h-screen bg-[#0b1020] px-4 py-10 text-gray-100">
      <div className="mx-auto max-w-xl">
        <Card className="border-[#2a3553] bg-[#11182c]">
          <CardHeader>
            <CardTitle className="text-white">招待内容の確認</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-300">
            {error && <p className="text-rose-300">{error}</p>}
            {invitation && (
              <>
                <div className="space-y-1 rounded-lg border border-[#2a3553] bg-[#1a2035] p-4">
                  <p>メール: {invitation.email}</p>
                  <p>立場: {invitation.role}</p>
                  <p>状態: {invitation.status}</p>
                  <p>有効期限: {new Date(invitation.expiresAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</p>
                </div>
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-xs leading-6 text-amber-100">
                  この段階では、招待内容の確認まで接続しています。初回登録の最終完了は、次の Cognito 連携仕上げでつなぎ込みます。
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild className="bg-indigo-600 text-white hover:bg-indigo-500">
                    <Link href="/login">ログイン画面へ</Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
