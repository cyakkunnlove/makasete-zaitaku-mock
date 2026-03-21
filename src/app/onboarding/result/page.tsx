'use client'

import Link from 'next/link'
import {
  defaultAnswers,
  calculateAxisScores,
  calculateReadiness,
  getPhaseInfo,
  getPhaseById,
  getTopGap,
  getTopStrength,
  getPhaseReasons,
  getNextActions,
} from '@/lib/onboarding'
import { Pill, OnboardingRadarChart } from '@/components/onboarding'

export default function ResultPage() {
  const axisScores = calculateAxisScores(defaultAnswers)
  const readiness = calculateReadiness(axisScores)
  const phaseInfo = getPhaseInfo(readiness)
  const currentPhase = getPhaseById(phaseInfo.phaseId)
  const topGap = getTopGap(axisScores)
  const topStrength = getTopStrength(axisScores)
  const phaseReasons = getPhaseReasons(defaultAnswers)
  const nextActions = getNextActions(topGap)

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <header className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">この薬局の現在地</h1>
            <p className="text-sm text-gray-600">
              診断結果を、次に何をすればいいかが分かる順に並べています。
            </p>
          </div>
          <Pill tone={phaseInfo.tone}>{phaseInfo.label}</Pill>
        </div>
      </header>

      {/* 結果サマリー */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
          <p className="mb-1 text-xs text-gray-500">結果の要約</p>
          <p className="mb-2 text-lg font-bold text-gray-900">
            {currentPhase.icon} {phaseInfo.label}
          </p>
          <p className="mb-4 text-sm text-gray-600">{phaseInfo.summary}</p>
          <div className="grid gap-2 text-sm">
            <div className="flex gap-2">
              <span className="text-gray-500">いまの強み:</span>
              <span className="font-semibold text-gray-900">{topStrength.subject}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500">いちばん先に整える点:</span>
              <span className="font-semibold text-gray-900">{topGap.subject}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500">次に進む条件:</span>
              <span className="font-semibold text-gray-900">{currentPhase.gate}</span>
            </div>
          </div>
        </div>

        {/* レーダーチャート */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-2">
            <p className="text-xs text-gray-500">5軸のバランス</p>
            <p className="font-bold text-gray-900">どこが詰まりやすいかを確認</p>
          </div>
          <OnboardingRadarChart data={axisScores} compact />
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-5">
            {axisScores.map((item) => (
              <div key={item.key} className="flex justify-between rounded-lg bg-gray-50 px-2 py-1">
                <span className="text-gray-600">{item.subject}</span>
                <span className="font-semibold text-gray-900">{item.score.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 次にやること */}
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
        <h2 className="mb-3 font-bold text-gray-900">次に何をすればいいか</h2>
        <ol className="mb-4 list-inside list-decimal space-y-2 text-sm text-gray-700">
          {nextActions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/onboarding/tasks"
            className="rounded-full bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700"
          >
            今週やることを決める
          </Link>
          <Link
            href="/onboarding/support"
            className="rounded-full border border-gray-300 bg-white px-6 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            伴走担当に相談する
          </Link>
        </div>
      </section>

      {/* 各軸の詳細 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-bold text-gray-900">各軸の判定理由</h2>
        <div className="space-y-3">
          {phaseReasons.map((reason) => (
            <div key={reason.category} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold text-gray-900">{reason.category}</span>
                <Pill tone={reason.score >= 4 ? 'good' : reason.score >= 2.5 ? 'warn' : 'info'}>
                  {reason.score.toFixed(1)} / 5
                </Pill>
              </div>
              <p className="mb-1 text-sm font-medium text-gray-700">{reason.label}</p>
              <p className="text-sm text-gray-600">{reason.detail}</p>
            </div>
          ))}
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
