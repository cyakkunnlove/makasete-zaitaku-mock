'use client'

import { cn } from '@/lib/utils'
import type { PhaseMeta } from '@/lib/onboarding'
import { Pill } from './pill'

interface PhaseCardProps {
  phase: PhaseMeta
  status: 'current' | 'done' | 'upcoming'
  className?: string
}

export function PhaseCard({ phase, status, className }: PhaseCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-5',
        status === 'current' && 'border-blue-300 bg-blue-50',
        status === 'done' && 'border-emerald-200 bg-emerald-50/50',
        status === 'upcoming' && 'border-gray-200 bg-white',
        className
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{phase.icon}</span>
          <div>
            <p className="text-xs font-medium text-gray-500">{phase.label}</p>
            <h3 className="font-bold text-gray-900">{phase.title}</h3>
          </div>
        </div>
        <Pill
          tone={
            status === 'current'
              ? phase.tone
              : status === 'done'
                ? 'good'
                : 'info'
          }
        >
          {status === 'current'
            ? '現在地'
            : status === 'done'
              ? '通過済み'
              : 'これから'}
        </Pill>
      </div>
      <p className="mb-4 text-sm text-gray-600">{phase.summary}</p>
      <div className="grid gap-2 text-sm">
        <div>
          <span className="text-gray-500">進む条件: </span>
          <span className="font-medium text-gray-700">{phase.gate}</span>
        </div>
        <div>
          <span className="text-gray-500">成果物: </span>
          <span className="font-medium text-gray-700">{phase.milestone}</span>
        </div>
      </div>
    </div>
  )
}
