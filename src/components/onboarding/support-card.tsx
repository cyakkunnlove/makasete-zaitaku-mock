'use client'

import { cn } from '@/lib/utils'
import type { SupportItem } from '@/lib/onboarding'

interface SupportCardProps {
  item: SupportItem
  className?: string
}

export function SupportCard({ item, className }: SupportCardProps) {
  return (
    <article
      className={cn(
        'rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm',
        className
      )}
    >
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {item.title}
      </p>
      <h3 className="mb-2 text-base font-bold text-gray-900">{item.action}</h3>
      <p className="text-sm leading-relaxed text-gray-600">{item.description}</p>
    </article>
  )
}
