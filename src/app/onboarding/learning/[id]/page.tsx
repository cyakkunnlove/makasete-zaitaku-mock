'use client'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { learningItems, tasks } from '@/lib/onboarding'
import { Pill, NarcoticCalculator, CompatibilityGuide, PumpGuide, MaterialsGuide, KasanGuide, WhyZaitaku, MindsetGuide, CleanroomGuide, PreAcceptanceChecklist, ZaitakuSystemGuide } from '@/components/onboarding'

interface Props {
  params: { id: string }
}

export default function LearningDetailPage({ params }: Props) {
  const { id } = params
  const learning = learningItems.find((item) => item.id === id)

  if (!learning) {
    notFound()
  }

  const task = tasks.find((t) => t.id === learning.linkedTaskId)

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <header className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-bold text-gray-900">教材詳細</h1>
        <p className="text-sm text-gray-600">
          教材の内容と、この薬局の作業でどこに効くかを続けて確認できます。
        </p>
      </header>

      {/* 教材情報 */}
      <section className="space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-3">
            <Pill tone="info">{learning.type}</Pill>
          </div>
          <h2 className="mb-2 text-lg font-bold text-gray-900">{learning.title}</h2>
          <p className="text-sm text-gray-600">{learning.description}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-2 font-bold text-gray-900">{learning.previewTitle}</h3>
          <p className="mb-3 text-sm text-gray-500">{learning.previewMeta}</p>
          <ul className="space-y-1 text-sm text-gray-600">
            {learning.previewLines.map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-2 font-bold text-gray-900">この教材で目指す状態</h3>
          <p className="text-sm text-gray-600">{learning.outcome}</p>
        </div>

        {/* 教材別 専用コンテンツ */}
        {id === 'learning-why-zaitaku' && <WhyZaitaku />}
        {id === 'learning-mindset' && <MindsetGuide />}
        {id === 'learning-zaitaku-system' && <ZaitakuSystemGuide />}
        {id === 'learning-narcotic' && <NarcoticCalculator />}
        {id === 'learning-compatibility' && <CompatibilityGuide />}
        {id === 'learning-checklist' && <PreAcceptanceChecklist />}
        {id === 'learning-cleanroom-video' && <CleanroomGuide />}
        {id === 'learning-pump-video' && <PumpGuide />}
        {id === 'learning-materials' && <MaterialsGuide />}
        {id === 'learning-kasan' && <KasanGuide />}

        {task && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
            <h3 className="mb-2 font-bold text-gray-900">関連タスク</h3>
            <p className="mb-2 text-sm text-gray-700">{task.title}</p>
            <p className="text-xs text-gray-500">次アクション: {task.nextAction}</p>
          </div>
        )}
      </section>

      {/* ダウンロード */}
      {learning.downloadUrl && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">📥 テンプレートをダウンロード</h3>
              <p className="text-sm text-gray-600">印刷してご記入いただけます。</p>
            </div>
            <a
              href={learning.downloadUrl}
              download
              className="rounded-full bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700"
            >
              ダウンロード
            </a>
          </div>
        </section>
      )}

      {/* ボタン */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/onboarding/learning"
          className="rounded-full border border-gray-300 bg-white px-6 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          教材一覧へ戻る
        </Link>
        {task && (
          <Link
            href={`/onboarding/tasks/${task.id}`}
            className="rounded-full bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700"
          >
            関連タスクを見る
          </Link>
        )}
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
