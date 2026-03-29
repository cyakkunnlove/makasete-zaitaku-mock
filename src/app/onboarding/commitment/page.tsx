'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { commitmentQuestions, type CommitmentLevel } from '@/lib/onboarding'
import { Pill } from '@/components/onboarding'
import { cn } from '@/lib/utils'

export default function CommitmentPage() {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, CommitmentLevel>>({})

  const allAnswered = commitmentQuestions.every((q) => answers[q.id])

  // 最も多い回答レベルを決定
  const determineLevel = (): CommitmentLevel => {
    const levels = Object.values(answers)
    const counts = {
      basic: levels.filter((l) => l === 'basic').length,
      moderate: levels.filter((l) => l === 'moderate').length,
      full: levels.filter((l) => l === 'full').length,
    }
    if (counts.full >= counts.moderate && counts.full >= counts.basic) return 'full'
    if (counts.moderate >= counts.basic) return 'moderate'
    return 'basic'
  }

  const handleNext = () => {
    const level = determineLevel()
    // URLパラメータで本気度を渡す
    router.push(`/onboarding/assessment?commitment=${level}`)
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <header className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">本気度診断</h1>
            <p className="text-sm text-gray-600">
              在宅をどの規模で考えているかを確認します。これによりロードマップが変わります。
            </p>
          </div>
          <Pill tone="info">2問</Pill>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 p-4">
          <p className="text-sm text-gray-700">
            薬局によって目指すゴールが違います。
            地域支援体制加算を取りたいだけの層と、本格的に在宅事業として展開したい層では、
            必要な準備が異なります。
          </p>
        </div>
      </header>

      {/* 質問 */}
      <section className="space-y-4">
        {commitmentQuestions.map((question, qIndex) => (
          <div
            key={question.id}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-3">
              <Pill tone="info">Q{qIndex + 1}</Pill>
            </div>
            <h2 className="mb-4 text-base font-bold text-gray-900">
              {question.question}
            </h2>
            <div className="space-y-2">
              {question.options.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: option.level }))}
                  className={cn(
                    'w-full rounded-xl border p-4 text-left transition',
                    answers[question.id] === option.level
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{option.label}</span>
                    <Pill
                      tone={
                        option.level === 'full'
                          ? 'good'
                          : option.level === 'moderate'
                            ? 'warn'
                            : 'info'
                      }
                    >
                      {option.level === 'full'
                        ? '本格'
                        : option.level === 'moderate'
                          ? '中規模'
                          : '基本'}
                    </Pill>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* 3つのコースの説明 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-bold text-gray-900">3つのコース</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="mb-1 text-xs font-semibold text-blue-600">基本コース</p>
            <p className="mb-2 font-bold text-gray-900">地域支援体制加算取得</p>
            <p className="text-sm text-gray-600">
              加算要件を満たすことが目標。日中対応のみ。
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="mb-1 text-xs font-semibold text-amber-600">中規模コース</p>
            <p className="mb-2 font-bold text-gray-900">在宅10-30件程度</p>
            <p className="text-sm text-gray-600">
              安定運用を目指す。将来的な夜間対応も視野に。
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="mb-1 text-xs font-semibold text-emerald-600">本格コース</p>
            <p className="mb-2 font-bold text-gray-900">本格在宅事業</p>
            <p className="text-sm text-gray-600">
              30件以上、24時間365日対応を目指す。
            </p>
          </div>
        </div>
      </section>

      {/* 次へボタン */}
      <div className="flex justify-center gap-3">
        <Link
          href="/onboarding"
          className="rounded-full border border-gray-300 bg-white px-6 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          戻る
        </Link>
        <button
          type="button"
          onClick={handleNext}
          disabled={!allAnswered}
          className={cn(
            'rounded-full px-8 py-3 font-semibold text-white transition',
            allAnswered
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'cursor-not-allowed bg-gray-300'
          )}
        >
          6軸診断へ進む
        </button>
      </div>

      {/* ナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg justify-around py-2">
          <Link href="/onboarding" className="flex flex-col items-center px-3 py-1 text-gray-500">
            <span className="text-lg">🏠</span>
            <span className="text-xs font-medium">ホーム</span>
          </Link>
          <Link href="/onboarding/commitment" className="flex flex-col items-center px-3 py-1 text-blue-600">
            <span className="text-lg">🎯</span>
            <span className="text-xs font-medium">本気度</span>
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
