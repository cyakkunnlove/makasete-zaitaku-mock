'use client'

import { useMemo } from 'react'
import {
  tasks,
  defaultAnswers,
  calculateAxisScores,
  calculateReadiness,
  getPhaseInfo,
  getPhaseById,
} from '@/lib/onboarding'
import { Pill, TaskCard, StepDigest } from '@/components/onboarding'

export default function TasksPage() {
  const axisScores = useMemo(() => calculateAxisScores(defaultAnswers), [])
  const readiness = useMemo(() => calculateReadiness(axisScores), [axisScores])
  const phaseInfo = useMemo(() => getPhaseInfo(readiness), [readiness])
  const currentPhase = useMemo(() => getPhaseById(phaseInfo.phaseId), [phaseInfo.phaseId])

  const focusTasks = tasks.filter((task) => task.status !== '完了').slice(0, 3)

  return (
    <div className="space-y-6">
      {/* ステップガイド */}
      <StepDigest
        currentStep={4}
        totalSteps={6}
        activeLabel="今週やること"
        activeLead="次回会議までに終えるものを絞る"
        nextLabel="教材"
        nextLead="まず見る / まず作る / 次の会議まで"
      />

      {/* メイン */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">今週やること</h1>
            <p className="text-sm text-gray-600">
              次回会議までに、この薬局で進める作業だけを前に出しています。
            </p>
          </div>
          <Pill tone="warn">次に進む条件: {currentPhase.shortLabel}</Pill>
        </div>

        {/* 優先パネル */}
        <div className="mt-4 rounded-lg bg-amber-50 p-4">
          <p className="text-xs text-gray-500">まずこの順で進める</p>
          {focusTasks.map((task) => (
            <div
              key={task.id}
              className="mt-2 flex items-center justify-between text-sm"
            >
              <span className="font-medium text-gray-900">{task.title}</span>
              <span className="text-gray-500">
                {task.owner} / {task.due}
              </span>
            </div>
          ))}
        </div>

        {/* タスク一覧 */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </section>
    </div>
  )
}
