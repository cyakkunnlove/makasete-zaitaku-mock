'use client'

import { use } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { tasks, learningItems, getTaskTone } from '@/lib/onboarding'
import { Button } from '@/components/ui/button'
import { Pill } from '@/components/onboarding'

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>
}) {
  const { taskId } = use(params)
  const task = tasks.find((t) => t.id === taskId)

  if (!task) {
    notFound()
  }

  const learning = learningItems.find((l) => l.id === task.relatedContentId)

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">タスク詳細</h1>
          <Pill tone={getTaskTone(task.status)}>{task.status}</Pill>
        </div>
        <p className="text-sm text-gray-600">
          作業内容・詰まりやすい点・次の一歩を分けて確認できます。
        </p>

        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900">{task.title}</h2>
            <p className="mt-1 text-sm text-gray-600">{task.note}</p>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900">担当 / 期限 / 成果物</h3>
            <p className="mt-1 text-sm text-gray-600">
              {task.owner} / {task.due} / {task.deliverable}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900">伴走コメント</h3>
            <p className="mt-1 text-sm text-gray-600">{task.review}</p>
          </div>

          <div className="rounded-lg bg-blue-50 p-4">
            <h3 className="font-medium text-gray-900">次アクション</h3>
            <p className="mt-1 text-sm text-gray-700">{task.nextAction}</p>
            <p className="mt-2 text-xs text-gray-500">
              完了の目安: {task.successMetric}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/onboarding/tasks">
              <Button variant="outline">一覧へ戻る</Button>
            </Link>
            {learning && (
              <Link href={`/onboarding/learning/${learning.id}`}>
                <Button>関連教材を見る</Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
