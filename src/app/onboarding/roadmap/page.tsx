'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import {
  roadmapByCommitment,
  phaseOrder,
  type CommitmentLevel,
  getRoadmapByCommitment,
  getCommitmentLabel,
} from '@/lib/onboarding'
import { Pill, PhaseCard } from '@/components/onboarding'

function RoadmapContent() {
  const searchParams = useSearchParams()
  const commitmentParam = searchParams.get('commitment') as CommitmentLevel | null
  const commitment = commitmentParam ?? 'moderate'
  const roadmap = getRoadmapByCommitment(commitment)
  const targetPhases = phaseOrder.filter((p) => p.id <= roadmap.targetPhase)

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <header className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">ロードマップ</h1>
            <p className="text-sm text-gray-600">
              本気度に応じた進め方を確認できます。
            </p>
          </div>
          <Pill tone={commitment === 'full' ? 'good' : commitment === 'moderate' ? 'warn' : 'info'}>
            {getCommitmentLabel(commitment)}
          </Pill>
        </div>
      </header>

      {/* コース切り替え */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-bold text-gray-900">コースを選択</h2>
        <div className="flex flex-wrap gap-2">
          {roadmapByCommitment.map((r) => (
            <Link
              key={r.level}
              href={`/onboarding/roadmap?commitment=${r.level}`}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                commitment === r.level
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </section>

      {/* 選択中のロードマップ */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
          <h2 className="mb-2 text-lg font-bold text-gray-900">{roadmap.label}</h2>
          <p className="mb-4 text-sm text-gray-600">{roadmap.description}</p>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">このコースの特徴:</p>
            <ul className="space-y-1 text-sm text-gray-600">
              {roadmap.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="text-blue-500">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-500">夜間対応:</span>
            <Pill tone={roadmap.nightSupport ? 'good' : 'info'}>
              {roadmap.nightSupport ? '必要' : '不要'}
            </Pill>
          </div>
        </div>
      </section>

      {/* フェーズ一覧（このコースで到達するフェーズまで） */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-bold text-gray-900">
          目標: {phaseOrder[roadmap.targetPhase].label} まで
        </h2>
        <div className="space-y-4">
          {targetPhases.map((phase) => (
            <PhaseCard
              key={phase.key}
              phase={phase}
              status={phase.id === roadmap.targetPhase ? 'current' : 'upcoming'}
            />
          ))}
        </div>
      </section>

      {/* アドバイス */}
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <h2 className="mb-3 font-bold text-gray-900">💡 アドバイス</h2>
        {commitment === 'basic' && (
          <p className="text-sm text-gray-700">
            地域支援体制加算を取得することを最初の目標にしましょう。
            夜間対応は必須ではありませんが、患者紹介を増やすには将来的に検討が必要です。
          </p>
        )}
        {commitment === 'moderate' && (
          <p className="text-sm text-gray-700">
            10-30件程度を安定して運用できる体制を作りましょう。
            クリーンベンチやポンプの設備投資も検討し、対応できる患者の幅を広げていきます。
          </p>
        )}
        {commitment === 'full' && (
          <p className="text-sm text-gray-700">
            24時間365日対応しないと患者紹介が来ないので、獲得するうえではマストです。
            設備投資、教育、夜間体制すべてを整えて、断らない薬局を目指します。
          </p>
        )}
      </section>

      {/* ボタン */}
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href={`/onboarding/tasks?commitment=${commitment}`}
          className="rounded-full bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700"
        >
          今週やることを見る
        </Link>
        <Link
          href={`/onboarding/learning?commitment=${commitment}`}
          className="rounded-full border border-gray-300 bg-white px-6 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          教材を見る
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
          <Link href="/onboarding/support" className="flex flex-col items-center px-3 py-1 text-gray-500">
            <span className="text-lg">💬</span>
            <span className="text-xs font-medium">相談</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}

export default function RoadmapPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">読み込み中...</div>}>
      <RoadmapContent />
    </Suspense>
  )
}
