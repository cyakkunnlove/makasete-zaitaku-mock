'use client'

import { useState } from 'react'

// ========================================
// 初回患者受入フロー（3レーン: 薬局内・医師連携・患者/家族）
// ========================================

type Lane = 'pharmacy' | 'medical' | 'patient'
type StepStatus = 'todo' | 'doing' | 'done'

interface FlowStep {
  id: string
  phase: string
  title: string
  lane: Lane
  description: string
  actions: string[]
  documents: string[]
  tips: string[]
  pitfalls: string[]
  timeEstimate: string
}

const LANE_LABELS: Record<Lane, { label: string; icon: string; color: string }> = {
  pharmacy: { label: '薬局内', icon: '🏪', color: 'border-blue-300 bg-blue-50' },
  medical: { label: '医師・多職種連携', icon: '🏥', color: 'border-green-300 bg-green-50' },
  patient: { label: '患者・家族', icon: '👨‍👩‍👧', color: 'border-orange-300 bg-orange-50' },
}

const FLOW_STEPS: FlowStep[] = [
  // ==============================
  // Phase 1: 依頼受付
  // ==============================
  {
    id: 'f1', phase: '① 依頼受付', title: '在宅訪問の依頼を受ける', lane: 'medical',
    description: '在宅訪問のきっかけは4パターン。いずれの場合も最終的に医師の指示が必要。',
    actions: [
      '医師からの直接指示（訪問薬剤管理指導依頼書・情報提供書を受領）',
      '薬局窓口で薬剤師が問題を発見（残薬多い、飲み忘れ等）→ 医師に訪問の必要性を提案',
      'ケアマネジャー・訪問看護師からの相談 → 医師に連絡して指示を仰ぐ',
      '退院時カンファレンスでの依頼（病院薬剤師・MSWからの連絡）',
    ],
    documents: ['訪問薬剤管理指導依頼書・情報提供書（医師から）'],
    tips: [
      '地域の医師会・ケアマネ事業所に「在宅対応可能な薬局」として日頃から周知しておく',
      '退院時カンファレンスに積極的に参加すると、退院前から関われる',
    ],
    pitfalls: [
      '医師の指示なしに訪問を開始しない（算定要件を満たさない）',
      '薬剤師が必要と判断しても、患者の同意なしには開始できない',
    ],
    timeEstimate: '依頼受付当日',
  },
  {
    id: 'f2', phase: '② 情報収集', title: '患者情報を収集する', lane: 'pharmacy',
    description: '初回訪問前に必要な情報を集める。情報が不足すると訪問が非効率になる。',
    actions: [
      '処方内容の確認（現在の服用薬、注射薬、医療材料）',
      '患者基本情報: 氏名、住所、連絡先、介護度、保険情報',
      'アレルギー歴、副作用歴、合併症、他科受診、併用薬',
      '生活状況: 独居か同居か、介護者の有無、ADL、認知機能',
      '処方箋の受け渡し方法の確認（FAX、アプリ、電子処方箋、家族持ち込み）',
    ],
    documents: ['お薬手帳（写し）', '診療情報提供書（あれば）', '退院時サマリー（あれば）'],
    tips: [
      '介護保険証の確認を忘れない→介護度によって医療保険/介護保険のどちらで算定するか決まる',
      'ケアマネジャーが最も多くの情報を持っていることが多い。まず連絡する',
      '残薬状況は訪問してみないと分からないことが多い',
    ],
    pitfalls: [
      '介護保険の確認漏れ→保険請求ミスの最大要因',
      '他の薬局で調剤されている薬を見落とすと相互作用チェックが不完全になる',
    ],
    timeEstimate: '依頼後1〜2日',
  },
  {
    id: 'f3', phase: '② 情報収集', title: '受入可否を判断する', lane: 'pharmacy',
    description: '自局で対応可能かを受入条件表に照らして判断。対応困難なら早めに連携先を紹介。',
    actions: [
      '受入条件表で確認: 距離、対応時間帯、必要な設備（クリーンベンチ等）、麻薬対応可否',
      '無菌調剤が必要な場合: クリーンベンチの有無、共同利用先の確認',
      '麻薬が必要な場合: 必要品目の在庫・発注',
      '医療材料が必要な場合: 在庫確認、仕入れルートの確保',
      '対応困難な場合: 在宅対応可能な他の薬局に連携（在宅協力薬局制度）',
    ],
    documents: ['受入条件表（自局で作成したもの）'],
    tips: [
      '「全部自分でやる」必要はない。共同利用・在宅協力薬局制度を活用',
      '初めての在宅患者は「比較的安定した患者」から始めるのがおすすめ',
    ],
    pitfalls: [
      '対応できない場合に「できません」で終わらない→連携先を紹介するところまでが薬局の役割',
    ],
    timeEstimate: '情報収集と同日',
  },
  // ==============================
  // Phase 2: 契約・計画
  // ==============================
  {
    id: 'f4', phase: '③ 同意取得・契約', title: '患者/家族への説明と同意取得', lane: 'patient',
    description: '訪問サービスの内容・費用を説明し、書面で同意を得る。介護保険の場合は契約書が必要。',
    actions: [
      'サービス内容の説明: 訪問頻度、時間、何をするか',
      '費用の説明: 医療保険の場合の自己負担額、介護保険の場合の自己負担額（1〜3割）',
      '医療保険の場合: 患者（家族）の口頭同意でも可（記録は必須）',
      '介護保険の場合: 「居宅療養管理指導の契約書・重要事項説明書」を締結（利用者用・薬局用の2通）',
      '個人情報の取り扱いについて説明・同意',
    ],
    documents: [
      '居宅療養管理指導の契約書（介護保険の場合・2通）',
      '重要事項説明書',
      '個人情報同意書',
    ],
    tips: [
      '費用説明は具体的な金額で。「月に○回訪問して、1回あたり○円（○割負担）」',
      '家族がキーパーソンの場合、家族の連絡先・都合の良い訪問時間を確認',
      '訪問の曜日・時間帯の希望を聞いておく',
    ],
    pitfalls: [
      '介護保険の契約書がないまま訪問を開始→返戻リスク',
      '費用説明が不十分→あとでトラブルになる',
      '認知症の場合は家族（成年後見人）との契約が必要なケースがある',
    ],
    timeEstimate: '初回訪問時または事前に',
  },
  {
    id: 'f5', phase: '③ 同意取得・契約', title: '薬学的管理指導計画書の作成', lane: 'pharmacy',
    description: '訪問前に計画書を作成。訪問の目的・内容・頻度を明記。算定の根拠となる重要書類。',
    actions: [
      '実施すべき指導内容を明記',
      '訪問回数・訪問間隔を設定（月2〜4回が一般的。末期がんは月8回まで）',
      '処方医への報告方法・タイミングを記載',
      '他の医療・介護サービスとの連携方針',
      '目標（服薬アドヒアランス改善、副作用モニタリング等）',
    ],
    documents: ['薬学的管理指導計画書'],
    tips: [
      '計画書は定期的に見直す（患者の状態変化に応じて）',
      'ケアマネジャーのケアプランとの整合性を確認',
    ],
    pitfalls: [
      '計画書なしに訪問すると算定要件を満たさない',
      '「定期的に訪問する」だけの曖昧な計画は不可。具体的な指導内容が必要',
    ],
    timeEstimate: '初回訪問前',
  },
  {
    id: 'f6', phase: '③ 同意取得・契約', title: 'ケアマネジャーへの連絡', lane: 'medical',
    description: '介護保険の場合、ケアマネにサービス開始を連絡。ケアプランへの位置づけが必要。',
    actions: [
      'ケアマネジャーに「居宅療養管理指導」を開始する旨を連絡',
      'ケアプランへの位置づけを依頼',
      '訪問予定（頻度・曜日）を共有',
      '連絡先の交換（緊急時の連絡体制）',
    ],
    documents: [],
    tips: [
      '医療保険の場合でもケアマネに連絡しておくと連携がスムーズ',
      'サービス担当者会議に参加できるとベスト',
    ],
    pitfalls: [
      '介護保険で算定するのにケアマネへの連絡を忘れる→ケアプランに位置づけられない',
    ],
    timeEstimate: '同意取得後すぐ',
  },
  // ==============================
  // Phase 3: 初回訪問
  // ==============================
  {
    id: 'f7', phase: '④ 初回訪問', title: '処方箋を受け取り調剤する', lane: 'pharmacy',
    description: '処方箋の受け渡しパターンを確認し、調剤を行う。',
    actions: [
      '処方箋受領（FAX→原本は後日回収、アプリ、電子処方箋、家族持ち込み）',
      '処方内容の確認・疑義照会',
      '調剤（注射薬の無菌調製が必要な場合はクリーンベンチで実施）',
      '必要な医療材料・衛生材料の準備',
      '訪問に必要な持ち物の準備（血圧計、パルスオキシメーター、バイタルチェックシート等）',
    ],
    documents: ['処方箋', '薬歴（薬剤服用歴）'],
    tips: [
      '初回は時間がかかるので余裕を持ったスケジュールで',
      '持参忘れが多い物: 契約書、名札、スリッパ、薬歴（タブレット）',
    ],
    pitfalls: [
      'FAXの処方箋は原本ではない。後日必ず原本を回収する（原本なしは算定不可）',
    ],
    timeEstimate: '訪問当日（訪問前）',
  },
  {
    id: 'f8', phase: '④ 初回訪問', title: '患者宅を訪問する', lane: 'patient',
    description: '実際に患者宅を訪問し、薬学的管理指導を実施する。初回は特に丁寧に。',
    actions: [
      '自己紹介と訪問の目的を説明',
      '薬の説明・交付（一包化、お薬カレンダーの設置等）',
      '残薬の確認・整理',
      '服薬状況の確認（飲めているか、飲み方は正しいか）',
      'バイタルチェック（血圧、脈拍、SpO2等）',
      '生活環境の確認（冷蔵庫に保管すべき薬がある場合等）',
      '副作用の確認',
      '患者・家族からの質問対応',
      '次回訪問日の確認',
    ],
    documents: ['訪問薬剤管理指導記録（報告書）'],
    tips: [
      '初回は「信頼関係の構築」が最優先。いきなり指導モードにならない',
      '生活環境を観察する（手すり、段差、冷蔵庫の中、ゴミ等）→ ADLや認知機能の手がかり',
      '家族がいる場合は家族への説明も重要（特に麻薬を使用する場合）',
      '写真を撮る場合は必ず同意を得る',
    ],
    pitfalls: [
      '訪問時間が短すぎると「薬を置いただけ」と見なされ算定が否認されるリスク',
      '玄関先で薬を渡すだけは「訪問薬剤管理指導」に該当しない',
    ],
    timeEstimate: '30〜60分（初回）',
  },
  // ==============================
  // Phase 4: 訪問後
  // ==============================
  {
    id: 'f9', phase: '⑤ 訪問後の報告', title: '医師への報告（トレーシングレポート）', lane: 'medical',
    description: '訪問結果を処方医に報告する。これが算定要件の一つ。',
    actions: [
      '訪問薬剤管理指導記録（報告書）を作成',
      '処方医にFAXまたは手渡しで報告（服薬状況、残薬、副作用、バイタル、提案事項）',
      '疑義や処方変更の提案がある場合はトレーシングレポートで送付',
      '緊急性がある場合は電話で即報告',
    ],
    documents: [
      '訪問薬剤管理指導記録（報告書）',
      'トレーシングレポート（必要に応じて）',
    ],
    tips: [
      '報告は簡潔に。医師が読む時間は短い。A4 1枚以内が理想',
      '「問題なし」も立派な報告。問題がないことを確認したことが価値',
    ],
    pitfalls: [
      '医師への報告を怠ると算定要件を満たさない（報告は必須）',
      '介護保険の場合はケアマネへの情報提供も必須（毎月）',
    ],
    timeEstimate: '訪問後当日中',
  },
  {
    id: 'f10', phase: '⑤ 訪問後の報告', title: 'ケアマネへの情報提供', lane: 'medical',
    description: '介護保険で算定する場合、ケアマネジャーへの情報提供が必須。',
    actions: [
      '居宅療養管理指導の実施内容をケアマネに報告',
      '服薬状況、残薬、生活上の気づき等を共有',
      '次回訪問予定を連絡',
    ],
    documents: ['ケアマネジャーへの情報提供書'],
    tips: [
      '「薬の話だけ」でなく、生活上の気づきも共有すると連携の質が上がる',
      'FAX、メール、ICTツール等で共有。地域によって主流な方法が異なる',
    ],
    pitfalls: [
      '介護保険で算定する場合、ケアマネへの情報提供がないと算定要件を満たさない',
    ],
    timeEstimate: '訪問後当日〜翌営業日',
  },
  {
    id: 'f11', phase: '⑤ 訪問後の報告', title: '薬歴記載・算定', lane: 'pharmacy',
    description: '薬歴への記録と保険請求の処理。',
    actions: [
      '薬剤服用歴管理記録（薬歴）に訪問内容を記載',
      '保険請求: 医療保険→在宅患者訪問薬剤管理指導料、介護保険→居宅療養管理指導費',
      '加算の確認: 麻薬管理指導加算(100点)、無菌製剤処理加算(69/79点)等',
      '介護保険の場合: 国保連への請求（介護給付費明細書）',
    ],
    documents: ['薬歴', 'レセプト（調剤報酬明細書/介護給付費明細書）'],
    tips: [
      '薬歴はSOAP形式で記載すると後から見返しやすい',
      '算定漏れを防ぐため、訪問時チェックリストを活用',
    ],
    pitfalls: [
      '薬歴記載が不十分だと個別指導で返戻リスク',
      '「単一建物」の人数カウントを間違えない（同一月・同一建物の算定患者数）',
    ],
    timeEstimate: '訪問後当日中',
  },
]

