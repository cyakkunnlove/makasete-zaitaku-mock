'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, LogIn, Moon, Route } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const entryCards = [
  {
    title: '任せて在宅',
    subtitle: 'これから在宅を始めたい方へ',
    description: '導入診断、伴走、教育、ロードマップで、初回受入までを支援します。',
    href: '/onboarding',
    icon: Route,
    tone: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300',
  },
  {
    title: 'オマカセ在宅',
    subtitle: '在宅運用をもっと安定させたい方へ',
    description: '夜間・緊急対応を含む運用支援で、断らない体制づくりを支えます。',
    href: '/dashboard',
    icon: Moon,
    tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  },
  {
    title: 'アプリ',
    subtitle: 'すでにご利用中の方',
    description: '管理画面・診断画面・運用画面にアクセスします。',
    href: '/login',
    icon: LogIn,
    tone: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  },
]

export default function Home() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-[#0a0e1a] text-gray-100">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-indigo-300">Unified Entry</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-white lg:text-5xl">
              在宅薬局の導入から運用まで、
              <br className="hidden md:block" />
              必要な支援をひとつの入口から。
            </h1>
            <p className="mt-4 max-w-3xl text-sm text-gray-400 lg:text-base">
              これから始めたい薬局には「任せて在宅」。すでに運用していて夜間や緊急対応を強化したい薬局には「オマカセ在宅」。
              ご利用中の方は「アプリ」からそのまま管理画面へ進めます。
            </p>
          </div>
          <div className="flex gap-3">
            <Button className="bg-indigo-600 text-white hover:bg-indigo-500" onClick={() => router.push('/login')}>
              <LogIn className="mr-2 h-4 w-4" />
              ログイン
            </Button>
            <Button variant="outline" className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#1a2035]" onClick={() => router.push('/onboarding')}>
              <Route className="mr-2 h-4 w-4" />
              導入診断を見る
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {entryCards.map((card) => {
            const Icon = card.icon
            return (
              <Link key={card.title} href={card.href}>
                <Card className="h-full border-[#2a3553] bg-[#111827] transition hover:border-indigo-500/40 hover:bg-[#151d30]">
                  <CardHeader>
                    <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl border ${card.tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">{card.subtitle}</p>
                    <CardTitle className="mt-2 text-white">{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-gray-400">{card.description}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <Card className="border-[#2a3553] bg-[#111827]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white"><Route className="h-4 w-4 text-indigo-400" />任せて在宅</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-400">導入診断、伴走、教育、ロードマップ、添削など、在宅を始める前後の整理を支援します。</CardContent>
          </Card>
          <Card className="border-[#2a3553] bg-[#111827]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white"><Moon className="h-4 w-4 text-emerald-400" />オマカセ在宅</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-400">夜間・緊急対応を含む運用支援で、断らない体制づくりと現場負荷の軽減を支えます。</CardContent>
          </Card>
          <Card className="border-[#2a3553] bg-[#111827]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white"><Building2 className="h-4 w-4 text-amber-400" />アプリ</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-400">今後はこの入口ページからログインし、ロールごとに必要な画面へ入れるようにしていきます。</CardContent>
          </Card>
        </div>

        <div className="mt-10 rounded-2xl border border-[#2a3553] bg-[#111827] p-6">
          <h2 className="text-lg font-semibold text-white">今後のログイン方針</h2>
          <p className="mt-2 text-sm text-gray-400">
            現在は Supabase 未接続のため、簡易ログインでロールを選んで確認できる状態にしています。
            今後はこの入口ページから認証し、契約・権限に応じて各モジュールへ振り分けます。
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="outline" className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#1a2035]" onClick={() => router.push('/login')}>
            ロールを選んでログイン
          </Button>
          <Button variant="ghost" className="text-gray-400 hover:bg-[#11182c] hover:text-gray-200" onClick={() => router.push('/dashboard')}>
            デモダッシュボードを見る
          </Button>
          <Button variant="ghost" className="text-gray-400 hover:bg-[#11182c] hover:text-gray-200" onClick={() => router.push('/onboarding')}>
            任せて在宅を見る
          </Button>
        </div>
      </div>
    </main>
  )
}
