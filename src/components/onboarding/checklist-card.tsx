'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { ChecklistItem } from '@/lib/onboarding'
import { Pill } from './pill'

interface ChecklistCardProps {
  item: ChecklistItem
  index: number
  className?: string
}

export function ChecklistCard({ item, index, className }: ChecklistCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-xl border p-4',
        item.done
          ? 'border-emerald-200 bg-emerald-50/50'
          : 'border-gray-200 bg-white',
        className
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
          item.done
            ? 'bg-emerald-500 text-white'
            : 'bg-gray-100 text-gray-600'
        )}
      >
        {index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="font-semibold text-gray-900">{item.title}</span>
          <Pill tone={item.done ? 'good' : 'info'}>
            {item.done ? '済' : 'これから'}
          </Pill>
        </div>
        <p className="text-sm text-gray-600">{item.description}</p>
      </div>
      <Link
        href={item.link}
        className="shrink-0 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        {item.linkLabel}
      </Link>
    </div>
  )
}
