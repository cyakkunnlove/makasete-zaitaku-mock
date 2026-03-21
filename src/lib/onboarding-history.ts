import type { DiagnosticAnswers, DiagnosticEvaluation } from '@/types/onboarding'

export interface OnboardingAssessmentRecord {
  id: string
  pharmacyId: string
  pharmacyName: string
  createdAt: string
  answers: DiagnosticAnswers
  evaluation: DiagnosticEvaluation
}

export const MOCK_ONBOARDING_HISTORY: OnboardingAssessmentRecord[] = [
  {
    id: 'oa-001',
    pharmacyId: 'PH-01',
    pharmacyName: '城南みらい薬局',
    createdAt: '2026-03-10T10:00:00+09:00',
    answers: {
      A1: 'want_to_proceed', A3: 'mid', A4: 'minimal', B1: 'candidate', B2: 'low', B4: 'low', B5: 'cautious',
      B8: 'low', C1: 'low', C4: 'none', C5: 'none', C7: 'verbal', C8: 'verbal', D1: 'low', D2: 'low', D3: 'low',
      D5: 'low', E1: 'low', E4: 'none', E5: 'none', E6: 'low', F1: 'none', F2: 'none',
    },
    evaluation: {
      axisScores: { A: 2, B: 1.4, C: 1, D: 1, E: 0.8, F: 0 },
      decision: 'NOT_YET',
      pharmacyType: 'MID',
      missingRequiredQuestionIds: [],
      triggeredStopReasons: [],
      unmetGoThresholds: ['B1', 'B4', 'B5', 'D1', 'D2', 'E1', 'E4', 'E6'],
    },
  },
]

export function buildAssessmentRecord(input: {
  pharmacyId: string
  pharmacyName: string
  answers: DiagnosticAnswers
  evaluation: DiagnosticEvaluation
}): OnboardingAssessmentRecord {
  return {
    id: `oa-${Date.now()}`,
    pharmacyId: input.pharmacyId,
    pharmacyName: input.pharmacyName,
    createdAt: new Date().toISOString(),
    answers: input.answers,
    evaluation: input.evaluation,
  }
}
