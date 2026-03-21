import { ONBOARDING_DIAGNOSTIC_DEFINITION } from '@/lib/onboarding-definition'
import type {
  DiagnosticAnswers,
  DiagnosticEvaluation,
  DiagnosticQuestion,
  OnboardingPharmacyType,
  DiagnosticAxis,
} from '@/types/onboarding'

function getSingleAnswerValue(answer: DiagnosticAnswers[string]): string | null {
  return typeof answer === 'string' ? answer : null
}

function getQuestionScore(question: DiagnosticQuestion, answers: DiagnosticAnswers): number {
  const answer = answers[question.id]
  if (question.answerType === 'single') {
    const value = getSingleAnswerValue(answer)
    const option = question.options?.find((item) => item.value === value)
    return option?.score ?? 0
  }
  if (question.answerType === 'multi' && Array.isArray(answer)) {
    const scores = answer
      .map((value) => question.options?.find((item) => item.value === value)?.score ?? 0)
      .filter((score) => score > 0)
    if (scores.length === 0) return 0
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  }
  if (question.answerType === 'number' && typeof answer === 'number') {
    return answer
  }
  return 0
}

function detectPharmacyType(answers: DiagnosticAnswers): OnboardingPharmacyType | null {
  const answer = getSingleAnswerValue(answers.A3)
  if (answer === 'light') return 'LIGHT'
  if (answer === 'mid') return 'MID'
  if (answer === 'full') return 'FULL'
  return null
}

export function evaluateOnboardingAnswers(answers: DiagnosticAnswers): DiagnosticEvaluation {
  const axisScores: Record<DiagnosticAxis, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
    F: 0,
  }

  const questionsByAxis: Record<DiagnosticAxis, DiagnosticQuestion[]> = {
    A: [],
    B: [],
    C: [],
    D: [],
    E: [],
    F: [],
  }

  for (const question of ONBOARDING_DIAGNOSTIC_DEFINITION.questions) {
    questionsByAxis[question.axis].push(question)
  }

  for (const axis of Object.keys(questionsByAxis) as DiagnosticAxis[]) {
    const questions = questionsByAxis[axis]
    const total = questions.reduce((sum, question) => sum + getQuestionScore(question, answers), 0)
    axisScores[axis] = questions.length > 0 ? Math.round((total / questions.length) * 10) / 10 : 0
  }

  const missingRequiredQuestionIds = ONBOARDING_DIAGNOSTIC_DEFINITION.questions
    .filter((question) => question.required)
    .filter((question) => answers[question.id] == null || answers[question.id] === '')
    .map((question) => question.id)

  const triggeredStopReasons = ONBOARDING_DIAGNOSTIC_DEFINITION.decisionRules.stopQuestionValues
    .filter((rule) => rule.blockedValues.includes(getSingleAnswerValue(answers[rule.questionId]) ?? ''))
    .map((rule) => rule.reason)

  const unmetGoThresholds = ONBOARDING_DIAGNOSTIC_DEFINITION.decisionRules.go
    .filter((rule) => {
      const question = ONBOARDING_DIAGNOSTIC_DEFINITION.questions.find((item) => item.id === rule.questionId)
      if (!question) return false
      return getQuestionScore(question, answers) < rule.minimumScore
    })
    .map((rule) => rule.questionId)

  let decision: DiagnosticEvaluation['decision'] = 'GO'
  if (triggeredStopReasons.length > 0) {
    decision = 'STOP'
  } else if (missingRequiredQuestionIds.length > 0 || unmetGoThresholds.length > 0) {
    decision = 'NOT_YET'
  }

  return {
    axisScores,
    decision,
    pharmacyType: detectPharmacyType(answers),
    missingRequiredQuestionIds,
    triggeredStopReasons,
    unmetGoThresholds,
  }
}
