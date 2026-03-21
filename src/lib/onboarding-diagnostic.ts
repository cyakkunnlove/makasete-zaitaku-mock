import type {
  AxisDefinition,
  DiagnosticAnswers,
  DiagnosticQuestion,
  OnboardingDiagnosticDefinition,
  DiagnosticEvaluation,
  DiagnosticAxis,
  OnboardingPharmacyType,
} from '@/types/onboarding'

export const ONBOARDING_AXES: AxisDefinition[] = [
  { id: 'A', name: '経営・方針', purpose: 'オーナー意思、導入目的、投資・優先順位の明確化', mvpRequired: true },
  { id: 'B', name: '体制・役割分担', purpose: '実行責任者、現場体制、受入姿勢の確認', mvpRequired: true },
  { id: 'C', name: '教育・標準化', purpose: '必要知識・教育・手順の整備度確認', mvpRequired: true },
  { id: 'D', name: '受入準備・運用', purpose: '初回患者受入に必要な実務準備の確認', mvpRequired: true },
  { id: 'E', name: '夜間・緊急対応準備', purpose: '夜間方針、引継ぎ、緊急時体制の確認', mvpRequired: true },
  { id: 'F', name: '設備・機材状況', purpose: '無菌・ポンプ・備品・物理環境の確認', mvpRequired: false },
]

const L4_OPTIONS = [
  { label: '未定 / ない', value: 'none', score: 0 },
  { label: '興味あり / 一部あり', value: 'interest', score: 1 },
  { label: '進めたい / 概ねあり', value: 'progress', score: 3 },
  { label: '明確に決定 / 十分に整備', value: 'ready', score: 5 },
] as const

const THREE_OPTIONS = [
  { label: '未定', value: 'none', score: 0 },
  { label: '仮決め / 一部作成', value: 'partial', score: 2 },
  { label: '決定済み / 完成', value: 'done', score: 5 },
] as const

