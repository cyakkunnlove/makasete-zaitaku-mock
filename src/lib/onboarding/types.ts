// 診断軸のキー（6軸に拡張）
export type AxisKey = 'vision' | 'role' | 'equipment' | 'education' | 'operations' | 'night'

// 本気度レベル
export type CommitmentLevel = 'basic' | 'moderate' | 'full'

// トーン（UI表示用）
export type Tone = 'default' | 'good' | 'warn' | 'info'

// 軸ごとのスコア
export type AxisScore = {
  key: AxisKey
  subject: string
  score: number
  fullMark: number
  weight: number // 重み付け
}

// 選択肢
export type Option = {
  label: string
  score: number
  detail: string
}

// 診断質問
export type AssessmentQuestion = {
  id: AxisKey
  category: string
  question: string
  help: string
  options: Option[]
  weight: number // 重要度（1-3）
}

// 本気度診断質問
export type CommitmentQuestion = {
  id: string
  question: string
  options: {
    label: string
    level: CommitmentLevel
  }[]
}

// タスク
export type TaskItem = {
  id: string
  title: string
  owner: string
  due: string
  status: '未着手' | '進行中' | '完了'
  note: string
  review: string
  deliverable: string
  relatedContentId: string
  nextAction: string
  successMetric: string
  commitmentLevels: CommitmentLevel[] // どの本気度で表示するか
}

// 教材
export type LearningItem = {
  id: string
  title: string
  type: '動画' | 'テンプレ' | '資料' | 'チェックリスト'
  target: string
  description: string
  duration: string
  outcome: string
  linkedTaskId: string
  previewTitle: string
  previewMeta: string
  previewLines: string[]
  ctaLabel: string
  category: 'phase0' | 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5' | 'template' | 'knowledge-system' | 'knowledge-kasan' | 'knowledge-materials' | 'skill-aseptic' | 'skill-pump' | 'skill-compatibility' | 'skill-narcotic' // 導入ステージ別 + 基礎知識・臨床スキル細分化カテゴリ
  commitmentLevels: CommitmentLevel[]
  downloadUrl?: string // テンプレートPDFのURL
}

// チェックリスト
export type ChecklistItem = {
  id: string
  title: string
  description: string
  done: boolean
  link: string
  linkLabel: string
}

// サポート
export type SupportItem = {
  id: string
  title: string
  description: string
  action: string
}

// フェーズ
export type PhaseMeta = {
  id: number
  key: string
  label: string
  shortLabel: string
  title: string
  icon: string
  summary: string
  gate: string
  milestone: string
  tone: Tone
}

// 店舗プロフィール
export type StoreProfile = {
  name: string
  owner: string
  manager: string
  area: string
  startGoal: string
  nextMeeting: string
  readinessLabel: string
  firstActionTime: string
}

// フェーズ情報
export type PhaseInfo = {
  phaseId: number
  label: string
  summary: string
  tone: Tone
}

// 本気度別ロードマップ
export type RoadmapByCommitment = {
  level: CommitmentLevel
  label: string
  description: string
  targetPhase: number
  features: string[]
  nightSupport: boolean
}

// つまずきポイント
export type StumblingPoint = {
  id: string
  category: string
  title: string
  description: string
  difficulty: 'high' | 'medium' | 'low'
  relatedLearningIds: string[]
}
