'use client'

import Link from 'next/link'
import {
  storeProfile,
  checklistItems,
  supportItems,
  learningItems,
  tasks,
  defaultAnswers,
  calculateAxisScores,
  calculateReadiness,
  getPhaseInfo,
} from '@/lib/onboarding'
import {
  Pill,
  SupportCard,
} from '@/components/onboarding'

export default function OnboardingHomePage() {
  const axisScores = calculateAxisScores(defaultAnswers)
  const readiness = calculateReadiness(axisScores)
  const phaseInfo = getPhaseInfo(readiness)
  const mustDoTasks = tasks.filter((task) => task.status !== '完了').slice(0, 2)
  const firstLearning = learningItems[0]

  const quickStartSteps = [
    {
      icon: '🩺',
      label: '3分診断',
      title: 'いまの詰まりをつかむ',
      body: '5問だけでOK',
      link: '/onboarding/assessment',
      cta: '診断する',
    },
    {
      icon: '📍',
      label: '現在地',
      title: 'どの段階か見る',
      body: '次の1歩がわかる',
      link: '/onboarding/result',
      cta: '現在地を見る',
    },
    {
      icon: '✅',
      label: '今週の1件',
      title: '最初にやることを決める',
      body: '会議前の優先を絞る',
      link: '/onboarding/tasks',
      cta: '今週を見る',
    },
  ]

  return (
    <div className="space-y-6">
      {/* ヒーロー */}
      <header className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-lg">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-200">
          任せて在宅 / 新規薬局オンボーディング
        </p>
        <h1 className="mb-2 text-2xl font-bold">
          {storeProfile.name} のスタート画面
        </h1>
        <p className="mb-4 text-sm text-blue-100">
          読む前に動けるように、最初の3ステップだけ前に出しています。
        </p>
        <div className="flex flex-wrap gap-2">
          <Pill tone="good">⏱ {storeProfile.firstActionTime}で現在地がわかる</Pill>
          <Pill tone="info">📍 {phaseInfo.label}</Pill>
        </div>
      </header>

      {/* クイックスタート */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
          最初の3ステップ
        </p>
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          まずはここから始める
        </h2>
        <p className="mb-6 text-sm text-gray-600">
          {storeProfile.firstActionTime}で、この薬局の現在地と次の動きが見えます。
        </p>
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {quickStartSteps.map((step, index) => (
            <Link
              key={step.label}
              href={step.link}
              className="group rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-2xl">{step.icon}</span>
                <Pill tone={index === 0 ? 'good' : 'info'}>STEP {index + 1}</Pill>
              </div>
              <p className="mb-1 text-xs text-gray-500">{step.label}</p>
              <p className="mb-1 font-bold text-gray-900">{step.title}</p>
              <p className="mb-3 text-sm text-gray-600">{step.body}</p>
              <span className="text-sm font-semibold text-blue-600 group-hover:underline">
                {step.cta} →
              </span>
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/onboarding/assessment"
            className="rounded-full bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700"
          >
            3分ではじめる
          </Link>
          <Link
            href="/onboarding/tasks"
            className="rounded-full border border-gray-300 bg-white px-6 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            今週の1件を見る
          </Link>
        </div>
      </section>

      {/* 最初に見るカード */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-bold text-gray-900">最初に見るカード</h2>
        <p className="mb-4 text-sm text-gray-600">
          読む量を減らして、必要なものだけ前に出しています。
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-blue-50 p-4">
            <p className="mb-1 text-xs text-gray-500">いまの段階</p>
            <p className="font-bold text-gray-900">{phaseInfo.label}</p>
            <p className="text-sm text-gray-600">{phaseInfo.summary}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="mb-1 text-xs text-gray-500">今週の優先</p>
            <p className="font-bold text-gray-900">{mustDoTasks[0]?.title}</p>
            <p className="text-sm text-gray-600">{mustDoTasks[0]?.nextAction}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="mb-1 text-xs text-gray-500">まず見る教材</p>
            <p className="font-bold text-gray-900">{firstLearning.title}</p>
            <p className="text-sm text-gray-600">{firstLearning.duration}で要点だけ確認</p>
          </div>
        </div>
      </section>

      {/* やること一覧 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-bold text-gray-900">やること一覧</h2>
        <p className="mb-4 text-sm text-gray-600">
          長い説明を減らし、1画面で判断しやすくしました。
        </p>
        <div className="space-y-3">
          {checklistItems.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-center gap-4 rounded-xl border p-4 ${
                item.done
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                {index + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <Pill tone={item.done ? 'good' : 'info'}>
                    {item.done ? '済' : 'これから'}
                  </Pill>
                </div>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
              <Link
                href={item.link}
                className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                {item.linkLabel}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 困ったとき */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-bold text-gray-900">困ったとき</h2>
        <p className="mb-4 text-sm text-gray-600">
          必要なときだけ開ける相談導線です。
        </p>
        <div className="mb-4 grid gap-4 md:grid-cols-3">
          {supportItems.map((item) => (
            <SupportCard key={item.id} item={item} />
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/onboarding/support"
            className="rounded-full bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700"
          >
            相談画面へ進む
          </Link>
          <Link
            href="/onboarding/phase-map"
            className="rounded-full border border-gray-300 bg-white px-6 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            全体像はあとで見る
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
