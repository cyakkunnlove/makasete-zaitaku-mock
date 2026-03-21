'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { TaskItem } from '@/lib/onboarding'
import { getTaskTone } from '@/lib/onboarding'
import { Pill } from './pill'

interface TaskCardProps {
  task: TaskItem
  className?: string
}

export function TaskCard({ task, className }: TaskCardProps) {
  return (
    <article
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-5 shadow-sm',
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <Pill tone={getTaskTone(task.status)}>{task.status}</Pill>
        <span className="text-sm text-gray-500">
          {task.owner} / {task.due}
        </span>
      </div>
      <h3 className="mb-2 text-base font-bold text-gray-900">{task.title}</h3>
      <p className="mb-4 text-sm leading-relaxed text-gray-600">{task.note}</p>
      <div className="mb-4 grid gap-2 text-sm">
        <div>
          <span className="text-gray-500">成果物: </span>
          <span className="font-medium text-gray-700">{task.deliverable}</span>
        </div>
        <div>
          <span className="text-gray-500">次アクション: </span>
          <span className="font-medium text-gray-700">{task.nextAction}</span>
        </div>
      </div>
      <Link
        href={`/onboarding/tasks/${task.id}`}
        className="inline-flex w-full items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
      >
        詳細を見る
      </Link>
    </article>
  )
}
