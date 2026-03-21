'use client'

import { useMemo } from 'react'
import {
  phaseOrder,
  defaultAnswers,
  calculateAxisScores,
  calculateReadiness,
  getPhaseInfo,
  getPhaseById,
} from '@/lib/onboarding'
import { Pill, PhaseCard } from '@/components/onboarding'

export default function PhaseMapPage() {
  const axisScores = useMemo(() => calculateAxisScores(defaultAnswers), [])
  const readiness = useMemo(() => calculateReadiness(axisScores), [axisScores])
  const phaseInfo = useMemo(() => getPhaseInfo(readiness), [readiness])
  const currentPhase = useMemo(() => getPhaseById(phaseInfo.phaseId), [phaseInfo.phaseId])
  const nextPhase = useMemo(
    () => getPhaseById(Math.min(phaseInfo.phaseId + 1, phaseOrder.length - 1)),
    [phaseInfo.phaseId]
  )

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">全体像</h1>
            <p className="text-sm text-gray-600">
              最初から全面には出さず、必要なときにだけ確認できる位置に置いています。
            </p>
          </div>
          <Pill tone={phaseInfo.tone}>現在 {currentPhase.shortLabel}</Pill>
        </div>

        {/* 今と次のフォーカス */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-xs text-gray-500">今</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {currentPhase.icon} {currentPhase.label}
            </p>
            <p className="text-sm text-gray-600">{currentPhase.summary}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">次</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {phaseInfo.phaseId >= 5
                ? '🌙 夜間接続判断'
                : `${nextPhase.icon} ${nextPhase.label}`}
            </p>
            <p className="text-sm text-gray-600">
              {phaseInfo.phaseId >= 5
                ? '夜間支援に進むか判断する段階です。'
                : nextPhase.summary}
            </p>
          </div>
        </div>

        {/* フェーズ一覧 */}
        <div className="mt-6 space-y-3">
          {phaseOrder.map((phase) => {
            const status =
              phase.id === phaseInfo.phaseId
                ? 'current'
                : phase.id < phaseInfo.phaseId
                ? 'done'
                : 'upcoming'

            return <PhaseCard key={phase.key} phase={phase} status={status} />
          })}
        </div>
      </section>
    </div>
  )
}
