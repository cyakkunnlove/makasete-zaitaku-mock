'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { OnboardingAssessmentRecord } from '@/lib/onboarding-history'
import type { DiagnosticEvaluation } from '@/types/onboarding'

function decisionLabel(decision: DiagnosticEvaluation['decision']) {
  if (decision === 'GO') return '受入準備OK'
  if (decision === 'NOT_YET') return '要整備'
  return '要方針見直し'
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

export function OnboardingHistoryPanel({
  current,
  history,
}: {
  current: OnboardingAssessmentRecord | null
  history: OnboardingAssessmentRecord[]
}) {
  const previous = history[0] ?? null

  return (
    <Card className="border-[#2a3553] bg-[#1a2035]">
      <CardHeader>
        <CardTitle className="text-white">診断履歴（モック保存）</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {current ? (
          <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">最新保存結果</p>
                <p className="text-xs text-gray-500">{formatDate(current.createdAt)} / {current.pharmacyName}</p>
              </div>
              <Badge variant="outline" className="border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
                {decisionLabel(current.evaluation.decision)}
              </Badge>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">まだ保存された診断はありません。</p>
        )}

        {previous ? (
          <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-4">
            <p className="text-sm font-medium text-white">直前の診断との比較</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <div className="rounded-md border border-[#2a3553] bg-[#0a0e1a] p-3">
                <p className="text-xs text-gray-500">前回判定</p>
                <p className="mt-1 text-sm text-white">{decisionLabel(previous.evaluation.decision)}</p>
              </div>
              <div className="rounded-md border border-[#2a3553] bg-[#0a0e1a] p-3">
                <p className="text-xs text-gray-500">今回判定</p>
                <p className="mt-1 text-sm text-white">{current ? decisionLabel(current.evaluation.decision) : '未保存'}</p>
              </div>
            </div>
            {current ? (
              <div className="mt-3 space-y-2 text-sm text-gray-300">
                {(['A', 'B', 'C', 'D', 'E', 'F'] as const).map((axis) => {
                  const before = previous.evaluation.axisScores[axis]
                  const after = current.evaluation.axisScores[axis]
                  const diff = Math.round((after - before) * 10) / 10
                  return (
                    <div key={axis} className="flex items-center justify-between rounded-md border border-[#2a3553] bg-[#0a0e1a] px-3 py-2">
                      <span>軸 {axis}</span>
                      <span className={diff >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                        {before.toFixed(1)} → {after.toFixed(1)} ({diff >= 0 ? '+' : ''}{diff.toFixed(1)})
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        {history.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-white">保存履歴一覧</p>
            {history.map((item) => (
              <div key={item.id} className="rounded-lg border border-[#2a3553] bg-[#11182c] px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-white">{item.pharmacyName}</p>
                    <p className="text-xs text-gray-500">{formatDate(item.createdAt)}</p>
                  </div>
                  <Badge variant="outline" className="border-[#334155] bg-[#0a0e1a] text-gray-300">
                    {decisionLabel(item.evaluation.decision)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
