'use client'

import { cn } from '@/lib/utils'
import type { Tone } from '@/lib/onboarding'

interface PillProps {
  children: React.ReactNode
  tone?: Tone
  className?: string
}

const toneClasses: Record<Tone, string> = {
  default: 'bg-gray-100 text-gray-700',
  good: 'bg-emerald-100 text-emerald-700',
  warn: 'bg-amber-100 text-amber-700',
  info: 'bg-blue-100 text-blue-700',
}

export function Pill({ children, tone = 'default', className }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  )
}
