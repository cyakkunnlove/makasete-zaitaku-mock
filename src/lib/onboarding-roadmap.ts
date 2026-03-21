import type { DiagnosticEvaluation, OnboardingPharmacyType } from '@/types/onboarding'

export interface RoadmapTask {
  id: string
  phase: 'now' | 'next' | 'later'
  title: string
  description: string
  tags?: string[]
}

const BASE_ROADMAP: Record<OnboardingPharmacyType, RoadmapTask[]> = {
  LIGHT: [
    { id: 'light-1', phase: 'now', title: 'オーナー方針を確定する', description: '地域支援体制加算レベルで何を達成するかを決める', tags: ['方針'] },
    { id: 'light-2', phase: 'now', title: '役割分担と受入条件を整理する', description: '営業・受入・請求の最低限の役割と受入基準を決める', tags: ['体制'] },
    { id: 'light-3', phase: 'next', title: '初期教育を実施する', description: '在宅の必要性・基本フローを現場に共有する', tags: ['教育'] },
    { id: 'light-4', phase: 'next', title: '初回受入前チェックリストを運用する', description: '初回案件で事故を防ぐための確認手順を固める', tags: ['運用'] },
    { id: 'light-5', phase: 'later', title: '夜間接続条件を検討する', description: '必要時のみ夜間支援へ接続できる状態を作る', tags: ['夜間'] },
  ],
  MID: [
    { id: 'mid-1', phase: 'now', title: '推進責任者とコアメンバーを固定する', description: '中規模運用を担う中心メンバーを明確化する', tags: ['体制'] },
    { id: 'mid-2', phase: 'now', title: '受入条件・連携フローを標準化する', description: '紹介受領から初回受入までの流れを共通化する', tags: ['運用'] },
    { id: 'mid-3', phase: 'next', title: '教育導線とチェックリストを整備する', description: '再現性のある立ち上げ手順を作る', tags: ['教育'] },
    { id: 'mid-4', phase: 'next', title: '夜間引継ぎ情報の運用を始める', description: '患者情報更新ルールを定着させる', tags: ['夜間'] },
    { id: 'mid-5', phase: 'later', title: 'KPI/KDIを用いた安定運用に移行する', description: '患者数拡大に耐える運営管理を導入する', tags: ['KPI'] },
  ],
  FULL: [
    { id: 'full-1', phase: 'now', title: '24時間365日対応前提で方針を確定する', description: '本格導入を前提に、夜間対応の位置づけを明文化する', tags: ['方針', '夜間'] },
    { id: 'full-2', phase: 'now', title: '無菌・ポンプ・体制の三点を優先整備する', description: '本格在宅に必要な設備・教育・担当を固める', tags: ['設備', '教育'] },
    { id: 'full-3', phase: 'next', title: '初回受入フローと夜間引継ぎを同時実装する', description: '受入と夜間接続を分断せず立ち上げる', tags: ['運用', '夜間'] },
    { id: 'full-4', phase: 'next', title: '現場教育を役割別に標準化する', description: '責任者・薬剤師・事務それぞれの教育導線を分ける', tags: ['教育'] },
    { id: 'full-5', phase: 'later', title: '拡張・多店舗展開に備えた標準化を進める', description: '他店舗でも再利用できる形に落とす', tags: ['拡張'] },
  ],
}

const UNMET_TASK_MAP: Record<string, RoadmapTask> = {
  A1: { id: 'fix-a1', phase: 'now', title: 'オーナー意思を確定する', description: '導入意思が曖昧なままでは前に進めないため、まず意思決定を完了する' },
  A4: { id: 'fix-a4', phase: 'now', title: '投資許容度を整理する', description: '教育・設備・運用にどこまで投資するかを決める' },
  B1: { id: 'fix-b1', phase: 'now', title: '実行責任者を決める', description: 'プロジェクトのオーナーを一人立てる' },
  B2: { id: 'fix-b2', phase: 'now', title: '役割分担表を作る', description: '営業・受入・連携・請求の担当を明確化する' },
  B4: { id: 'fix-b4', phase: 'now', title: '現場説明会を実施する', description: '在宅の必要性とやらないリスクを現場に共有する' },
  B5: { id: 'fix-b5', phase: 'now', title: '受入姿勢の基準を揃える', description: '新規依頼を受ける/断る条件を整理する' },
  B8: { id: 'fix-b8', phase: 'now', title: '外来と在宅の両立案を作る', description: '人員と時間の制約を踏まえた運用案を作成する' },
  C1: { id: 'fix-c1', phase: 'next', title: '初期教育計画を作る', description: '誰に何をどの順で教えるかを決める' },
  C7: { id: 'fix-c7', phase: 'next', title: '初回受入チェックリストを作る', description: '初回案件前の確認漏れを防ぐ' },
  C8: { id: 'fix-c8', phase: 'next', title: '受入条件表を作る', description: '何が揃えば受けてよいかを明文化する' },
  D1: { id: 'fix-d1', phase: 'now', title: '初回受入条件を定義する', description: '受入可否の判断基準を文書化する' },
  D2: { id: 'fix-d2', phase: 'next', title: '受入フローを図にする', description: '初回受入までの業務フローを可視化する' },
  D3: { id: 'fix-d3', phase: 'now', title: '営業前課題一覧を作る', description: '足りない条件を優先順位付きで整理する' },
  D5: { id: 'fix-d5', phase: 'next', title: '紹介受領フローを整える', description: '紹介時の対応を標準化する' },
  E1: { id: 'fix-e1', phase: 'now', title: '夜間方針を決める', description: '内製か外部接続かを含め、夜間・緊急対応方針を明文化する' },
  E4: { id: 'fix-e4', phase: 'next', title: '夜間引継ぎ項目を定義する', description: '夜間帯へ渡す患者情報の必須項目を揃える' },
  E5: { id: 'fix-e5', phase: 'next', title: '夜間引継ぎ更新ルールを作る', description: '患者情報をいつ誰が更新するか決める' },
  E6: { id: 'fix-e6', phase: 'next', title: '緊急連絡フローを整える', description: '緊急時の判断・連絡順を明文化する' },
}

export function buildRoadmap(evaluation: DiagnosticEvaluation) {
  const pharmacyType = evaluation.pharmacyType ?? 'MID'
  const base = BASE_ROADMAP[pharmacyType]
  const additions = evaluation.unmetGoThresholds
    .map((questionId) => UNMET_TASK_MAP[questionId])
    .filter(Boolean)

  const stopTasks = evaluation.triggeredStopReasons.map((reason, index) => ({
    id: `stop-${index}`,
    phase: 'now' as const,
    title: '重大条件の是正',
    description: reason,
    tags: ['STOP'],
  }))

  return [...stopTasks, ...additions, ...base]
    .filter((task, index, array) => array.findIndex((candidate) => candidate.id === task.id) === index)
    .slice(0, 8)
}
