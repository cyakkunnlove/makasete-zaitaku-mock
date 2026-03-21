'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Pill } from './pill'

interface StepDigestProps {
  currentStep: number
  totalSteps: number
  activeLabel?: string
  activeLead?: string
  nextLabel?: string
  nextLead?: string
  className?: string
}

export function StepDigest({
  currentStep,
  totalSteps,
  activeLabel,
  activeLead,
  nextLabel,
  nextLead,
  className,
}: StepDigestProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-4 shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">
            使い始めガイド
          </p>
          <p className="font-semibold text-gray-900">
            今やることと次だけ見える導線
          </p>
        </div>
        <Pill tone="info">
          STEP {currentStep} / {totalSteps}
        </Pill>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-gray-500">今見ている画面</p>
          <p className="font-semibold text-gray-900">{activeLabel ?? '詳細画面'}</p>
          <p className="mt-0.5 text-xs text-gray-600">
            {activeLead ?? '今必要な内容に集中'}
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">次にやること</p>
          <p className="font-semibold text-gray-900">
            {nextLabel ?? '完了 / 最終確認'}
          </p>
          <p className="mt-0.5 text-xs text-gray-600">
            {nextLead ?? '必要なタイミングで次に進む'}
          </p>
        </div>

        <Link
          href="/onboarding/phase-map"
          className="rounded-lg border border-gray-200 bg-white p-3 transition hover:border-blue-300 hover:bg-blue-50/50"
        >
          <p className="text-xs text-gray-500">必要なときだけ見る</p>
          <p className="font-semibold text-gray-900">全体像を確認する</p>
          <p className="mt-0.5 text-xs text-gray-600">
            いま / 次 / その先だけ把握できます
          </p>
        </Link>
      </div>
    </section>
  )
}
