'use client'

import Link from 'next/link'
import {
  phaseOrder,
  defaultAnswers,
  calculateAxisScores,
  calculateReadiness,
  getPhaseInfo,
  getPhaseById,
} from '@/lib/onboarding'
import { Pill, PhaseCard } from '@/components/onboarding'

export default function PhaseMapPage() {
  const axisScores = calculateAxisScores(defaultAnswers)
  const readiness = calculateReadiness(axisScores)
  const phaseInfo = getPhaseInfo(readiness)
  const currentPhase = getPhaseById(phaseInfo.phaseId)
  const nextPhase = getPhaseById(Math.min(phaseInfo.phaseId + 1, phaseOrder.length - 1))

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <header className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">全体像</h1>
            <p className="text-sm text-gray-600">
              最初から全面には出さず、必要なときにだけ確認できる位置に置いています。
            </p>
          </div>
          <Pill tone={phaseInfo.tone}>現在 {currentPhase.shortLabel}</Pill>
        </div>
      </header>

      {/* 今と次 */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <p className="mb-1 text-xs text-gray-500">今</p>
          <p className="mb-2 text-lg font-bold text-gray-900">
            {currentPhase.icon} {currentPhase.label}
          </p>
          <p className="text-sm text-gray-600">{currentPhase.summary}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <p className="mb-1 text-xs text-gray-500">次</p>
          <p className="mb-2 text-lg font-bold text-gray-900">
            {phaseInfo.phaseId >= 5 ? '🌙 夜間接続判断' : `${nextPhase.icon} ${nextPhase.label}`}
          </p>
          <p className="text-sm text-gray-600">
            {phaseInfo.phaseId >= 5
              ? '夜間支援に進むか判断する段階です。'
              : nextPhase.summary}
          </p>
        </div>
      </section>

      {/* フェーズ一覧 */}
      <section className="space-y-4">
        {phaseOrder.map((phase) => {
          const status: 'current' | 'done' | 'upcoming' =
            phase.id === phaseInfo.phaseId
              ? 'current'
              : phase.id < phaseInfo.phaseId
                ? 'done'
                : 'upcoming'

          return <PhaseCard key={phase.key} phase={phase} status={status} />
        })}
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