// ========================================
// 必要書類チェックリスト
// ========================================

const DOCUMENT_CHECKLIST = [
  { doc: '訪問薬剤管理指導依頼書・情報提供書', from: '医師', timing: '依頼時', required: '医療保険: 必須', note: '医師の指示を受けた証拠。原本保管' },
  { doc: '薬学的管理指導計画書', from: '薬局で作成', timing: '初回訪問前', required: '必須', note: '算定要件。訪問内容・頻度・目標を記載' },
  { doc: '居宅療養管理指導の契約書', from: '薬局で作成', timing: '初回訪問前〜初回', required: '介護保険: 必須', note: '利用者用・薬局用の2通。認知症の場合は家族署名' },
  { doc: '重要事項説明書', from: '薬局で作成', timing: '契約時', required: '介護保険: 必須', note: 'サービス内容・費用・苦情窓口等を記載' },
  { doc: '個人情報同意書', from: '薬局で作成', timing: '契約時', required: '推奨', note: '情報共有の範囲を明記' },
  { doc: '処方箋', from: '医師', timing: '毎回', required: '必須', note: 'FAXの場合は原本を後日回収。原本なしは算定不可' },
  { doc: '訪問薬剤管理指導記録（報告書）', from: '薬局で作成', timing: '毎回訪問後', required: '必須', note: '医師への報告用。算定要件' },
  { doc: 'ケアマネへの情報提供書', from: '薬局で作成', timing: '毎回訪問後', required: '介護保険: 必須', note: '居宅療養管理指導の算定要件' },
  { doc: '薬歴（薬剤服用歴管理記録）', from: '薬局で記載', timing: '毎回', required: '必須', note: 'SOAP形式推奨。個別指導で確認される' },
]

