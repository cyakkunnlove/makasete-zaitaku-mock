'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  defaultAnswers,
  commitmentQuestions,
  assessmentQuestions,
  calculateAxisScores,
  calculateReadiness,
  getPhaseInfo,
  getPhaseById,
  getTopGap,
  getTasksByCommitment,
  getCommitmentLabel,
  // getNextActions,
  phaseOrder,
  type AxisKey,
  type CommitmentLevel,
} from '@/lib/onboarding'
import { Pill, OnboardingRadarChart } from '@/components/onboarding'
import { cn } from '@/lib/utils'

type AppState = 'welcome' | 'commitment' | 'assessment' | 'dashboard'

export default function OnboardingHomePage() {
  const [state, setState] = useState<AppState>('welcome')
  const [commitment, setCommitment] = useState<CommitmentLevel | null>(null)
  const [commitmentAnswers, setCommitmentAnswers] = useState<Record<string, CommitmentLevel>>({})
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<AxisKey, number>>(defaultAnswers)

  // 本気度を計算
  const determineCommitment = (): CommitmentLevel => {
    const levels = Object.values(commitmentAnswers)
    const counts = {
      basic: levels.filter((l) => l === 'basic').length,
      moderate: levels.filter((l) => l === 'moderate').length,
      full: levels.filter((l) => l === 'full').length,
    }
    if (counts.full >= counts.moderate && counts.full >= counts.basic) return 'full'
    if (counts.moderate >= counts.basic) return 'moderate'
    return 'basic'
  }

  const axisScores = calculateAxisScores(assessmentAnswers)
  const readiness = calculateReadiness(axisScores)
  const phaseInfo = getPhaseInfo(readiness)
  const currentPhase = getPhaseById(phaseInfo.phaseId)
  const nextPhase = getPhaseById(Math.min(phaseInfo.phaseId + 1, phaseOrder.length - 1))
  const topGap = getTopGap(axisScores)
  const resolvedCommitment = commitment ?? 'moderate'
  const tasks = getTasksByCommitment(resolvedCommitment)
  const activeTasks = tasks.filter((t) => t.status !== '完了').slice(0, 3)
  // const nextActions = getNextActions(topGap, resolvedCommitment)

  // ========== ウェルカム画面 ==========
  if (state === 'welcome') {
    return (
      <div className="space-y-6">
        <header className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center text-white shadow-lg">
          <p className="mb-2 text-sm font-medium text-blue-200">MAKASETE</p>
          <h1 className="mb-3 text-2xl font-bold">ようこそ</h1>
          <p className="mb-2 text-base text-blue-100">
            在宅導入を一緒に進めていきましょう。
          </p>
          <p className="text-sm text-blue-200">
            まず、あなたの薬局の状況をかんたんに確認します。
          </p>
        </header>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-center font-bold text-gray-900">はじめに3つのステップを進めます</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { step: '1', title: 'コースを選ぶ', desc: '在宅をどの規模で考えているか、2問で確認します。', time: '1分' },
              { step: '2', title: '現在地を知る', desc: '6つの質問で、今どこにいて何が足りないかがわかります。', time: '2分' },
              { step: '3', title: '始める', desc: 'あなたの薬局に合った進め方とタスクが表示されます。', time: '' },
            ].map((s) => (
              <div key={s.step} className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                <p className="mb-2 text-2xl font-bold text-blue-300">{s.step}</p>
                <h3 className="font-bold text-gray-900">{s.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{s.desc}</p>
                {s.time && <p className="mt-2 text-xs text-gray-400">約{s.time}</p>}
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setState('commitment')}
              className="rounded-full bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              はじめる →
            </button>
          </div>
        </section>
      </div>
    )
  }

  // ========== コース選択 ==========
  if (state === 'commitment') {
    const allAnswered = commitmentQuestions.every((q) => commitmentAnswers[q.id])
    return (
      <div className="space-y-6">
        <header className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-lg">
          <div className="mb-2 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold">1</span>
            <span className="text-sm text-blue-200">ステップ 1 / 3</span>
          </div>
          <h1 className="text-xl font-bold">コースを選ぶ</h1>
          <p className="mt-1 text-sm text-blue-100">在宅をどのくらいの規模で考えていますか？</p>
        </header>

        <section className="space-y-4">
          {commitmentQuestions.map((question, qIndex) => (
            <div key={question.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="mb-1 text-xs text-gray-500">質問 {qIndex + 1}</p>
              <h2 className="mb-4 font-bold text-gray-900">{question.question}</h2>
              <div className="space-y-2">
                {question.options.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setCommitmentAnswers((prev) => ({ ...prev, [question.id]: option.level }))}
                    className={cn(
                      'w-full rounded-xl border p-4 text-left transition',
                      commitmentAnswers[question.id] === option.level
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    )}
                  >
                    <span className="font-medium text-gray-900">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>

        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => setState('welcome')}
            className="rounded-full border border-gray-300 bg-white px-6 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50"
          >
            戻る
          </button>
          <button
            type="button"
            disabled={!allAnswered}
            onClick={() => {
              const level = determineCommitment()
              setCommitment(level)
              setState('assessment')
            }}
            className={cn(
              'rounded-full px-8 py-3 font-semibold text-white transition',
              allAnswered ? 'bg-blue-600 hover:bg-blue-700' : 'cursor-not-allowed bg-gray-300'
            )}
          >
            次へ →
          </button>
        </div>
      </div>
    )
  }

  // ========== 6軸診断 ==========
  if (state === 'assessment') {
    return (
      <div className="space-y-6">
        <header className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-lg">
          <div className="mb-2 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold">2</span>
            <span className="text-sm text-blue-200">ステップ 2 / 3</span>
          </div>
          <h1 className="text-xl font-bold">現在地を知る</h1>
          <p className="mt-1 text-sm text-blue-100">6つの質問に答えて、今の状況を確認しましょう。</p>
          {commitment && (
            <div className="mt-3">
              <Pill tone={commitment === 'full' ? 'good' : commitment === 'moderate' ? 'warn' : 'info'}>
                {getCommitmentLabel(commitment)}
              </Pill>
            </div>
          )}
        </header>

        <section className="space-y-4">
          {assessmentQuestions.map((question, qIndex) => {
            const selectedIndex = assessmentAnswers[question.id]
            return (
              <div key={question.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-3">
                  <p className="text-xs text-gray-500">質問 {qIndex + 1} / 6 — {question.category}</p>
                </div>
                <h2 className="mb-4 font-bold text-gray-900">{question.question}</h2>
                <details className="mb-3">
                  <summary className="cursor-pointer text-sm text-blue-600 hover:underline">ヒント</summary>
                  <p className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">{question.help}</p>
                </details>
                <div className="space-y-2">
                  {question.options.map((option, optIndex) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => setAssessmentAnswers((prev) => ({ ...prev, [question.id]: optIndex }))}
                      className={cn(
                        'w-full rounded-xl border p-4 text-left transition',
                        selectedIndex === optIndex
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-blue-300'
                      )}
                    >
                      <span className="font-medium text-gray-900">{option.label}</span>
                      {selectedIndex === optIndex && (
                        <p className="mt-1 text-sm text-gray-600">{option.detail}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </section>

        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => setState('commitment')}
            className="rounded-full border border-gray-300 bg-white px-6 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50"
          >
            戻る
          </button>
          <button
            type="button"
            onClick={() => setState('dashboard')}
            className="rounded-full bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            結果を見る →
          </button>
        </div>
      </div>
    )
  }

  // ========== ダッシュボード ==========
  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <header className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-lg">
        <p className="mb-1 text-xs font-medium text-blue-200">MAKASETE</p>
        <h1 className="text-xl font-bold">導入ダッシュボード</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Pill tone={phaseInfo.tone}>{currentPhase.icon} {currentPhase.shortLabel}</Pill>
          <Pill tone={resolvedCommitment === 'full' ? 'good' : resolvedCommitment === 'moderate' ? 'warn' : 'info'}>
            {getCommitmentLabel(resolvedCommitment)}
          </Pill>
        </div>
      </header>

      {/* 現在地 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-bold text-gray-900">あなたの薬局の現在地</h2>
        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
              <p className="mb-1 text-xs text-gray-500">現在のフェーズ</p>
              <p className="text-lg font-bold text-gray-900">{currentPhase.icon} {currentPhase.title}</p>
              <p className="mt-1 text-sm text-gray-600">{currentPhase.summary}</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4">
              <p className="mb-1 text-xs text-gray-500">いちばん先に整えるポイント</p>
              <p className="font-bold text-gray-900">{topGap.subject}</p>
              <p className="text-sm text-gray-600">スコア {topGap.score.toFixed(1)} / 5</p>
            </div>
          </div>
          <div>
            <OnboardingRadarChart data={axisScores} compact />
          </div>
        </div>

        {/* 進捗バー */}
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-gray-500">導入進捗</span>
            <span className="font-bold text-blue-600">{readiness}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
              style={{ width: `${readiness}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-400">
            <span>開始</span>
            <span>初回受入 🎉</span>
            <span>夜間対応</span>
          </div>
        </div>
      </section>

      {/* 次にやること */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 font-bold text-gray-900">次にやること</h2>
        <p className="mb-4 text-sm text-gray-500">
          進め方: オーナー方針決定 → スタッフ教育 → 体制構築 → 営業・獲得
        </p>
        <div className="mb-4 space-y-3">
          {activeTasks.map((task, i) => (
            <Link
              key={task.id}
              href={`/onboarding/tasks/${task.id}`}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:border-blue-300"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">{task.title}</p>
                <p className="text-sm text-gray-500">{task.owner} · {task.due}</p>
              </div>
              <Pill tone={task.status === '進行中' ? 'warn' : 'info'}>{task.status}</Pill>
            </Link>
          ))}
        </div>
        <Link href="/onboarding/tasks" className="text-sm text-blue-600 hover:underline">
          すべてのタスクを見る →
        </Link>
      </section>

      {/* クイックアクセス */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: '🩺', label: '再診断', desc: '状況が変わったら', href: '/onboarding/assessment' },
          { icon: '📚', label: '教材', desc: '動画・テンプレート', href: '/onboarding/learning' },
          { icon: '⚠️', label: 'つまずきポイント', desc: 'よくある問題', href: '/onboarding/stumbling' },
          { icon: '🗺️', label: 'ロードマップ', desc: '全体の進め方', href: '/onboarding/roadmap' },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <span className="text-2xl">{item.icon}</span>
            <p className="mt-2 font-bold text-gray-900">{item.label}</p>
            <p className="text-sm text-gray-500">{item.desc}</p>
          </Link>
        ))}
      </section>

      {/* 次の目標 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-bold text-gray-900">次の目標</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="mb-1 text-xs text-gray-500">今ここ</p>
            <p className="font-bold text-gray-900">{currentPhase.icon} {currentPhase.title}</p>
            <p className="mt-2 text-xs text-gray-500">達成条件: {currentPhase.gate}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="mb-1 text-xs text-gray-500">次のゴール</p>
            <p className="font-bold text-gray-900">{nextPhase.icon} {nextPhase.title}</p>
            <p className="mt-2 text-xs text-gray-500">達成条件: {nextPhase.gate}</p>
          </div>
        </div>
      </section>

      {/* 夜間対応オプション（Phase 3以上のみ） */}
      {phaseInfo.phaseId >= 3 && (
        <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="text-3xl">🌙</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-gray-900">夜間対応オプション</h2>
                <Pill tone="info">有料</Pill>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                24時間365日対応で患者紹介を増やしたい場合はご検討ください。
              </p>
              <Link
                href="/onboarding/night-support"
                className="mt-3 inline-flex rounded-full border border-indigo-300 bg-white px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50"
              >
                詳しく見る
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 困ったとき */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">困ったとき</h2>
            <p className="text-sm text-gray-500">伴走担当に相談できます</p>
          </div>
          <Link
            href="/onboarding/support"
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            相談する
          </Link>
        </div>
      </section>

      {/* ナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg justify-around py-2">
          <Link href="/onboarding" className="flex flex-col items-center px-3 py-1 text-blue-600">
            <span className="text-lg">🏠</span>
            <span className="text-xs font-medium">ホーム</span>
          </Link>
          <Link href="/onboarding/tasks" className="flex flex-col items-center px-3 py-1 text-gray-500">
            <span className="text-lg">✅</span>
            <span className="text-xs font-medium">タスク</span>
          </Link>
          <Link href="/onboarding/learning" className="flex flex-col items-center px-3 py-1 text-gray-500">
            <span className="text-lg">📚</span>
            <span className="text-xs font-medium">教材</span>
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
