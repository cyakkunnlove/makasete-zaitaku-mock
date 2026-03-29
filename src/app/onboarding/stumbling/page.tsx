'use client'

import Link from 'next/link'
import { stumblingPoints, learningItems } from '@/lib/onboarding'
import { Pill } from '@/components/onboarding'

export default function StumblingPage() {
  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <header className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">つまずきポイント</h1>
            <p className="text-sm text-gray-600">
              現場でよくある問題と、それを解決するための教材を整理しています。
            </p>
          </div>
          <Pill tone="warn">{stumblingPoints.length}件</Pill>
        </div>
        <div className="rounded-xl bg-amber-50 p-4">
          <p className="text-sm text-gray-700">
            特につまずきやすいのは、無菌調剤（クリーンベンチの使い方）、
            ポンプの取り扱い、加算関係、麻薬の換算です。
          </p>
        </div>
      </header>

      {/* つまずきポイント一覧 */}
      <section className="space-y-4">
        {stumblingPoints.map((point) => {
          const relatedLearnings = learningItems.filter((l) =>
            point.relatedLearningIds.includes(l.id)
          )

          return (
            <div
              key={point.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pill tone="info">{point.category}</Pill>
                  <Pill
                    tone={
                      point.difficulty === 'high'
                        ? 'warn'
                        : point.difficulty === 'medium'
                          ? 'info'
                          : 'good'
                    }
                  >
                    {point.difficulty === 'high'
                      ? '難易度: 高'
                      : point.difficulty === 'medium'
                        ? '難易度: 中'
                        : '難易度: 低'}
                  </Pill>
                </div>
              </div>
              <h2 className="mb-2 text-base font-bold text-gray-900">{point.title}</h2>
              <p className="mb-4 text-sm text-gray-600">{point.description}</p>

              {relatedLearnings.length > 0 && (
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="mb-2 text-xs font-semibold text-gray-500">関連教材</p>
                  <div className="space-y-2">
                    {relatedLearnings.map((learning) => (
                      <Link
                        key={learning.id}
                        href={`/onboarding/learning/${learning.id}`}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 transition hover:border-blue-300"
                      >
                        <div className="flex items-center gap-2">
                          <Pill tone="info">{learning.type}</Pill>
                          <span className="font-medium text-gray-900">{learning.title}</span>
                        </div>
                        <span className="text-sm text-gray-500">{learning.duration}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </section>

      {/* 教材カテゴリへのリンク */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-bold text-gray-900">教材で学ぶ</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/onboarding/learning?category=technique"
            className="rounded-xl border border-blue-200 bg-blue-50 p-4 transition hover:border-blue-300"
          >
            <p className="font-bold text-gray-900">つまずきポイント教材一覧</p>
            <p className="text-sm text-gray-600">
              難しいポイントに絞った動画・資料を見る
            </p>
          </Link>
          <Link
            href="/onboarding/learning"
            className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:border-gray-300"
          >
            <p className="font-bold text-gray-900">すべての教材</p>
            <p className="text-sm text-gray-600">全カテゴリの教材を見る</p>
          </Link>
        </div>
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
