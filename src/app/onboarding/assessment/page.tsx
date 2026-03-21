'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  assessmentQuestions,
  defaultAnswers,
  calculateAxisScores,
  calculateReadiness,
  getPhaseInfo,
  getTopGap,
  type AxisKey,
} from '@/lib/onboarding'
import { Pill } from '@/components/onboarding'
import { cn } from '@/lib/utils'

export default function AssessmentPage() {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<AxisKey, number>>(defaultAnswers)

  const axisScores = calculateAxisScores(answers)
  const readiness = calculateReadiness(axisScores)
  const phaseInfo = getPhaseInfo(readiness)
  const topGap = getTopGap(axisScores)

  const handleSelect = (questionId: AxisKey, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }))
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <header className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">3分診断</h1>
            <p className="text-sm text-gray-600">
              5問だけ選ぶと、次にやることが見えます。
            </p>
          </div>
          <Pill tone="warn">5問</Pill>
        </div>
        <div className="rounded-xl bg-blue-50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">いま見えている段階</p>
              <p className="font-bold text-gray-900">{phaseInfo.label}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            迷ったら近いものを選べばOKです。
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
            <span>最優先: {topGap.subject}</span>
            <span>•</span>
            <span>あとで現在地に反映</span>
          </div>
        </div>
      </header>

      {/* 質問リスト */}
      <section className="space-y-4">
        {assessmentQuestions.map((question, qIndex) => {
          const selectedIndex = answers[question.id]
          const selected = question.options[selectedIndex]

          return (
            <div
              key={question.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <Pill tone="info">Q{qIndex + 1}</Pill>
                <Pill tone={selected.score >= 4 ? 'good' : selected.score >= 2.5 ? 'warn' : 'info'}>
                  {selected.score.toFixed(1)} / 5
                </Pill>
              </div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {question.category}
              </p>
              <h2 className="mb-3 text-base font-bold text-gray-900">
                {question.question}
              </h2>
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-blue-600 hover:underline">
                  ヒントを見る
                </summary>
                <p className="mt-2 text-sm text-gray-600">{question.help}</p>
              </details>
              <div className="space-y-2">
                {question.options.map((option, optIndex) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => handleSelect(question.id, optIndex)}
                    className={cn(
                      'w-full rounded-xl border p-4 text-left transition',
                      selectedIndex === optIndex
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">
                        {option.label}
                      </span>
                      <span className="text-sm text-gray-500">
                        {option.score.toFixed(1)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </section>

      {/* 結果確認ボタン */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => router.push('/onboarding/result')}
          className="rounded-full bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          現在地を確認する
        </button>
      </div>

      {/* ナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg justify-around py-2">
          <Link href="/onboarding" className="flex flex-col items-center px-3 py-1 text-gray-500">
            <span className="text-lg">🏠</span>
            <span className="text-xs font-medium">ホーム</span>
          </Link>
          <Link href="/onboarding/assessment" className="flex flex-col items-center px-3 py-1 text-blue-600">
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
