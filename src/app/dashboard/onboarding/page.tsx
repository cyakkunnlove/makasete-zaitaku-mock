'use client'

import { useEffect, useMemo, useState } from 'react'
import { OnboardingHistoryPanel } from '@/components/onboarding-history-panel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ONBOARDING_AXES, ONBOARDING_QUESTIONS } from '@/lib/onboarding-definition'
import { evaluateOnboardingAnswers } from '@/lib/onboarding-evaluator'
import { buildAssessmentRecord, MOCK_ONBOARDING_HISTORY, type OnboardingAssessmentRecord } from '@/lib/onboarding-history'
import { buildNextActions } from '@/lib/onboarding-next-actions'
import { buildRoadmap } from '@/lib/onboarding-roadmap'
import { SAMPLE_ONBOARDING_ANSWERS } from '@/lib/onboarding-sample'
import type { DiagnosticAnswers, DiagnosticAxis, DiagnosticQuestion } from '@/types/onboarding'
import { AlertTriangle, CheckCircle2, ChevronRight, ClipboardList, Save, ShieldAlert } from 'lucide-react'

const STORAGE_KEY = 'makasete-onboarding-assessments'
const DEFAULT_PHARMACY = { id: 'PH-01', name: '城南みらい薬局' }

const decisionMeta = {
  GO: {
    label: '受入準備OK',
    className: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
    description: '現時点では、初回受入に進める準備が概ね整っている状態です。営業・受入に進みつつ、残課題を管理します。',
    icon: CheckCircle2,
  },
  NOT_YET: {
    label: '要整備',
    className: 'border-amber-500/40 bg-amber-500/20 text-amber-300',
    description: '導入意思はあるものの、営業前に整えるべき条件が残っています。先に体制・教育・受入条件を固めます。',
    icon: AlertTriangle,
  },
  STOP: {
    label: '要方針見直し',
    className: 'border-rose-500/40 bg-rose-500/20 text-rose-300',
    description: '現時点で営業・患者獲得へ進むのはリスクが高い状態です。重大条件を先に是正し、再診断します。',
    icon: ShieldAlert,
  },
} as const

function getOptionLabel(question: DiagnosticQuestion, value: string) {
  return question.options?.find((option) => option.value === value)?.label ?? value
}

