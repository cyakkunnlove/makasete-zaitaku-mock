// 診断軸のキー
export type AxisKey = 'vision' | 'role' | 'education' | 'operations' | 'night'

// トーン（UI表示用）
export type Tone = 'default' | 'good' | 'warn' | 'info'

// 軸ごとのスコア
export type AxisScore = {
  key: AxisKey
  subject: string
  score: number
  fullMark: number
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
}

// 教材
export type LearningItem = {
  id: string
  title: string
  type: '動画' | 'テンプレ' | '資料'
  target: string
  description: string
  duration: string
  outcome: string
  linkedTaskId: string
  previewTitle: string
  previewMeta: string
  previewLines: string[]
  ctaLabel: string
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
