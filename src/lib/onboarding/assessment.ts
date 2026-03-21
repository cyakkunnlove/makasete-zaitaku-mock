import type { AxisKey, AxisScore, PhaseInfo, Tone } from './types'
import { assessmentQuestions, phaseOrder, tasks } from './data'

// 回答からスコアを計算
export function calculateAxisScores(answers: Record<AxisKey, number>): AxisScore[] {
  return assessmentQuestions.map((item) => {
    const selected = item.options[answers[item.id]]
    return {
      key: item.id,
      subject: item.category,
      score: selected?.score ?? 0,
      fullMark: 5,
    }
  })
}

// 準備率（%）を計算
export function calculateReadiness(axisScores: AxisScore[]): number {
  const total = axisScores.reduce((sum, item) => sum + item.score, 0)
  return Math.round((total / (axisScores.length * 5)) * 100)
}

// 準備率からフェーズ情報を取得
export function getPhaseInfo(readiness: number): PhaseInfo {
  if (readiness >= 86) return { phaseId: 5, label: 'Phase 5 / 夜間接続判定', summary: '昼間運用が整い、夜間支援への接続判断に進める段階', tone: 'good' }
  if (readiness >= 72) return { phaseId: 4, label: 'Phase 4 / 標準化', summary: '受入実績をもとに教育導線と標準資料を固める段階', tone: 'good' }
  if (readiness >= 58) return { phaseId: 3, label: 'Phase 3 / 初回受入', summary: '初回受入を回しながら標準化に入る段階', tone: 'good' }
  if (readiness >= 42) return { phaseId: 2, label: 'Phase 2 / 受入準備', summary: '初回受入の直前まで整えていく段階', tone: 'warn' }
  if (readiness >= 24) return { phaseId: 1, label: 'Phase 1 / 役割整理', summary: '方針と役割整理から着手する段階', tone: 'info' }
  return { phaseId: 0, label: 'Phase 0 / 導入前整理', summary: '導入目的と優先患者像を言葉にする段階', tone: 'info' }
}

// IDからフェーズを取得
export function getPhaseById(phaseId: number) {
  return phaseOrder.find((phase) => phase.id === phaseId) ?? phaseOrder[0]
}

// 最も弱い軸を取得
export function getTopGap(axisScores: AxisScore[]): AxisScore {
  return [...axisScores].sort((a, b) => a.score - b.score)[0]
}

// 最も強い軸を取得
export function getTopStrength(axisScores: AxisScore[]): AxisScore {
  return [...axisScores].sort((a, b) => b.score - a.score)[0]
}

// 各軸の判定理由を取得
export function getPhaseReasons(answers: Record<AxisKey, number>) {
  return assessmentQuestions.map((question) => {
    const selected = question.options[answers[question.id]]
    return {
      category: question.category,
      score: selected?.score ?? 0,
      label: selected?.label ?? '',
      detail: selected?.detail ?? '',
    }
  })
}

// 次のアクションを生成
export function getNextActions(topGap: AxisScore): string[] {
  const supportTask = tasks.find((task) => task.id === 'task-comment')
  return [
    `最優先は「${topGap.subject}」の整備です。現スコアは ${topGap.score.toFixed(1)} / 5。`,
    'まずは受入条件表と初回受入フローのどちらか1つを先に下書きする。',
    supportTask
      ? `作り始めたら早めに伴走依頼を出し、${supportTask.nextAction}`
      : '作業途中でも伴走担当へ共有して方向性をそろえる。',
  ]
}

// タスクステータスからトーンを取得
export function getTaskTone(status: '未着手' | '進行中' | '完了'): Tone {
  if (status === '完了') return 'good'
  if (status === '進行中') return 'warn'
  return 'info'
}

// 汎用ステータスからトーンを取得
export function getStatusTone(status: string): Tone {
  if (status === '完了') return 'good'
  if (status === '進行中' || status === '重点支援') return 'warn'
  return 'info'
}