export default function OnboardingDiagnosticPage() {
  const [answers, setAnswers] = useState<DiagnosticAnswers>(SAMPLE_ONBOARDING_ANSWERS)
  const [activeAxis, setActiveAxis] = useState<DiagnosticAxis>('A')
  const [history, setHistory] = useState<OnboardingAssessmentRecord[]>([])
  const [latestSaved, setLatestSaved] = useState<OnboardingAssessmentRecord | null>(null)

  const questionsByAxis = useMemo(() => {
    return ONBOARDING_AXES.map((axis) => ({
      ...axis,
      questions: ONBOARDING_QUESTIONS.filter((question) => question.axis === axis.id),
    }))
  }, [])

  const evaluation = useMemo(() => evaluateOnboardingAnswers(answers), [answers])
  const nextActions = useMemo(() => buildNextActions(evaluation), [evaluation])
  const roadmap = useMemo(() => buildRoadmap(evaluation), [evaluation])
  const decisionInfo = decisionMeta[evaluation.decision]
  const DecisionIcon = decisionInfo.icon

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        setHistory(MOCK_ONBOARDING_HISTORY)
        return
      }
      const parsed = JSON.parse(raw) as OnboardingAssessmentRecord[]
      setHistory(Array.isArray(parsed) ? parsed : MOCK_ONBOARDING_HISTORY)
    } catch {
      setHistory(MOCK_ONBOARDING_HISTORY)
    }
  }, [])

  useEffect(() => {
    if (history.length === 0) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    } catch {}
  }, [history])

  const handleSaveAssessment = () => {
    const record = buildAssessmentRecord({
      pharmacyId: DEFAULT_PHARMACY.id,
      pharmacyName: DEFAULT_PHARMACY.name,
      answers,
      evaluation,
    })
    setLatestSaved(record)
    setHistory((current) => [record, ...current].slice(0, 10))
  }

  const totalQuestions = ONBOARDING_QUESTIONS.length
  const answeredQuestions = ONBOARDING_QUESTIONS.filter((question) => {
    const answer = answers[question.id]
    return typeof answer === 'string' ? answer.length > 0 : Array.isArray(answer) ? answer.length > 0 : answer != null
  }).length
  const completionRate = Math.round((answeredQuestions / totalQuestions) * 100)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-indigo-500">Onboarding Diagnostic</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">導入診断フォーム（MVP）</h1>
          <p className="mt-1 text-sm text-slate-500">
            仕様書・診断マトリクスをそのまま実装定義に落とした最小版です。診断→判定→不足条件確認→次アクション提示までつなぎます。
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            onClick={() => setAnswers(SAMPLE_ONBOARDING_ANSWERS)}
          >
            サンプル回答を反映
          </Button>
          <Button
            variant="outline"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            onClick={() => setAnswers({})}
          >
            クリア
          </Button>
          <Button className="bg-indigo-600 text-white hover:bg-indigo-500" onClick={handleSaveAssessment}>
            <Save className="mr-2 h-4 w-4" />
            診断結果を保存
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <ClipboardList className="h-4 w-4 text-indigo-500" />
                診断進捗
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">{answeredQuestions} / {totalQuestions} 問回答済み</p>
            </div>
            <div className="min-w-[220px]">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                <span>入力完了率</span>
                <span>{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-2 bg-slate-100" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {latestSaved ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          診断結果を保存しました。モック保存のため、このブラウザ内で履歴比較できます。
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">診断フォーム</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {questionsByAxis.map((axis) => (
                <Button
                  key={axis.id}
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveAxis(axis.id)}
                  className={activeAxis === axis.id
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}
                >
                  {axis.id}. {axis.name}
                </Button>
              ))}
            </div>

            {questionsByAxis
              .filter((axis) => axis.id === activeAxis)
              .map((axis) => (
                <div key={axis.id} className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">{axis.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{axis.purpose}</p>
                  </div>

                  {axis.questions.map((question) => {
                    const answer = answers[question.id]
                    return (
                      <div key={question.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{question.id}. {question.question}</p>
                            {question.helpText ? <p className="mt-1 text-xs text-slate-500">{question.helpText}</p> : null}
                          </div>
                          <div className="flex gap-2">
                            {question.required ? <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">必須</Badge> : null}
                            {question.affectsGoNoGo ? <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">判定影響</Badge> : null}
                          </div>
                        </div>

                        <div className="grid gap-2">
                          {question.options?.map((option) => {
                            const checked = answer === option.value
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.value }))}
                                className={checked
                                  ? 'rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-3 text-left'
                                  : 'rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-left hover:bg-white'}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className={checked ? 'text-indigo-700' : 'text-slate-700'}>{option.label}</span>
                                  <Badge variant="outline" className={checked ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500'}>
                                    score {option.score}
                                  </Badge>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-[#2a3553] bg-[#1a2035]">
            <CardHeader>
              <CardTitle className="text-white">診断結果</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">総合判定</p>
                    <div className="mt-2 flex items-center gap-2">
                      <DecisionIcon className="h-5 w-5 text-slate-700" />
                      <Badge variant="outline" className={decisionInfo.className}>{decisionInfo.label}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">薬局タイプ</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{evaluation.pharmacyType ?? '未判定'}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600">{decisionInfo.description}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="mb-3 text-sm font-semibold text-slate-900">軸別スコア</p>
                <div className="space-y-3">
                  {ONBOARDING_AXES.map((axis) => (
                    <div key={axis.id}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-slate-600">{axis.id}. {axis.name}</span>
                        <span className="text-slate-900">{evaluation.axisScores[axis.id].toFixed(1)}</span>
                      </div>
                      <Progress value={evaluation.axisScores[axis.id] * 20} className="h-2 bg-slate-100" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="mb-2 text-sm font-semibold text-slate-900">優先して見直すべき条件</p>
                {evaluation.triggeredStopReasons.length === 0 ? (
                  <p className="text-sm text-slate-500">該当なし</p>
                ) : (
                  <ul className="space-y-2 text-sm text-rose-300">
                    {evaluation.triggeredStopReasons.map((reason) => <li key={reason}>- {reason}</li>)}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="mb-2 text-sm font-semibold text-slate-900">GO未達項目</p>
                {evaluation.unmetGoThresholds.length === 0 ? (
                  <p className="text-sm text-slate-500">主要条件は概ね満たしています。</p>
                ) : (
                  <ul className="space-y-2 text-sm text-amber-300">
                    {evaluation.unmetGoThresholds.map((questionId) => {
                      const question = ONBOARDING_QUESTIONS.find((item) => item.id === questionId)
                      return <li key={questionId}>- {questionId}: {question?.question}</li>
                    })}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="mb-2 text-sm font-semibold text-slate-900">必須未回答</p>
                {evaluation.missingRequiredQuestionIds.length === 0 ? (
                  <p className="text-sm text-slate-500">なし</p>
                ) : (
                  <ul className="space-y-2 text-sm text-slate-600">
                    {evaluation.missingRequiredQuestionIds.map((questionId) => {
                      const question = ONBOARDING_QUESTIONS.find((item) => item.id === questionId)
                      return <li key={questionId}>- {questionId}: {question?.question}</li>
                    })}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="mb-2 text-sm font-semibold text-slate-900">次にやるべきこと</p>
                <ul className="space-y-2 text-sm text-slate-700">
                  {nextActions.map((action, index) => (
                    <li key={`${index}-${action}`} className="flex gap-2">
                      <span className="mt-0.5 text-indigo-500">{index + 1}.</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-900">タイプ別ロードマップ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {roadmap.map((task) => (
                <div key={task.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">{task.title}</p>
                    <Badge
                      variant="outline"
                      className={task.phase === 'now'
                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                        : task.phase === 'next'
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                          : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300'}
                    >
                      {task.phase === 'now' ? '今週やる' : task.phase === 'next' ? '次にやる' : 'その後やる'}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{task.description}</p>
                  {task.tags?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {task.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="border-slate-200 bg-white text-slate-600">{tag}</Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-900">現在の回答サマリー</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ONBOARDING_QUESTIONS.filter((question) => typeof answers[question.id] === 'string').map((question) => (
                <div key={question.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">{question.id}</p>
                  <p className="mt-1 text-sm text-slate-900">{question.question}</p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-indigo-600">
                    <ChevronRight className="h-4 w-4" />
                    <span>{getOptionLabel(question, answers[question.id] as string)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <OnboardingHistoryPanel current={latestSaved} history={history} />
        </div>
      </div>
    </div>
  )
}
