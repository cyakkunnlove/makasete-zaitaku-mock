'use client'

import { use } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { learningItems, tasks } from '@/lib/onboarding'
import { Button } from '@/components/ui/button'
import { Pill } from '@/components/onboarding'

export default function LearningDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const learning = learningItems.find((l) => l.id === id)

  if (!learning) {
    notFound()
  }

  const task = tasks.find((t) => t.id === learning.linkedTaskId)

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">教材詳細</h1>
        <p className="text-sm text-gray-600">
          教材の内容と、この薬局の作業でどこに効くかを続けて確認できます。
        </p>

        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-gray-200 p-4">
            <Pill tone="info">{learning.type}</Pill>
            <h2 className="mt-2 text-lg font-semibold text-gray-900">
              {learning.title}
            </h2>
            <p className="mt-1 text-sm text-gray-600">{learning.description}</p>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900">{learning.previewTitle}</h3>
            <p className="text-xs text-gray-500">{learning.previewMeta}</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {learning.previewLines.map((line) => (
                <li key={line}>• {line}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900">この教材で目指す状態</h3>
            <p className="mt-1 text-sm text-gray-600">{learning.outcome}</p>
          </div>

          {task && (
            <div className="rounded-lg bg-blue-50 p-4">
              <h3 className="font-medium text-gray-900">関連タスク</h3>
              <p className="mt-1 text-sm text-gray-700">{task.title}</p>
              <p className="text-xs text-gray-500">
                次アクション: {task.nextAction}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Link href="/onboarding/learning">
              <Button variant="outline">教材一覧へ戻る</Button>
            </Link>
            {task && (
              <Link href={`/onboarding/tasks/${task.id}`}>
                <Button>関連タスクを見る</Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
