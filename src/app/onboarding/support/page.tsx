'use client'

import Link from 'next/link'
import { supportItems } from '@/lib/onboarding'
import { SupportCard } from '@/components/onboarding'

export default function SupportPage() {
  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <header className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-bold text-gray-900">相談・伴走</h1>
        <p className="text-sm text-gray-600">
          この薬局の作業を進める中で、そのまま相談できる導線です。
        </p>
      </header>

      {/* サポートカード */}
      <section className="grid gap-4 md:grid-cols-3">
        {supportItems.map((item) => (
          <SupportCard key={item.id} item={item} />
        ))}
      </section>

      {/* 相談のコツ */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 font-bold text-gray-900">
          相談時に送ると進みやすい内容
        </h2>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-gray-400">•</span>
            今つくっている資料名
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-400">•</span>
            どこで迷っているか 1〜2点
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-400">•</span>
            次回会議までに決めたいこと
          </li>
        </ul>
      </section>

      {/* ボタン */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/onboarding/tasks/task-comment"
          className="rounded-full bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700"
        >
          コメント依頼タスクを見る
        </Link>
        <Link
          href="/onboarding/learning/learning-template"
          className="rounded-full border border-gray-300 bg-white px-6 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          添削前のテンプレを見る
        </Link>
      </div>

      {/* ナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg justify-around py-2">
          <Link href="/onboarding" className="flex flex-col items-center px-3 py-1 text-gray-500">
            <span className="text-lg">🏠</span>
            <span className="text-xs font-medium">ホーム</span>
          </Link>
          <Link href="/onboarding/assessment" className="flex flex-col items-center px-3 py-1 text-gray-500">
            <span className="text-lg">🩺</span>
            <span className="text-xs font-medium">診断</span>
          </Link>
          <Link href="/onboarding/tasks" className="flex flex-col items-center px-3 py-1 text-gray-500">
            <span className="text-lg">✅</span>
            <span className="text-xs font-medium">今週</span>
          </Link>
          <Link href="/onboarding/support" className="flex flex-col items-center px-3 py-1 text-blue-600">
            <span className="text-lg">💬</span>
            <span className="text-xs font-medium">相談</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
