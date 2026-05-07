'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shield, KeyRound, LogIn, ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'

export default function AccountSecurityPage() {
  const { user, role, requiresReverification } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const passkeyStatus = searchParams.get('passkey')
  const passkeyError = searchParams.get('passkey_error')
  const reauthRequired = searchParams.get('reauth') === 'required'
  const nextPath = searchParams.get('next')

  const continuePath = nextPath && nextPath.startsWith('/') ? nextPath : '/dashboard'

  const passkeyMessage = (() => {
    if (passkeyStatus === 'added') {
      return {
        tone: 'success' as const,
        title: 'パスキーの追加が完了しました',
        body: '対応環境では、次回以降のログイン時に利用できます。',
      }
    }

    if (passkeyStatus === 'cancelled') {
      return {
        tone: 'warning' as const,
        title: 'パスキー追加は完了していません',
        body: '必要に応じて、もう一度お試しください。',
      }
    }

    if (passkeyStatus === 'pending') {
      return {
        tone: 'warning' as const,
        title: 'パスキー設定の反映を確認しています',
        body: '登録直後は Cognito 側の反映に少し時間がかかる場合があります。次回ログインでパスキーが表示されない場合だけ、少し待ってからもう一度追加してください。',
      }
    }

    if (passkeyError) {
      return {
        tone: 'error' as const,
        title: '設定処理または認証画面への移動で問題が発生しました',
        body: '必要に応じて通常ログインを試すか、もう一度やり直してください。',
      }
    }

    return null
  })()

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" className="gap-2 text-slate-600 hover:text-slate-900">
          <Link href={continuePath}>
            <ArrowLeft size={16} />
            戻る
          </Link>
        </Button>
      </div>

      {reauthRequired && (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="space-y-2 p-5">
            <p className="text-sm font-semibold text-amber-900">再認証が必要です</p>
            <p className="text-xs leading-6 text-amber-800">
              12時間を超えたため、続行前にもう一度本人確認をお願いします。パスキーが使える場合はそちらを優先してください。
            </p>
            {nextPath && <p className="text-[11px] leading-5 text-amber-700">再認証後の戻り先: {nextPath}</p>}
          </CardContent>
        </Card>
      )}

      {passkeyMessage && (
        <Card
          className={
            passkeyMessage.tone === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10'
              : passkeyMessage.tone === 'warning'
                ? 'border-amber-500/30 bg-amber-500/10'
                : 'border-rose-500/30 bg-rose-500/10'
          }
        >
          <CardContent className="space-y-2 p-5">
            <p className="text-sm font-semibold text-slate-900">{passkeyMessage.title}</p>
            <p className="text-xs leading-6 text-slate-700">{passkeyMessage.body}</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start gap-3">
            <Shield className="mt-1 text-emerald-500" size={20} />
            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-slate-900">アカウント / セキュリティ設定</h1>
              <p className="text-sm text-slate-500">
                ログイン方法やアカウント保護に関する設定を確認できます。いまは
                <span className="text-slate-900"> パスキー推奨・通常ログイン併用 </span>
                の方針です。
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-medium text-slate-900">現在のログイン情報</p>
            <div className="mt-2 space-y-1 text-xs text-slate-500">
              <p>ユーザー: {user?.full_name ?? '不明'}</p>
              <p>メール: {user?.email ?? '不明'}</p>
              <p>ロール: {role ?? '不明'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-1 text-indigo-500" size={20} />
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-slate-900">パスキー設定</h2>
              <p className="text-sm text-slate-500">
                Face ID / Touch ID / 端末認証を使ってログインしやすくするための設定です。
                現時点では <span className="text-slate-900">任意設定</span> で、通常ログインも引き続き利用できます。
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs leading-6 text-emerald-800">
            <p className="font-medium">確認できていること</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>通常ログインはそのまま利用できます</li>
              <li>パスキーは任意で追加できます</li>
              <li>既存ユーザーでも、Cognito の認証画面経由でパスキー登録できます</li>
              <li>登録後は、対応環境ではログイン時にパスキーを利用できます</li>
            </ol>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-medium text-slate-900">パスキー設定について</p>
            <p className="mt-2 text-xs leading-6 text-slate-500">
              パスキーの追加は、単なるプロフィール設定ではなく、認証手段の追加として扱います。
              続行すると Cognito の認証画面に移動し、本人確認後にパスキー登録を進めます。
              ログイン時は、少なくとも現時点では <span className="text-slate-900">Eメール入力後にパスキーを使う形</span> です。
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-medium text-slate-900">パスキーを追加する流れ</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-6 text-slate-500">
              <li>「パスキーを追加」を押す</li>
              <li>Cognito の認証画面に移動する</li>
              <li>必要に応じて再認証する</li>
              <li>認証後、パスキー登録を続ける</li>
            </ol>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-500">
              <a href={`/api/auth/passkey-setup?next=${encodeURIComponent(continuePath)}`}>パスキーを追加</a>
            </Button>
            <Button asChild variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
              <a href={`/api/auth/login?next=${encodeURIComponent(continuePath)}`}>
                <LogIn size={16} className="mr-2" />
                {reauthRequired ? '再認証する' : '通常ログインを開く'}
              </a>
            </Button>
            {!requiresReverification && (
              <Button
                variant="ghost"
                className="text-slate-600 hover:text-slate-900"
                onClick={() => router.push(continuePath)}
              >
                元の画面へ戻る
              </Button>
            )}
          </div>

          <p className="text-xs leading-6 text-slate-500">
            パスキー追加時には認証画面へ移動します。Cognito 側のセッション状況によっては、再度ログインが必要になる場合があります。
            ログインUIでは、まず Eメール入力が必要な場合があります。
          </p>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-3 p-5 text-sm text-slate-700">
          <p className="font-medium text-slate-900">今の運用方針</p>
          <ul className="list-disc space-y-1 pl-5 text-slate-500">
            <li>パスキーは推奨だが必須ではない</li>
            <li>ユーザーごとに任意で設定できる形を目標にする</li>
            <li>通常ログインも残す</li>
            <li>既存ユーザー向けのパスキー追加は、再認証付きの Cognito 認証フローとして扱う</li>
            <li>将来的にはカスタムドメイン、RP ID、ブランド表示も本番向けに整理する</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
