'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { LearningItem } from '@/lib/onboarding'
import { Pill } from './pill'

interface LearningCardProps {
  item: LearningItem
  className?: string
}

export function LearningCard({ item, className }: LearningCardProps) {
  return (
    <article
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-5 shadow-sm',
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <Pill tone="info">{item.type}</Pill>
        <span className="text-sm text-gray-500">{item.duration}</span>
      </div>
      <h3 className="mb-2 text-base font-bold text-gray-900">{item.title}</h3>
      <p className="mb-4 text-sm leading-relaxed text-gray-600">
        {item.description}
      </p>
      <div className="mb-4 grid gap-2 text-sm">
        <div>
          <span className="text-gray-500">対象: </span>
          <span className="font-medium text-gray-700">{item.target}</span>
        </div>
        <div>
          <span className="text-gray-500">到達: </span>
          <span className="font-medium text-gray-700">{item.outcome}</span>
        </div>
      </div>
      <div className="mb-4 rounded-lg bg-gray-50 p-3">
        <p className="mb-1 text-xs font-semibold text-gray-500">
          {item.previewTitle}
        </p>
        <ul className="space-y-1 text-sm text-gray-600">
          {item.previewLines.map((line) => (
            <li key={line} className="flex items-start gap-2">
              <span className="text-gray-400">•</span>
              {line}
            </li>
          ))}
        </ul>
      </div>
      <Link
        href={`/onboarding/learning/${item.id}`}
        className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        {item.ctaLabel}
      </Link>
    </article>
  )
}