export const ONBOARDING_DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  {
    id: 'A1', axis: 'A', axisName: '経営・方針', subcategory: '導入意思',
    question: 'オーナーは在宅導入を明確に意思決定していますか？',
    answerType: 'single', options: [
      { label: '未定', value: 'undecided', score: 0 },
      { label: '興味はある', value: 'interested', score: 1 },
      { label: '進めたい', value: 'want_to_proceed', score: 3 },
      { label: '明確に決定している', value: 'decided', score: 5 },
    ], required: true, affectsGoNoGo: true, stopValues: ['undecided'], tags: ['owner-intent', 'stop-candidate'],
  },
  {
    id: 'A2', axis: 'A', axisName: '経営・方針', subcategory: '導入意思',
    question: '在宅導入の目的は整理されていますか？',
    helpText: '地域支援加算、売上拡大、地域貢献、差別化など。',
    answerType: 'single', options: [
      { label: '未整理', value: 'unstructured', score: 0 },
      { label: '1つだけある', value: 'single_goal', score: 3 },
      { label: '複数の目的が明確', value: 'multiple_goals', score: 5 },
    ], required: true, affectsGoNoGo: true, tags: ['goal-definition'],
  },
  {
    id: 'A3', axis: 'A', axisName: '経営・方針', subcategory: '導入意思',
    question: '在宅をどこまで本気で進めるか決まっていますか？',
    answerType: 'single', options: [
      { label: '未定', value: 'undecided', score: 0 },
      { label: '地域支援加算レベル', value: 'light', score: 2 },
      { label: '中規模で運用したい', value: 'mid', score: 3 },
      { label: '本格展開したい', value: 'full', score: 5 },
    ], required: true, affectsGoNoGo: false, tags: ['pharmacy-type'],
  },
  {
    id: 'A4', axis: 'A', axisName: '経営・方針', subcategory: '経営判断・投資',
    question: '必要設備・教育・運用に投資する意思がありますか？',
    answerType: 'single', options: [
      { label: 'ない', value: 'no', score: 0 },
      { label: '最低限のみ', value: 'minimum_only', score: 1 },
      { label: '必要なら投資する', value: 'necessary', score: 3 },
      { label: '計画的に投資する', value: 'planned', score: 5 },
    ], required: true, affectsGoNoGo: true, stopValues: ['no'], tags: ['investment', 'stop-candidate'],
  },
  { id: 'A5', axis: 'A', axisName: '経営・方針', subcategory: '経営判断・投資', question: '在宅導入は他業務より優先順位が高いですか？', answerType: 'single', options: [...L4_OPTIONS], required: false, affectsGoNoGo: false },
  { id: 'A6', axis: 'A', axisName: '経営・方針', subcategory: '経営判断・投資', question: 'オーナーは夜間対応の必要性とコストを理解していますか？', answerType: 'single', options: [...L4_OPTIONS], required: false, affectsGoNoGo: false, tags: ['night-connection'] },
  { id: 'A7', axis: 'A', axisName: '経営・方針', subcategory: '目標設定', question: '初回受入の目標時期は決まっていますか？', answerType: 'single', options: [
    { label: '未定', value: 'undecided', score: 0 },
    { label: '半年超', value: 'over_6m', score: 2 },
    { label: '3〜6ヶ月', value: '3_6m', score: 3 },
    { label: '3ヶ月以内', value: 'under_3m', score: 5 },
  ], required: false, affectsGoNoGo: false },
  { id: 'A8', axis: 'A', axisName: '経営・方針', subcategory: '目標設定', question: '在宅患者数や導入目標が設定されていますか？', answerType: 'single', options: [...L4_OPTIONS], required: false, affectsGoNoGo: false },

  { id: 'B1', axis: 'B', axisName: '体制・役割分担', subcategory: '推進体制', question: '在宅導入の実行責任者は決まっていますか？', answerType: 'single', options: [...THREE_OPTIONS], required: true, affectsGoNoGo: true, stopValues: ['none'], tags: ['ownering', 'stop-candidate'] },
  { id: 'B2', axis: 'B', axisName: '体制・役割分担', subcategory: '推進体制', question: '営業・受入・連携・請求などの役割分担は整理されていますか？', answerType: 'single', options: [...L4_OPTIONS], required: true, affectsGoNoGo: true },
  { id: 'B3', axis: 'B', axisName: '体制・役割分担', subcategory: '推進体制', question: '不在時の代替担当まで想定されていますか？', answerType: 'single', options: [...L4_OPTIONS], required: false, affectsGoNoGo: false },
  { id: 'B4', axis: 'B', axisName: '体制・役割分担', subcategory: '現場受入姿勢', question: '現場スタッフは在宅導入の必要性を理解していますか？', answerType: 'single', options: [...L4_OPTIONS], required: true, affectsGoNoGo: true, stopValues: ['none'], tags: ['mindset', 'stop-candidate'] },
  { id: 'B5', axis: 'B', axisName: '体制・役割分担', subcategory: '現場受入姿勢', question: '現場は新規在宅依頼を基本的に断らない姿勢ですか？', answerType: 'single', options: [...L4_OPTIONS], required: true, affectsGoNoGo: true, stopValues: ['none'], tags: ['mindset', 'stop-candidate'] },
  { id: 'B6', axis: 'B', axisName: '体制・役割分担', subcategory: '現場受入姿勢', question: '在宅に前向きなコアメンバーは複数いますか？', answerType: 'single', options: [...L4_OPTIONS], required: false, affectsGoNoGo: false },
  { id: 'B7', axis: 'B', axisName: '体制・役割分担', subcategory: '稼働体制', question: '人員の稼働可能時間は把握できていますか？', answerType: 'single', options: [...L4_OPTIONS], required: false, affectsGoNoGo: false },
  { id: 'B8', axis: 'B', axisName: '体制・役割分担', subcategory: '稼働体制', question: '外来と在宅を両立できる体制の見通しがありますか？', answerType: 'single', options: [...L4_OPTIONS], required: true, affectsGoNoGo: true },
  { id: 'B9', axis: 'B', axisName: '体制・役割分担', subcategory: '稼働体制', question: '薬剤師の在宅マインドセット形成は進んでいますか？', answerType: 'single', options: [...L4_OPTIONS], required: false, affectsGoNoGo: false },

  { id: 'C1', axis: 'C', axisName: '教育・標準化', subcategory: '初期教育', question: '在宅導入の基礎教育を誰が・いつ・どう行うか決まっていますか？', answerType: 'single', options: [...L4_OPTIONS], required: true, affectsGoNoGo: true },
  { id: 'C2', axis: 'C', axisName: '教育・標準化', subcategory: '初期教育', question: '在宅の仕組み（ケアマネ、クリニック連携など）の教育資料はありますか？', answerType: 'single', options: [...L4_OPTIONS], required: false, affectsGoNoGo: false },
  { id: 'C3', axis: 'C', axisName: '教育・標準化', subcategory: '初期教育', question: '初期教育の順序（何から学ぶか）は整理されていますか？', answerType: 'single', options: [...L4_OPTIONS], required: false, affectsGoNoGo: false },
  { id: 'C4', axis: 'C', axisName: '教育・標準化', subcategory: '専門手技教育', question: '無菌調剤（クリーンベンチ）の教育導線がありますか？', answerType: 'single', options: [...L4_OPTIONS], required: true, affectsGoNoGo: false, tags: ['equipment'] },
  { id: 'C5', axis: 'C', axisName: '教育・標準化', subcategory: '専門手技教育', question: 'ポンプ類の取り扱い教育導線がありますか？', answerType: 'single', options: [...L4_OPTIONS], required: true, affectsGoNoGo: false, tags: ['equipment'] },
  { id: 'C6', axis: 'C', axisName: '教育・標準化', subcategory: '専門手技教育', question: '配合変化・側管投与・詰まり等の現場判断知識への導線がありますか？', answerType: 'single', options: [...L4_OPTIONS], required: false, affectsGoNoGo: false },
  { id: 'C7', axis: 'C', axisName: '教育・標準化', subcategory: 'ルール・テンプレ', question: '初回受入前チェックリストがありますか？', answerType: 'single', options: [...THREE_OPTIONS], required: true, affectsGoNoGo: true },
  { id: 'C8', axis: 'C', axisName: '教育・標準化', subcategory: 'ルール・テンプレ', question: '受入条件表のフォーマットがありますか？', answerType: 'single', options: [...THREE_OPTIONS], required: true, affectsGoNoGo: true },
  { id: 'C9', axis: 'C', axisName: '教育・標準化', subcategory: 'ルール・テンプレ', question: 'KPI/KDIや宿題管理の型がありますか？', answerType: 'single', options: [...L4_OPTIONS], required: false, affectsGoNoGo: false },

  { id: 'D1', axis: 'D', axisName: '受入準備・運用', subcategory: '初回受入条件', question: '初回患者受入の条件（何が揃えば受けるか）は明文化されていますか？', answerType: 'single', options: [...L4_OPTIONS], required: true, affectsGoNoGo: true },
  { id: 'D2', axis: 'D', axisName: '受入準備・運用', subcategory: '初回受入条件', question: '受入時の院内フローは整理されていますか？', answerType: 'single', options: [...L4_OPTIONS], required: true, affectsGoNoGo: true },
  { id: 'D3', axis: 'D', axisName: '受入準備・運用', subcategory: '初回受入条件', question: '営業に進む前に潰すべき課題は見える化されていますか？', answerType: 'single', options: [...L4_OPTIONS], required: true, affectsGoNoGo: true },
  { id: 'D4', axis: 'D', axisName: '受入準備・運用', subcategory: '対外連携', question: 'ケアマネ・クリニック等との関係整理ができていますか？', answerType: 'single', options: [...L4_OPTIONS], required: false, affectsGoNoGo: false },
  { id: 'D5', axis: 'D', axisName: '受入準備・運用', subcategory: '対外連携', question: '紹介を受けた時の対応フローは整理されていますか？', answerType: 'single', options: [...L4_OPTIONS], required: true, affectsGoNoGo: true },
  { id: 'D6', axis: 'D', axisName: '受入準備・運用', subcategory: '対外連携', question: '患者説明・受入説明の雛形がありますか？', answerType: 'single', options: [...L4_OPTIONS], required: false, affectsGoNoGo: false },
  { id: 'D7', axis: 'D', axisName: '受入準備・運用', subcategory: '算定・実務知識', question: '加算関係の判断資料・教育導線がありますか？', answerType: 'single', options: [...L4_OPTIONS], required: false, affectsGoNoGo: false },
  { id: 'D8', axis: 'D', axisName: '受入準備・運用', subcategory: '算定・実務知識', question: '麻薬・医療材料・院内院外処方の判断資料がありますか？', answerType: 'single', options: [...L4_OPTIONS], required: false, affectsGoNoGo: false },
  { id: 'D9', axis: 'D', axisName: '受入準備・運用', subcategory: '算定・実務知識', question: '初回運用時に現場が迷ったときの相談先がありますか？', answerType: 'single', options: [...L4_OPTIONS], required: false, affectsGoNoGo: false },

  { id: 'E1', axis: 'E', axisName: '夜間・緊急対応準備', subcategory: '方針', question: '夜間・緊急対応をどうするか方針は決まっていますか？', answerType: 'single', options: [...L4_OPTIONS], required: true, affectsGoNoGo: true, stopValues: ['none'], tags: ['night', 'stop-candidate'] },
  { id: 'E2', axis: 'E', axisName: '夜間・緊急対応準備', subcategory: '方針', question: '夜間対応を内製するか外部接続するか決まっていますか？', answerType: 'single', options: [...L4_OPTIONS], required: false, affectsGoNoGo: false, tags: ['night'] },
  { id: 'E3', axis: 'E', axisName: '夜間・緊急対応準備', subcategory: '方針', question: '夜間をやらない場合のリスク認識がありますか？', answerType: 'single', options: [...L4_OPTIONS], required: false, affectsGoNoGo: false },
  { id: 'E4', axis: 'E', axisName: '夜間・緊急対応準備', subcategory: '引継ぎ・情報', question: '夜間帯に引き継ぐ患者情報項目は整理されていますか？', answerType: 'single', options: [...L4_OPTIONS], required: true, affectsGoNoGo: true, tags: ['night-connection'] },
  { id: 'E5', axis: 'E', axisName: '夜間・緊急対応準備', subcategory: '引継ぎ・情報', question: '夜間引継ぎ情報を入力・更新する運用がありますか？', answerType: 'single', options: [...L4_OPTIONS], required: true, affectsGoNoGo: true, tags: ['night-connection'] },
  { id: 'E6', axis: 'E', axisName: '夜間・緊急対応準備', subcategory: '引継ぎ・情報', question: '緊急時の判断・連絡フローは整理されていますか？', answerType: 'single', options: [...L4_OPTIONS], required: true, affectsGoNoGo: true },
  { id: 'E7', axis: 'E', axisName: '夜間・緊急対応準備', subcategory: '導入タイミング', question: '夜間支援を導入する想定タイミングは決まっていますか？', answerType: 'single', options: [
    { label: '未定', value: 'undecided', score: 0 },
    { label: '初回受入後', value: 'after_first', score: 3 },
    { label: '患者10〜20人時点', value: 'ten_twenty_patients', score: 5 },
    { label: 'それ以前から必要', value: 'before_first', score: 5 },
  ], required: false, affectsGoNoGo: false, tags: ['night-connection'] },
  { id: 'E8', axis: 'E', axisName: '夜間・緊急対応準備', subcategory: '導入タイミング', question: '夜間対応コストを踏まえた現実運用が検討されていますか？', answerType: 'single', options: [...L4_OPTIONS], required: false, affectsGoNoGo: false },

  { id: 'F1', axis: 'F', axisName: '設備・機材状況', subcategory: '無菌・機材', question: 'クリーンベンチの有無または利用手段がありますか？', answerType: 'single', options: [...L4_OPTIONS], required: false, affectsGoNoGo: false },
  { id: 'F2', axis: 'F', axisName: '設備・機材状況', subcategory: '無菌・機材', question: 'ポンプ類への対応手段がありますか？', answerType: 'single', options: [...L4_OPTIONS], required: false, affectsGoNoGo: false },
  { id: 'F3', axis: 'F', axisName: '設備・機材状況', subcategory: '無菌・機材', question: '在宅に必要な備品一覧は整備されていますか？', answerType: 'single', options: [...L4_OPTIONS], required: false, affectsGoNoGo: false },
  { id: 'F4', axis: 'F', axisName: '設備・機材状況', subcategory: '現場環境', question: '調剤室の模様替え・動線見直しの要否を把握していますか？', answerType: 'single', options: [...L4_OPTIONS], required: false, affectsGoNoGo: false },
  { id: 'F5', axis: 'F', axisName: '設備・機材状況', subcategory: '現場環境', question: '設備不足を補う代替運用は整理されていますか？', answerType: 'single', options: [...L4_OPTIONS], required: false, affectsGoNoGo: false },
]

