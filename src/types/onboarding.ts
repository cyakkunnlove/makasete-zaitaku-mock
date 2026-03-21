export type DiagnosticAxis = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

export type OnboardingDecision = 'GO' | 'NOT_YET' | 'STOP'
export type OnboardingPharmacyType = 'LIGHT' | 'MID' | 'FULL'

export type DiagnosticAnswerType = 'single' | 'multi' | 'number' | 'text'

export interface DiagnosticOption {
  label: string
  value: string
  score: number
}

export interface DiagnosticQuestion {
  id: string
  axis: DiagnosticAxis
  axisName: string
  subcategory: string
  question: string
  helpText?: string
  answerType: DiagnosticAnswerType
  options?: readonly DiagnosticOption[]
  required: boolean
  affectsGoNoGo: boolean
  stopValues?: string[]
  tags?: string[]
}

export interface AxisDefinition {
  id: DiagnosticAxis
  name: string
  purpose: string
  mvpRequired: boolean
}

export interface ScoreThreshold {
  questionId: string
  minimumScore: number
}

export interface DecisionRuleSet {
  go: ScoreThreshold[]
  stopQuestionValues: Array<{
    questionId: string
    blockedValues: string[]
    reason: string
  }>
}

export interface OnboardingDiagnosticDefinition {
  version: string
  axes: AxisDefinition[]
  questions: DiagnosticQuestion[]
  decisionRules: DecisionRuleSet
}

export interface DiagnosticAnswers {
  [questionId: string]: string | string[] | number | null | undefined
}

export interface DiagnosticEvaluation {
  axisScores: Record<DiagnosticAxis, number>
  decision: OnboardingDecision
  pharmacyType: OnboardingPharmacyType | null
  missingRequiredQuestionIds: string[]
  triggeredStopReasons: string[]
  unmetGoThresholds: string[]
}