// ========================================
// メインコンポーネント
// ========================================

export function AcceptanceFlow() {
  const [expandedStep, setExpandedStep] = useState<string | null>('f1')
  const [viewMode, setViewMode] = useState<'flow' | 'lane' | 'docs'>('flow')
  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>(
    Object.fromEntries(FLOW_STEPS.map(s => [s.id, 'todo']))
  )

  const toggleStatus = (id: string) => {
    setStepStatuses(prev => ({
      ...prev,
      [id]: prev[id] === 'todo' ? 'doing' : prev[id] === 'doing' ? 'done' : 'todo',
    }))
  }

  const phases = Array.from(new Set(FLOW_STEPS.map(s => s.phase)))

  return (
    <div className="space-y-6">
      {/* ビュー切替 */}
      <div className="flex gap-2">
        {[
          { key: 'flow', label: '📋 フロー順' },
          { key: 'lane', label: '🏷️ レーン別' },
          { key: 'docs', label: '📄 書類チェック' },
        ].map(v => (
          <button
            key={v.key}
            onClick={() => setViewMode(v.key as typeof viewMode)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              viewMode === v.key ? 'bg-blue-600 text-white' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* フロー順ビュー */}
      {viewMode === 'flow' && (
        <div className="space-y-4">
          {phases.map(phase => (
            <section key={phase}>
              <h3 className="mb-3 text-lg font-bold text-gray-900">{phase}</h3>
              <div className="space-y-2">
                {FLOW_STEPS.filter(s => s.phase === phase).map(step => {
                  const isExpanded = expandedStep === step.id
                  const lane = LANE_LABELS[step.lane]
                  const status = stepStatuses[step.id]
                  return (
                    <div key={step.id} className={`rounded-xl border overflow-hidden ${lane.color}`}>
                      <button
                        onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                        className="w-full p-4 text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleStatus(step.id) }}
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                                status === 'done' ? 'border-green-500 bg-green-500 text-white' :
                                status === 'doing' ? 'border-blue-500 bg-blue-100 text-blue-700' :
                                'border-gray-300 bg-white text-gray-400'
                              }`}
                            >
                              {status === 'done' ? '✓' : status === 'doing' ? '⏳' : ''}
                            </button>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{lane.icon}</span>
                                <span className="font-semibold text-gray-900">{step.title}</span>
                              </div>
                              <p className="mt-0.5 text-xs text-gray-500">{step.timeEstimate}</p>
                            </div>
                          </div>
                          <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-200 bg-white p-4 space-y-3">
                          <p className="text-sm text-gray-700">{step.description}</p>

                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-1">✅ やること</p>
                            <ul className="space-y-1">
                              {step.actions.map((a, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                  <span className="text-blue-400 shrink-0">•</span>{a}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {step.documents.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-600 mb-1">📄 必要書類</p>
                              <div className="flex flex-wrap gap-1">
                                {step.documents.map(d => (
                                  <span key={d} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{d}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {step.tips.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-600 mb-1">💡 コツ</p>
                              <ul className="space-y-1">
                                {step.tips.map((t, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                                    <span className="shrink-0">→</span>{t}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {step.pitfalls.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-600 mb-1">⚠️ 落とし穴</p>
                              <ul className="space-y-1">
                                {step.pitfalls.map((p, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                                    <span className="shrink-0">❌</span>{p}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* レーン別ビュー */}
      {viewMode === 'lane' && (
        <div className="space-y-6">
          {(['pharmacy', 'medical', 'patient'] as Lane[]).map(laneKey => {
            const lane = LANE_LABELS[laneKey]
            const steps = FLOW_STEPS.filter(s => s.lane === laneKey)
            return (
              <section key={laneKey} className={`rounded-2xl border p-6 shadow-sm ${lane.color}`}>
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                  <span>{lane.icon}</span> {lane.label}
                </h3>
                <div className="space-y-3">
                  {steps.map((step, i) => (
                    <div key={step.id} className="rounded-lg border border-gray-200 bg-white p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">{i + 1}</span>
                        <span className="font-semibold text-gray-900">{step.title}</span>
                      </div>
                      <p className="text-sm text-gray-600">{step.description}</p>
                      <p className="mt-1 text-xs text-gray-400">⏱ {step.timeEstimate} | 📋 {step.phase}</p>
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {/* 書類チェックリスト */}
      {viewMode === 'docs' && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-gray-900">📄 必要書類チェックリスト</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">書類</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">作成元</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">タイミング</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">必須</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">備考</th>
                </tr>
              </thead>
              <tbody>
                {DOCUMENT_CHECKLIST.map((d, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-3 py-2 font-medium text-gray-900">{d.doc}</td>
                    <td className="px-3 py-2 text-gray-600">{d.from}</td>
                    <td className="px-3 py-2 text-gray-600">{d.timing}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        d.required === '必須' ? 'bg-red-100 text-red-700' :
                        d.required.includes('必須') ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{d.required}</span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">{d.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* フロー全体の注意事項 */}
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <h3 className="mb-2 font-bold text-amber-800">📌 初回受入の全体像</h3>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { phase: '依頼〜情報収集', days: '1〜2日', icon: '📞' },
            { phase: '同意・契約・計画', days: '2〜3日', icon: '📝' },
            { phase: '初回訪問', days: '当日', icon: '🏠' },
            { phase: '報告・記録', days: '訪問後当日', icon: '📊' },
          ].map((p, i) => (
            <div key={i} className="rounded-lg border border-amber-200 bg-white p-3 text-center">
              <p className="text-2xl">{p.icon}</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{p.phase}</p>
              <p className="text-xs text-gray-500">{p.days}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-amber-700">
          💡 依頼から初回訪問まで、早ければ<b>3〜5日</b>で完了。在宅未経験の薬局でも、このフローに沿って進めれば迷わず受入ができます。
        </p>
      </section>
    </div>
  )
}
