'use client'

import Link from 'next/link'
import { Shield, KeyRound, LogIn, ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'

export default function AccountSecurityPage() {
  const { user, role } = useAuth()

  return (
    <div className="space-y-6 text-gray-100">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" className="gap-2 text-gray-300 hover:text-white">
          <Link href="/dashboard/more">
            <ArrowLeft size={16} />
            戻る
          </Link>
        </Button>
      </div>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start gap-3">
            <Shield className="mt-1 text-emerald-400" size={20} />
            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-white">アカウント / セキュリティ設定</h1>
              <p className="text-sm text-gray-400">
                ログイン方法やアカウント保護に関する設定を確認できます。いまは
                <span className="text-white"> パスキー推奨・通常ログイン併用 </span>
                の方針です。
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-[#2a3553] bg-[#0f172a] p-4 text-sm text-gray-300">
            <p className="font-medium text-white">現在のログイン情報</p>
            <div className="mt-2 space-y-1 text-xs text-gray-400">
              <p>ユーザー: {user?.full_name ?? '不明'}</p>
              <p>メール: {user?.email ?? '不明'}</p>
              <p>ロール: {role ?? '不明'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-1 text-indigo-400" size={20} />
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-white">パスキー設定</h2>
              <p className="text-sm text-gray-400">
                Face ID / Touch ID / 端末認証を使ってログインしやすくするための設定です。
                現時点では <span className="text-white">任意設定</span> で、通常ログインも引き続き利用できます。
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs leading-6 text-emerald-100/90">
            <p className="font-medium">確認できていること</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>通常ログインはそのまま利用できます</li>
              <li>パスキーは任意で追加できます</li>
              <li>既存ユーザーでも、Cognito の認証画面経由でパスキー登録できます</li>
              <li>登録後は、対応環境ではログイン時にパスキーを利用できます</li>
            </ol>
          </div>

          <div className="rounded-lg border border-[#2a3553] bg-[#0f172a] p-4 text-sm text-gray-300">
            <p className="font-medium text-white">パスキー設定について</p>
            <p className="mt-2 text-xs leading-6 text-gray-400">
              パスキーの追加は、単なるプロフィール設定ではなく、認証手段の追加として扱います。
              続行すると Cognito managed login の画面に移動し、本人確認後にパスキー登録を進めます。
              ログイン時は、少なくとも現時点では <span className="text-white">Eメール入力後にパスキーを使う形</span> です。
            </p>
          </div>

          <div className="rounded-lg border border-[#2a3553] bg-[#0f172a] p-4 text-sm text-gray-300">
            <p className="font-medium text-white">パスキーを追加する流れ</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-6 text-gray-400">
              <li>「パスキーを追加」を押す</li>
              <li>Cognito の認証画面に移動する</li>
              <li>必要に応じて再認証する</li>
              <li>認証後、パスキー登録を続ける</li>
            </ol>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-500">
              <a href="/api/auth/passkey-setup">パスキーを追加</a>
            </Button>
            <Button asChild variant="outline" className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#1a2035]">
              <a href="/api/auth/login">
                <LogIn size={16} className="mr-2" />
                通常ログインを開く
              </a>
            </Button>
          </div>

          <p className="text-xs leading-6 text-gray-500">
            パスキー追加時には認証画面へ移動します。Cognito 側のセッション状況によっては、再度ログインが必要になる場合があります。
            ログインUIでは、まず Eメール入力が必要な場合があります。
          </p>
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardContent className="space-y-3 p-5 text-sm text-gray-300">
          <p className="font-medium text-white">今の運用方針</p>
          <ul className="list-disc space-y-1 pl-5 text-gray-400">
            <li>パスキーは推奨だが必須ではない</li>
            <li>ユーザーごとに任意で設定できる形を目標にする</li>
            <li>通常ログインも残す</li>
            <li>既存ユーザー向け passkey enrollment は再認証付きの Cognito managed login フローとして扱う</li>
            <li>将来的には custom domain / RP ID / branded login も本番向けに整理する</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
