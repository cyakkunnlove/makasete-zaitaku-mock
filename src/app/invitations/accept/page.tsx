import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { hashInvitationToken } from '@/lib/account-invitations'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

const roleLabel: Record<string, string> = {
  system_admin: 'システム管理者',
  regional_admin: 'リージョン管理者',
  pharmacy_admin: '薬局管理者',
  night_pharmacist: '夜間薬剤師',
  pharmacy_staff: '薬局スタッフ',
}

const invitationStatusLabel: Record<string, string> = {
  pending: '招待中',
  expired: '期限切れ',
  accepted: '受諾済み',
  revoked: '取消済み',
}

export default async function InvitationAcceptPage({
  searchParams,
}: {
  searchParams: { token?: string; result?: string }
}) {
  const token = searchParams.token?.trim()
  let error: string | null = null
  let invitation: {
    email: string
    role: string
    status: string
    expiresAt: string
    regionName: string | null
    pharmacyName: string | null
  } | null = null
  const result = searchParams.result?.trim() ?? null

  if (!token) {
    error = '招待トークンが見つかりませんでした。'
  } else {
    const supabase = createServerSupabaseClient()
    const response = await supabase
      .from('account_invitations')
      .select('email, role, status, expires_at, region:regions(name), pharmacy:pharmacies(name)')
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
        region?: { name?: string | null } | null
        pharmacy?: { name?: string | null } | null
      }
      invitation = {
        email: row.email,
        role: row.role,
        status:
          row.status === 'pending' && new Date(row.expires_at).getTime() < Date.now()
            ? 'expired'
            : row.status,
        expiresAt: row.expires_at,
        regionName: row.region?.name ?? null,
        pharmacyName: row.pharmacy?.name ?? null,
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
                <div className="space-y-2 rounded-lg border border-[#2a3553] bg-[#1a2035] p-4">
                  <p>メール: {invitation.email}</p>
                  <p>立場: {roleLabel[invitation.role] ?? invitation.role}</p>
                  {invitation.regionName && <p>対象リージョン: {invitation.regionName}</p>}
                  {invitation.pharmacyName && <p>対象薬局: {invitation.pharmacyName}</p>}
                  <div className="flex items-center gap-2">
                    <span>状態:</span>
                    <Badge variant="outline" className="border border-[#2a3553] text-xs text-gray-200">
                      {invitationStatusLabel[invitation.status] ?? invitation.status}
                    </Badge>
                  </div>
                  <p>有効期限: {new Date(invitation.expiresAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</p>
                </div>
                {result === 'accepted' ? (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs leading-6 text-emerald-100">
                    初回登録が完了しました。下のボタンからそのままログインしてください。
                  </div>
                ) : invitation.status === 'pending' ? (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs leading-6 text-emerald-100">
                    この招待を受けて初回登録する場合は、下のボタンから進んでください。認証完了後に、この招待は受諾済みとなりアカウントが有効化されます。
                  </div>
                ) : invitation.status === 'accepted' ? (
                  <div className="rounded-lg border border-[#2a3553] bg-[#1a2035] p-4 text-xs leading-6 text-gray-300">
                    この招待はすでに受諾済みです。通常のログイン画面からお入りください。
                  </div>
                ) : invitation.status === 'expired' ? (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-xs leading-6 text-amber-100">
                    この招待の有効期限が切れています。管理者へ再送を依頼してください。
                  </div>
                ) : (
                  <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-xs leading-6 text-rose-100">
                    この招待は現在利用できません。必要なら管理者へ確認してください。
                  </div>
                )}
                <div className="flex flex-col gap-3 sm:flex-row">
                  {invitation.status === 'pending' && result !== 'accepted' ? (
                    <Button asChild className="bg-indigo-600 text-white hover:bg-indigo-500">
                      <Link href={`/api/auth/login?next=/dashboard&invitationToken=${encodeURIComponent(token ?? '')}`}>初回登録を進める</Link>
                    </Button>
                  ) : (
                    <Button asChild className="bg-indigo-600 text-white hover:bg-indigo-500">
                      <Link href="/login">ログイン画面へ</Link>
                    </Button>
                  )}
                  <Button asChild variant="outline" className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#1a2035]">
                    <Link href="/login">通常のログイン画面へ</Link>
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