export const ONBOARDING_DIAGNOSTIC_DEFINITION: OnboardingDiagnosticDefinition = {
  version: '2026-03-19.v1',
  axes: ONBOARDING_AXES,
  questions: ONBOARDING_DIAGNOSTIC_QUESTIONS,
  decisionRules: {
    go: [
      { questionId: 'A1', minimumScore: 3 },
      { questionId: 'B1', minimumScore: 2 },
      { questionId: 'B4', minimumScore: 3 },
      { questionId: 'B5', minimumScore: 3 },
      { questionId: 'D1', minimumScore: 3 },
      { questionId: 'D2', minimumScore: 3 },
      { questionId: 'E1', minimumScore: 3 },
      { questionId: 'E4', minimumScore: 3 },
      { questionId: 'E6', minimumScore: 3 },
    ],
    stopQuestionValues: [
      { questionId: 'A1', blockedValues: ['undecided'], reason: 'オーナー意思が未確定' },
      { questionId: 'A4', blockedValues: ['no'], reason: '必要投資の意思がない' },
      { questionId: 'B1', blockedValues: ['none'], reason: '実行責任者が未定' },
      { questionId: 'B4', blockedValues: ['none'], reason: '現場が在宅導入を理解していない' },
      { questionId: 'B5', blockedValues: ['none'], reason: '現場が新規在宅依頼を受ける前提になっていない' },
      { questionId: 'E1', blockedValues: ['none'], reason: '夜間・緊急対応方針が未定' },
    ],
  },
}

