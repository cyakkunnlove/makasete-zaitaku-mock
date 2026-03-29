import type { AxisKey, AxisScore, CommitmentLevel, PhaseInfo, Tone } from './types'
import { assessmentQuestions, phaseOrder, tasks, learningItems, roadmapByCommitment } from './data'

// 回答からスコアを計算（重み付け対応）
export function calculateAxisScores(answers: Record<AxisKey, number>): AxisScore[] {
  return assessmentQuestions.map((item) => {
    const selected = item.options[answers[item.id]]
    return {
      key: item.id,
      subject: item.category,
      score: selected?.score ?? 0,
      fullMark: 5,
      weight: item.weight,
    }
  })
}

// 準備率（%）を計算（重み付け）
export function calculateReadiness(axisScores: AxisScore[]): number {
  const weightedTotal = axisScores.reduce((sum, item) => sum + item.score * item.weight, 0)
  const maxWeightedTotal = axisScores.reduce((sum, item) => sum + 5 * item.weight, 0)
  return Math.round((weightedTotal / maxWeightedTotal) * 100)
}

// 準備率からフェーズ情報を取得
export function getPhaseInfo(readiness: number): PhaseInfo {
  if (readiness >= 85) return { phaseId: 5, label: 'Phase 5 / 夜間接続', summary: '24時間365日対応の準備ができている段階', tone: 'good' }
  if (readiness >= 70) return { phaseId: 4, label: 'Phase 4 / 安定運用', summary: '安定運用・標準化を進めている段階', tone: 'good' }
  if (readiness >= 55) return { phaseId: 3, label: 'Phase 3 / 初回受入', summary: '初回患者受入が可能な段階（導入成功）', tone: 'good' }
  if (readiness >= 40) return { phaseId: 2, label: 'Phase 2 / 受入準備', summary: '初回受入の準備を進めている段階', tone: 'warn' }
  if (readiness >= 25) return { phaseId: 1, label: 'Phase 1 / 方針・体制準備', summary: '方針決定と体制準備の段階', tone: 'info' }
  return { phaseId: 0, label: 'Phase 0 / 未着手', summary: '在宅導入を検討する段階', tone: 'info' }
}

// IDからフェーズを取得
export function getPhaseById(phaseId: number) {
  return phaseOrder.find((phase) => phase.id === phaseId) ?? phaseOrder[0]
}

// 最も弱い軸を取得（重み考慮）
export function getTopGap(axisScores: AxisScore[]): AxisScore {
  return [...axisScores].sort((a, b) => {
    // スコアが低く、かつ重みが高いものを優先
    const aWeightedGap = (5 - a.score) * a.weight
    const bWeightedGap = (5 - b.score) * b.weight
    return bWeightedGap - aWeightedGap
  })[0]
}

// 最も強い軸を取得
export function getTopStrength(axisScores: AxisScore[]): AxisScore {
  return [...axisScores].sort((a, b) => b.score * b.weight - a.score * a.weight)[0]
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
      weight: question.weight,
    }
  })
}

// 次のアクションを生成（田中社長の進め方に基づく）
export function getNextActions(topGap: AxisScore, commitmentLevel: CommitmentLevel): string[] {
  const actions: string[] = []
  
  // 田中社長の順序: 方針決定 → スタッフ教育 → 体制構築 → 営業・獲得
  if (topGap.key === 'vision') {
    actions.push('最優先: オーナーが在宅に取り組む方針を決定・表明する')
    actions.push('スタッフに在宅の必要性とやらないとどうなるかを説明する')
  } else if (topGap.key === 'role') {
    actions.push('最優先: 現場の在宅に対する姿勢を整える')
    actions.push('役割分担表を作成し、断らない体制を構築する')
  } else if (topGap.key === 'education') {
    actions.push('最優先: スタッフへの在宅教育を実施する')
    actions.push('在宅の必要性を感じてもらい、受入体制を作る')
  } else if (topGap.key === 'operations') {
    actions.push('最優先: 受入条件表と初回受入フローを作成する')
    actions.push('そこまでいけば営業・獲得に動ける')
  } else if (topGap.key === 'equipment') {
    actions.push('設備（クリーンベンチ・ポンプ）の導入を検討する')
    actions.push('ただし「あれば尚良し」なので、他の軸を優先してもOK')
  } else if (topGap.key === 'night') {
    actions.push('夜間対応の準備を検討する（10-20人抱えた頃に）')
    actions.push('患者情報入力体制を整備する')
  }

  // 本気度に応じた追加アドバイス
  if (commitmentLevel === 'basic') {
    actions.push('地域支援体制加算の要件を満たすことを最初の目標に')
  } else if (commitmentLevel === 'full') {
    actions.push('24時間365日対応に向けて、夜間方針も早めに検討を')
  }

  return actions
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

// 本気度に応じたタスクをフィルタ
export function getTasksByCommitment(commitmentLevel: CommitmentLevel) {
  return tasks.filter((task) => task.commitmentLevels.includes(commitmentLevel))
}

// 本気度に応じた教材をフィルタ
export function getLearningByCommitment(commitmentLevel: CommitmentLevel) {
  return learningItems.filter((item) => item.commitmentLevels.includes(commitmentLevel))
}

// 本気度に応じたロードマップを取得
export function getRoadmapByCommitment(commitmentLevel: CommitmentLevel) {
  return roadmapByCommitment.find((r) => r.level === commitmentLevel) ?? roadmapByCommitment[1]
}

// つまずきポイント教材を取得（手技・薬学・算定カテゴリ）
export function getStumblingLearning() {
  return learningItems.filter((item) => ['phase3', 'phase4'].includes(item.category))
}

// 本気度ラベルを取得
export function getCommitmentLabel(level: CommitmentLevel): string {
  switch (level) {
    case 'basic':
      return '地域支援体制加算取得コース'
    case 'moderate':
      return '中規模在宅コース'
    case 'full':
      return '本格在宅事業コース'
  }
}
