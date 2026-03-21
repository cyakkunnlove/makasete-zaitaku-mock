import type {
  AxisDefinition,
  DiagnosticQuestion,
  OnboardingDiagnosticDefinition,
} from '@/types/onboarding'

export const ONBOARDING_AXES: AxisDefinition[] = [
  { id: 'A', name: '経営・方針', purpose: 'オーナー意思、導入目的、投資判断の明確化', mvpRequired: true },
  { id: 'B', name: '体制・役割分担', purpose: '実行責任者、役割、現場受入姿勢の確認', mvpRequired: true },
  { id: 'C', name: '教育・標準化', purpose: '教育導線、手順化、再現性の確認', mvpRequired: true },
  { id: 'D', name: '受入準備・運用', purpose: '初回受入に必要な実務準備の確認', mvpRequired: true },
  { id: 'E', name: '夜間・緊急対応準備', purpose: '夜間方針、引継ぎ、緊急時体制の確認', mvpRequired: true },
  { id: 'F', name: '設備・機材状況', purpose: 'クリーンベンチ、ポンプ、備品等の確認', mvpRequired: false },
]

const SCALE_4 = [
  { label: 'まだ整理できていない', value: 'none', score: 0 },
  { label: '必要性は認識しているが、まだ不十分', value: 'low', score: 1 },
  { label: '一部は整理・着手できている', value: 'mid', score: 3 },
  { label: '実務で使えるレベルまで整っている', value: 'high', score: 5 },
] as const