export function getQuestionById(questionId: string) {
  return ONBOARDING_DIAGNOSTIC_QUESTIONS.find((question) => question.id === questionId)
}

function getSingleAnswerScore(question: DiagnosticQuestion, answer: DiagnosticAnswers[string]) {
  if (!question.options || typeof answer !== 'string') return null
  return question.options.find((option) => option.value === answer)?.score ?? null
}

function inferPharmacyType(answer: DiagnosticAnswers[string]): OnboardingPharmacyType | null {
  switch (answer) {
    case 'light':
      return 'LIGHT'
    case 'mid':
      return 'MID'
    case 'full':
      return 'FULL'
    default:
      return null
  }
}

export function evaluateOnboardingAnswers(answers: DiagnosticAnswers): DiagnosticEvaluation {
  const axisScores = ONBOARDING_AXES.reduce((acc, axis) => {
    acc[axis.id] = 0
    return acc
  }, {} as Record<DiagnosticAxis, number>)

  const axisCounts = ONBOARDING_AXES.reduce((acc, axis) => {
    acc[axis.id] = 0
    return acc
  }, {} as Record<DiagnosticAxis, number>)

  const missingRequiredQuestionIds: string[] = []
  const triggeredStopReasons: string[] = []
  const unmetGoThresholds: string[] = []

  for (const question of ONBOARDING_DIAGNOSTIC_QUESTIONS) {
    const answer = answers[question.id]
    if (question.required && (answer === undefined || answer === null || answer === '')) {
      missingRequiredQuestionIds.push(question.id)
      continue
    }

    const score = getSingleAnswerScore(question, answer)
    if (score !== null) {
      axisScores[question.axis] += score
      axisCounts[question.axis] += 1
    }
  }

  for (const axis of ONBOARDING_AXES) {
    if (axisCounts[axis.id] > 0) {
      axisScores[axis.id] = Number((axisScores[axis.id] / axisCounts[axis.id]).toFixed(2))
    }
  }

  for (const rule of ONBOARDING_DIAGNOSTIC_DEFINITION.decisionRules.stopQuestionValues) {
    const answer = answers[rule.questionId]
    if (typeof answer === 'string' && rule.blockedValues.includes(answer)) {
      triggeredStopReasons.push(rule.reason)
    }
  }

  for (const threshold of ONBOARDING_DIAGNOSTIC_DEFINITION.decisionRules.go) {
    const question = getQuestionById(threshold.questionId)
    const score = question ? getSingleAnswerScore(question, answers[threshold.questionId]) : null
    if (score === null || score < threshold.minimumScore) {
      unmetGoThresholds.push(threshold.questionId)
    }
  }

  const pharmacyType = inferPharmacyType(answers.A3)

  let decision: DiagnosticEvaluation['decision'] = 'NOT_YET'
  if (triggeredStopReasons.length > 0) {
    decision = 'STOP'
  } else if (missingRequiredQuestionIds.length === 0 && unmetGoThresholds.length === 0) {
    decision = 'GO'
  }

  return {
    axisScores,
    decision,
    pharmacyType,
    missingRequiredQuestionIds,
    triggeredStopReasons,
    unmetGoThresholds,
  }
}
