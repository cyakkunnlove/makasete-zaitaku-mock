import { ONBOARDING_DIAGNOSTIC_DEFINITION } from '@/lib/onboarding-definition'
import type { DiagnosticEvaluation, OnboardingPharmacyType } from '@/types/onboarding'

const QUESTION_LABEL = new Map(
  ONBOARDING_DIAGNOSTIC_DEFINITION.questions.map((question) => [question.id, question.question]),
)

function actionForQuestion(questionId: string, pharmacyType: OnboardingPharmacyType | null) {
  const typeSuffix = pharmacyType === 'FULL'
    ? '（本格導入前提で優先度高）'
    : pharmacyType === 'MID'
      ? '（中規模運用前提で優先）'
      : pharmacyType === 'LIGHT'
        ? '（地域支援加算レベルで必要範囲を先に整備）'
        : ''

  const map: Record<string, string> = {
    A1: `オーナーの意思決定を明文化し、導入方針を店舗内で共有する${typeSuffix}`,
    A4: `必要投資（教育・設備・運用）の許容範囲を整理し、着手条件を確定する${typeSuffix}`,
    B1: '在宅導入の実行責任者を正式に決める',
    B2: '営業・受入・連携・請求の役割分担表を作成する',
    B4: '現場向けに「なぜ在宅をやるのか」を説明する短時間ミーティングを実施する',
    B5: '新規在宅依頼を受ける基準と断る基準を言語化し、現場で合意する',
    B8: '外来と在宅を両立できる担当体制の叩き台を作る',
    C1: '初期教育の担当者・順番・教材を決める',
    C4: 'クリーンベンチ手技の教材と訓練手順を用意する',
    C5: 'ポンプ類の取り扱い手順と教育導線を整備する',
    C7: '初回受入前チェックリストの初版を作成する',
    C8: '受入条件表のフォーマットを作成する',
    D1: '「何が揃えば初回受入してよいか」を文書化する',
    D2: '紹介受領から初回受入までの院内フローを図にする',
    D3: '営業前に潰すべき課題一覧を作り、優先順位を付ける',
    D5: '紹介を受けた際の対応フローと連絡先一覧を整備する',
    E1: '夜間・緊急対応を内製 / 外部接続のどちらで進めるか決める',
    E4: '夜間引継ぎに必要な患者情報項目を定義する',
    E5: '夜間引継ぎ情報を更新する運用ルールを決める',
    E6: '緊急時の判断フローと連絡順を整理する',
  }

  return map[questionId] ?? `${QUESTION_LABEL.get(questionId) ?? questionId} に対する改善アクションを定義する`
}

export function buildNextActions(evaluation: DiagnosticEvaluation) {
  const actions: string[] = []

  for (const reason of evaluation.triggeredStopReasons) {
    actions.push(`重大条件を先に是正: ${reason}`)
  }

  for (const questionId of evaluation.unmetGoThresholds) {
    actions.push(actionForQuestion(questionId, evaluation.pharmacyType))
  }

  for (const questionId of evaluation.missingRequiredQuestionIds) {
    actions.push(`必須項目を回答: ${QUESTION_LABEL.get(questionId) ?? questionId}`)
  }

  if (evaluation.decision === 'GO') {
    actions.push('初回受入前チェックリストを最終確認する')
    actions.push('営業・紹介受入を開始し、初回案件で運用ログを残す')
    actions.push('夜間引継ぎ情報の入力ルールを定着させる')
  }

  if (evaluation.pharmacyType === 'LIGHT') {
    actions.push('地域支援体制加算取得に必要な範囲に絞って優先順位を再調整する')
  }
  if (evaluation.pharmacyType === 'MID') {
    actions.push('中規模運用を見据えて役割分担と教育の再現性を高める')
  }
  if (evaluation.pharmacyType === 'FULL') {
    actions.push('24時間365日対応を前提に夜間接続条件を前倒しで整える')
  }

  return Array.from(new Set(actions)).slice(0, 6)
}
