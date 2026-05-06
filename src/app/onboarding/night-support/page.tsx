'use client'

import Link from 'next/link'

export default function NightSupportPage() {
  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <header className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-bold text-gray-900">夜間接続の前提整理</h1>
        <p className="text-sm text-gray-600">
          夜間本体ではなく、必要になった時点で判断材料を確認するための画面です。
        </p>
      </header>

      {/* 確認すること */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 font-bold text-gray-900">この画面で確認すること</h2>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-gray-400">•</span>
            夜間方針があるか
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-400">•</span>
            昼間の受入体制が安定しているか
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-400">•</span>
            接続判断に必要な責任者・連絡先がそろっているか
          </li>
        </ul>
      </section>

      {/* 扱わないこと */}
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <h2 className="mb-3 font-bold text-gray-900">この画面では扱わないこと</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-amber-500">•</span>
            夜間依頼受付
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500">•</span>
            患者照合・アサイン
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500">•</span>
            担当体制 / 申し送り運用
          </li>
        </ul>
      </section>

      {/* 次の案内 */}
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
        <p className="mb-1 text-xs text-gray-500">次の案内</p>
        <h2 className="mb-2 font-bold text-gray-900">
          昼間運用の整備が終わったら確認
        </h2>
        <p className="text-sm text-gray-600">
          夜間接続前チェックガイド / 責任者向け確認シート / 接続判定ミーティングへ進みます。
        </p>
      </section>

      {/* OMAKASEへの導線 */}
      <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm">
        <h2 className="mb-2 font-bold text-gray-900">夜間運用を始める準備ができたら</h2>
        <p className="mb-4 text-sm text-gray-600">
          「OMAKASE」では、夜間・緊急対応を含む運用支援で、断らない体制づくりを支えます。
        </p>
        <Link
          href="/dashboard"
          className="inline-flex rounded-full bg-indigo-600 px-6 py-2.5 font-semibold text-white transition hover:bg-indigo-700"
        >
          OMAKASEを見る
        </Link>
      </section>

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
          <Link href="/onboarding/support" className="flex flex-col items-center px-3 py-1 text-gray-500">
            <span className="text-lg">💬</span>
            <span className="text-xs font-medium">相談</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
