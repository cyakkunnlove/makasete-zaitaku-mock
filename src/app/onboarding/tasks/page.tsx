'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import {
  defaultAnswers,
  defaultCommitmentLevel,
  calculateAxisScores,
  calculateReadiness,
  getPhaseInfo,
  getPhaseById,
  getTasksByCommitment,
  getCommitmentLabel,
  type CommitmentLevel,
} from '@/lib/onboarding'
import { Pill, TaskCard } from '@/components/onboarding'

function TasksContent() {
  const searchParams = useSearchParams()
  const commitmentParam = searchParams.get('commitment') as CommitmentLevel | null
  const commitment = commitmentParam ?? defaultCommitmentLevel

  const axisScores = calculateAxisScores(defaultAnswers)
  const readiness = calculateReadiness(axisScores)
  const phaseInfo = getPhaseInfo(readiness)
  const currentPhase = getPhaseById(phaseInfo.phaseId)
  const tasks = getTasksByCommitment(commitment)
  const focusTasks = tasks.filter((task) => task.status !== '完了').slice(0, 3)

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <header className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">今週やること</h1>
            <p className="text-sm text-gray-600">
              本気度に応じたタスクだけを表示しています。
            </p>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <Pill tone="warn">次: {currentPhase.shortLabel}</Pill>
            <Pill tone={commitment === 'full' ? 'good' : commitment === 'moderate' ? 'warn' : 'info'}>
              {getCommitmentLabel(commitment)}
            </Pill>
          </div>
        </div>
        <div className="rounded-xl bg-amber-50 p-4">
          <p className="mb-2 text-xs font-semibold text-gray-500">進め方</p>
          <p className="text-sm text-gray-700">
            オーナー方針決定 → スタッフ教育 → 体制構築 → 営業・獲得
          </p>
        </div>
      </header>

      {/* 優先タスク */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="mb-2 text-xs font-semibold text-gray-500">まずこの順で進める</p>
        <div className="space-y-2">
          {focusTasks.map((task, i) => (
            <div key={task.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="font-medium text-gray-900">{task.title}</span>
              </div>
              <span className="text-gray-500">{task.owner}</span>
            </div>
          ))}
        </div>
      </section>

      {/* タスク一覧 */}
      <section className="space-y-4">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
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
          <Link href="/onboarding/tasks" className="flex flex-col items-center px-3 py-1 text-blue-600">
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

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">読み込み中...</div>}>
      <TasksContent />
    </Suspense>
  )
}