export const ONBOARDING_QUESTIONS: DiagnosticQuestion[] = [
  {
    id: 'A1', axis: 'A', axisName: '経営・方針', subcategory: '導入意思',
    question: 'オーナーとして、在宅導入を進める方針は固まっていますか？',
    helpText: 'ここが曖昧だと、準備が進んでも現場が止まりやすくなります。',
    answerType: 'single', options: [
      { label: '未定', value: 'undecided', score: 0 },
      { label: '興味はある', value: 'interested', score: 1 },
      { label: '進めたい', value: 'want_to_proceed', score: 3 },
      { label: '明確に決定済み', value: 'decided', score: 5 },
    ], required: true, affectsGoNoGo: true, stopValues: ['undecided'], tags: ['owner-intent'],
  },
  {
    id: 'A3', axis: 'A', axisName: '経営・方針', subcategory: '導入意思',
    question: '在宅をどの程度の規模感で進める想定ですか？',
    answerType: 'single', options: [
      { label: 'まだ未定', value: 'undecided', score: 0 },
      { label: '地域支援体制加算レベル', value: 'light', score: 2 },
      { label: '中規模で継続的に実施', value: 'mid', score: 3 },
      { label: '本格導入・拡張前提', value: 'full', score: 5 },
    ], required: true, affectsGoNoGo: false, tags: ['pharmacy-type'],
  },
  {
    id: 'A4', axis: 'A', axisName: '経営・方針', subcategory: '経営判断・投資',
    question: '必要な設備・教育・運用に、どの程度投資する想定がありますか？',
    answerType: 'single', options: [
      { label: 'ない', value: 'none', score: 0 },
      { label: '最小限なら可能', value: 'minimal', score: 1 },
      { label: '必要なら投資する', value: 'willing', score: 3 },
      { label: '優先投資対象として決めている', value: 'committed', score: 5 },
    ], required: true, affectsGoNoGo: true, stopValues: ['none'], tags: ['investment'],
  },
  {
    id: 'B1', axis: 'B', axisName: '体制・役割分担', subcategory: '推進体制',
    question: '在宅導入の実行責任者は決まっていますか？',
    answerType: 'single', options: [
      { label: '未定', value: 'undecided', score: 0 },
      { label: '候補者はいる', value: 'candidate', score: 2 },
      { label: '仮決め済み', value: 'tentative', score: 3 },
      { label: '正式決定済み', value: 'decided', score: 5 },
    ], required: true, affectsGoNoGo: true, stopValues: ['undecided'], tags: ['ownership'],
  },
  {
    id: 'B2', axis: 'B', axisName: '体制・役割分担', subcategory: '推進体制',
    question: '営業・受入・連携・請求など、導入に必要な役割分担は整理できていますか？',
    answerType: 'single', options: SCALE_4, required: true, affectsGoNoGo: true, tags: ['roles'],
  },
  {
    id: 'B4', axis: 'B', axisName: '体制・役割分担', subcategory: '現場受入姿勢',
    question: '現場スタッフは、なぜ在宅に取り組むのかを理解できていますか？',
    answerType: 'single', options: SCALE_4, required: true, affectsGoNoGo: true, stopValues: ['none'], tags: ['staff-mindset'],
  },
  {
    id: 'B5', axis: 'B', axisName: '体制・役割分担', subcategory: '現場受入姿勢',
    question: '新規の在宅依頼に対して、基本的に受ける前提で検討できる状態ですか？',
    answerType: 'single', options: [
      { label: '断る前提', value: 'reject', score: 0 },
      { label: 'ケース次第でかなり慎重', value: 'cautious', score: 1 },
      { label: '条件が合えば受ける', value: 'conditional', score: 3 },
      { label: '基本的に受ける方針', value: 'accept', score: 5 },
    ], required: true, affectsGoNoGo: true, stopValues: ['reject'], tags: ['acceptance'],
  },
  {
    id: 'B8', axis: 'B', axisName: '体制・役割分担', subcategory: '稼働体制',
    question: '外来業務と在宅業務を、無理なく両立できる見通しがありますか？',
    answerType: 'single', options: SCALE_4, required: true, affectsGoNoGo: true, tags: ['capacity'],
  },
  {
    id: 'C1', axis: 'C', axisName: '教育・標準化', subcategory: '初期教育',
    question: '在宅導入の基礎教育について、誰に・いつ・何を教えるか整理できていますか？',
    answerType: 'single', options: SCALE_4, required: true, affectsGoNoGo: true, tags: ['education-plan'],
  },
  {
    id: 'C4', axis: 'C', axisName: '教育・標準化', subcategory: '専門手技教育',
    question: '無菌調剤（クリーンベンチ）について、学ぶ導線や指導手段がありますか？',
    answerType: 'single', options: SCALE_4, required: true, affectsGoNoGo: false, tags: ['aseptic'],
  },
  {
    id: 'C5', axis: 'C', axisName: '教育・標準化', subcategory: '専門手技教育',
    question: 'ポンプ類の取り扱いについて、学ぶ導線や指導手段がありますか？',
    answerType: 'single', options: SCALE_4, required: true, affectsGoNoGo: false, tags: ['pump'],
  },
  {
    id: 'C7', axis: 'C', axisName: '教育・標準化', subcategory: 'ルール・テンプレ',
    question: '初回受入前に確認するチェックリストはありますか？',
    answerType: 'single', options: [
      { label: 'ない', value: 'none', score: 0 },
      { label: '口頭ベースのみ', value: 'verbal', score: 2 },
      { label: '仮版あり', value: 'draft', score: 3 },
      { label: '運用可能な形である', value: 'ready', score: 5 },
    ], required: true, affectsGoNoGo: true, tags: ['checklist'],
  },
  {
    id: 'C8', axis: 'C', axisName: '教育・標準化', subcategory: 'ルール・テンプレ',
    question: 'どの条件なら受けるかを整理する受入条件表のひな型はありますか？',
    answerType: 'single', options: [
      { label: 'ない', value: 'none', score: 0 },
      { label: '口頭基準のみ', value: 'verbal', score: 2 },
      { label: '仮版あり', value: 'draft', score: 3 },
      { label: '運用可能な形である', value: 'ready', score: 5 },
    ], required: true, affectsGoNoGo: true, tags: ['acceptance-criteria'],
  },
  {
    id: 'D1', axis: 'D', axisName: '受入準備・運用', subcategory: '初回受入条件',
    question: '初回患者を受けてよい条件（何が揃えば受けるか）は明文化されていますか？',
    answerType: 'single', options: SCALE_4, required: true, affectsGoNoGo: true, tags: ['first-acceptance'],
  },
  {
    id: 'D2', axis: 'D', axisName: '受入準備・運用', subcategory: '初回受入条件',
    question: '紹介を受けてから受入するまでの院内フローは整理されていますか？',
    answerType: 'single', options: SCALE_4, required: true, affectsGoNoGo: true, tags: ['workflow'],
  },
  {
    id: 'D3', axis: 'D', axisName: '受入準備・運用', subcategory: '初回受入条件',
    question: '営業に進む前に先に整えるべき課題は見える化されていますか？',
    answerType: 'single', options: SCALE_4, required: true, affectsGoNoGo: true, tags: ['pre-sales-gaps'],
  },
  {
    id: 'D5', axis: 'D', axisName: '受入準備・運用', subcategory: '対外連携',
    question: '紹介を受けた時に、誰が何をするかの対応フローは整理されていますか？',
    answerType: 'single', options: SCALE_4, required: true, affectsGoNoGo: true, tags: ['referral-flow'],
  },
  {
    id: 'E1', axis: 'E', axisName: '夜間・緊急対応準備', subcategory: '方針',
    question: '夜間・緊急対応をどう進めるか、基本方針は決まっていますか？',
    answerType: 'single', options: SCALE_4, required: true, affectsGoNoGo: true, stopValues: ['none'], tags: ['night-policy'],
  },
  {
    id: 'E4', axis: 'E', axisName: '夜間・緊急対応準備', subcategory: '引継ぎ・情報',
    question: '夜間帯に引き継ぐ患者情報として、何を共有すべきか整理できていますか？',
    answerType: 'single', options: SCALE_4, required: true, affectsGoNoGo: true, tags: ['night-handover'],
  },
  {
    id: 'E5', axis: 'E', axisName: '夜間・緊急対応準備', subcategory: '引継ぎ・情報',
    question: '夜間引継ぎ情報を、誰がいつ入力・更新するかの運用は決まっていますか？',
    answerType: 'single', options: SCALE_4, required: true, affectsGoNoGo: true, tags: ['night-operations'],
  },
  {
    id: 'E6', axis: 'E', axisName: '夜間・緊急対応準備', subcategory: '引継ぎ・情報',
    question: '緊急時に、誰が判断し誰へ連絡するかの流れは整理されていますか？',
    answerType: 'single', options: SCALE_4, required: true, affectsGoNoGo: true, tags: ['emergency-flow'],
  },
  {
    id: 'F1', axis: 'F', axisName: '設備・機材状況', subcategory: '無菌・機材',
    question: 'クリーンベンチの有無、または利用手段がありますか？',
    answerType: 'single', options: SCALE_4, required: false, affectsGoNoGo: false, tags: ['equipment'],
  },
  {
    id: 'F2', axis: 'F', axisName: '設備・機材状況', subcategory: '無菌・機材',
    question: 'ポンプ類に対応する手段がありますか？',
    answerType: 'single', options: SCALE_4, required: false, affectsGoNoGo: false, tags: ['equipment'],
  },
]

export const ONBOARDING_DIAGNOSTIC_DEFINITION: OnboardingDiagnosticDefinition = {
  version: '2026-03-19.v1',
  axes: ONBOARDING_AXES,
  questions: ONBOARDING_QUESTIONS,
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
      { questionId: 'A1', blockedValues: ['undecided'], reason: 'オーナーの在宅導入意思が未確定' },
      { questionId: 'A4', blockedValues: ['none'], reason: '必要投資を行う意思がない' },
      { questionId: 'B1', blockedValues: ['undecided'], reason: '実行責任者が未定' },
      { questionId: 'B4', blockedValues: ['none'], reason: '現場が在宅導入の必要性を理解していない' },
      { questionId: 'B5', blockedValues: ['reject'], reason: '新規在宅依頼を断る前提になっている' },
      { questionId: 'E1', blockedValues: ['none'], reason: '夜間・緊急対応方針が未整備' },
    ],
  },
}
