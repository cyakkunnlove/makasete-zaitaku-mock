'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import {
  defaultCommitmentLevel,
  getLearningByCommitment,
  getCommitmentLabel,
  type CommitmentLevel,
} from '@/lib/onboarding'
import { learningCategoryLabels } from '@/lib/onboarding/data'
import { LearningCard, Pill } from '@/components/onboarding'

const categoryIcons: Record<string, string> = {
  phase0: '🔰',
  phase1: '🧭',
  phase2: '🧩',
  phase3: '🚀',
  phase4: '📚',
  phase5: '🌙',
  template: '📑',
  'knowledge-system': '🏥',
  'knowledge-kasan': '📋',
  'knowledge-materials': '📦',
  'skill-aseptic': '🧪',
  'skill-pump': '💉',
  'skill-compatibility': '⚗️',
  'skill-narcotic': '💊',
}

function LearningContent() {
  const searchParams = useSearchParams()
  const commitmentParam = searchParams.get('commitment') as CommitmentLevel | null
  const commitment = commitmentParam ?? defaultCommitmentLevel
  const categoryParam = searchParams.get('category')

  const allLearning = getLearningByCommitment(commitment)
  // カテゴリでフィルタ
  const learningItems = categoryParam && categoryParam !== 'all'
    ? allLearning.filter((i) => i.category === categoryParam)
    : allLearning

  // カテゴリ別にグループ化
  const groupedByCategory = Object.entries(learningCategoryLabels).map(([key, label]) => ({
    key,
    label,
    icon: categoryIcons[key] || '📄',
    items: allLearning.filter((i) => i.category === key),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <header className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">教材</h1>
            <p className="text-sm text-gray-600">
              コースに応じた教材を表示しています。
            </p>
          </div>
          <Pill tone={commitment === 'full' ? 'good' : commitment === 'moderate' ? 'warn' : 'info'}>
            {getCommitmentLabel(commitment)}
          </Pill>
        </div>

        {/* カテゴリ切り替え */}
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/onboarding/learning?commitment=${commitment}`}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              !categoryParam
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            すべて
          </Link>
          {groupedByCategory.map((group) => (
            <Link
              key={group.key}
              href={`/onboarding/learning?commitment=${commitment}&category=${group.key}`}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                categoryParam === group.key
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {group.icon} {group.label}
            </Link>
          ))}
        </div>
      </header>

      {/* カテゴリ別表示 */}
      {categoryParam && categoryParam !== 'all' ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-bold text-gray-900">
            {categoryIcons[categoryParam] || '📄'} {learningCategoryLabels[categoryParam] || categoryParam}
          </h2>
          <div className="space-y-4">
            {learningItems.map((item) => (
              <LearningCard key={item.id} item={item} />
            ))}
          </div>
          {learningItems.length === 0 && (
            <p className="text-sm text-gray-500">このカテゴリの教材はありません。</p>
          )}
        </section>
      ) : (
        /* すべて表示（部門別グループ） */
        groupedByCategory.map((group) => (
          <section key={group.key} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-bold text-gray-900">{group.icon} {group.label}</h2>
            <div className="space-y-4">
              {group.items.map((item) => (
                <LearningCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))
      )}

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

export default function LearningListPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">読み込み中...</div>}>
      <LearningContent />
    </Suspense>
  )
}
