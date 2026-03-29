'use client'

import { useState } from 'react'

// ========================================
// 無菌調剤の手順（ステップ形式）
// ========================================

interface ProcedureStep {
  id: string
  phase: string
  title: string
  details: string[]
  caution: string[]
  timeEstimate: string
}

const PROCEDURE: ProcedureStep[] = [
  {
    id: 'p1', phase: '準備', title: 'クリーンベンチの起動・清拭',
    details: [
      'クリーンベンチを使用開始の30分前に起動する（HEPAフィルターを通したクリーンな空気が安定するまでの時間）',
      '消毒用エタノール（70%）を浸した不織布で、クリーンベンチの作業面を奥から手前に拭く',
      '側面も同様に上から下へ拭く',
      '清拭後、5分以上乾燥させてから作業開始',
    ],
    caution: [
      'アルコールだけではブドウ糖などの糖類は除去できない。まず水拭きで汚れを落としてからアルコール清拭',
      '清拭の方向は「奥→手前」「上→下」（クリーンな空気の流れに沿う）',
      'スプレーでの噴霧は微粒子を舞い上げるので不織布に含ませて拭く',
    ],
    timeEstimate: '起動30分前＋清拭5分',
  },
  {
    id: 'p2', phase: '準備', title: '手洗い・個人防護具の装着',
    details: [
      '手指衛生: 石鹸で手洗い → ペーパータオルで乾燥 → 速乾性手指消毒剤',
      '爪は短く切っておく。マニキュア・指輪は外す',
      'ヘアキャップを被る（髪全体・耳まで覆う）',
      'マスクを装着（鼻・口を完全に覆う）',
      'ディスポーザブルガウンを着用',
      'ニトリル手袋を装着（ガウンの袖口の上から）',
      '手袋装着後、速乾性手指消毒剤で手袋表面を消毒',
    ],
    caution: [
      'コンタクトレンズ装着者は保護メガネを推奨（抗がん剤調製時は必須）',
      'ラテックスアレルギーがある場合はニトリル手袋を使用',
      '手袋装着後は不必要な場所に触れない',
    ],
    timeEstimate: '5分',
  },
  {
    id: 'p3', phase: '準備', title: '使用する薬剤・器材の準備',
    details: [
      '処方箋と調製指示書を確認（ダブルチェック）',
      '必要な注射薬、輸液バッグ、シリンジ、注射針、アルコール綿を準備',
      '各アンプル・バイアルの外装をアルコール綿で清拭',
      '使用期限を確認',
      'クリーンベンチ内に必要最小限の物品を配置（物が多いと気流が乱れる）',
    ],
    caution: [
      'クリーンベンチ内に段ボール・紙の外箱を持ち込まない（微粒子の発生源）',
      '吹出口（HEPAフィルター面）の前に物を置かない（気流を遮断する）',
      '物品は作業面の手前半分に配置（奥半分はクリーンエリア）',
    ],
    timeEstimate: '5〜10分',
  },
  {
    id: 'p4', phase: '調製', title: 'TPN（高カロリー輸液）の調製',
    details: [
      '輸液バッグのゴム栓をアルコール綿で消毒（円を描くように外側へ）',
      'バイアルのゴム栓も同様に消毒',
      'シリンジで必要量を吸引し、輸液バッグに注入',
      '混合順序: ①電解質（カリウム等）→ ②微量元素（最後の方）→ ③ビタミン剤（最後）',
      '各薬剤注入後、バッグを軽く転倒混和',
      '最終的にバッグ全体を10回程度転倒混和',
      '外観確認（混濁・異物・変色がないこと）',
      '遮光カバーを装着（ビタミン含有の場合）',
      'ラベル貼付（患者名・薬剤名・調製日時・使用期限・調製者）',
    ],
    caution: [
      'ビタミン剤は光分解しやすいため最後に混合し、遮光カバー必須',
      '微量元素（鉄）はビタミンCと反応するため、添加は投与直前が望ましい',
      'カルシウムとリン酸は沈殿を起こす可能性→濃度と添加順序に注意',
      'インスリンを混注する場合、バッグ内壁への吸着を考慮（転倒混和を十分に）',
    ],
    timeEstimate: '15〜30分',
  },
  {
    id: 'p5', phase: '調製', title: '麻薬注射剤の調製（PCAポンプ用）',
    details: [
      'モルヒネ注やフェンタニル注をシリンジまたはPCAカセットに充填',
      '希釈が必要な場合: 生食で指示濃度に調整',
      '希釈不要な場合: アンプルからシリンジに直接吸引',
      'エア抜きを確認（気泡が入らないように）',
      '調製量と指示量の照合（ダブルチェック）',
      'ラベル貼付（患者名・薬剤名・濃度・調製日時・調製者）',
      '麻薬帳簿に使用量を記録（残液がある場合はその量も）',
    ],
    caution: [
      '麻薬の取り扱いは必ず2名で行う（1名調製・1名確認）',
      '残液は麻薬帳簿に記録し、適切に廃棄（廃棄時は2名立会い）',
      'アンプルカット時にガラス片が入らないよう注意',
      'PCAポンプの流量設定も合わせて確認',
    ],
    timeEstimate: '10〜15分',
  },
  {
    id: 'p6', phase: '調製', title: '抗がん剤の調製（※安全キャビネットが望ましい）',
    details: [
      '安全キャビネット（陰圧型）での調製が推奨。クリーンベンチ（陽圧型）での調製はリスクあり',
      '閉鎖式薬物移送システム（CSTD）の使用を推奨',
      'ガウン・ダブルグローブ・保護メガネ・N95マスクを装着',
      '調製手順はTPN同様だが、曝露防止に最大限の注意',
      'スピルキット（漏出時対応セット）を手元に準備',
    ],
    caution: [
      'クリーンベンチは陽圧（ベンチ内→外に空気が出る）→ 抗がん剤が調製者に曝露するリスク',
      '安全キャビネットがない場合は、処方医・病院薬剤部と連携して対応を協議',
      '抗がん剤の廃棄は専用の感染性廃棄物容器へ',
    ],
    timeEstimate: '15〜30分',
  },
  {
    id: 'p7', phase: '後片付け', title: '清掃・記録',
    details: [
      '使用後のクリーンベンチを消毒用エタノールで清拭',
      '使い捨ての器材は適切に廃棄（針は耐貫通性容器へ）',
      '手袋・ガウンを脱いで手洗い',
      '調製記録の作成（調製日時、調製者、使用薬剤、ロット番号等）',
      '環境モニタリング記録（定期的に実施する場合）',
    ],
    caution: [
      'クリーンベンチは使用後もHEPAフィルターを15〜30分稼働させてから停止',
      'HEPAフィルターの交換は年1回程度（メーカー推奨に従う）',
    ],
    timeEstimate: '5〜10分',
  },
]

// ========================================
// クリーンベンチの種類と選び方
// ========================================

const BENCH_TYPES = [
  {
    type: 'クリーンベンチ（水平層流型）',
    icon: '🟦',
    airflow: '奥→手前（陽圧）',
    purpose: 'TPN調製、麻薬注射剤の調製',
    pros: ['調製物の無菌性を確保', '比較的安価', '薬局で最も一般的'],
    cons: ['抗がん剤調製には不適（調製者に曝露）', '排気が調製者に向かう'],
    price: '50〜150万円（中古30万円〜）',
  },
  {
    type: '安全キャビネット（クラスII）',
    icon: '🟩',
    airflow: '下降気流＋前面吸引（陰圧）',
    purpose: '抗がん剤調製、危険薬の調製',
    pros: ['調製者への曝露を防止', '調製物の無菌性も確保', '抗がん剤調製のゴールドスタンダード'],
    cons: ['高価', 'サイズが大きい', '排気ダクトが必要な場合あり'],
    price: '200〜500万円',
  },
  {
    type: 'アイソレーター',
    icon: '🟪',
    airflow: '完全密閉＋内部陽圧/陰圧',
    purpose: '最高レベルの無菌環境が必要な調製',
    pros: ['最高レベルの無菌保証', '調製者への曝露も完全防止'],
    cons: ['非常に高価', '操作がグローブ越しで難しい', '薬局ではまだ稀'],
    price: '500万円〜',
  },
]

// ========================================
// よくあるミスと対策
// ========================================

const COMMON_MISTAKES = [
  { mistake: 'クリーンベンチの起動直後に調製を始める', consequence: 'HEPAフィルターの気流が安定しておらず、無菌性が保証されない', solution: '最低30分前に起動。可能なら常時稼働がベスト' },
  { mistake: '吹出口の前に物を置く', consequence: '層流が乱れてクリーンゾーンが崩れる', solution: '物品は作業面の手前半分に。吹出口面から15cm以上離す' },
  { mistake: 'クリーンベンチ内で手を大きく動かす', consequence: '乱流が発生して微粒子が混入するリスク', solution: '動きは最小限に。ゆっくり、滑らかに動かす' },
  { mistake: 'アンプルを素手でカットする', consequence: 'ガラス片が混入。手指の切傷リスク', solution: 'アルコール綿でアンプル首を拭いてからカット。ガラス片がバイアル内に入らないよう斜めに吸引' },
  { mistake: 'TPN混合で微量元素とビタミンを先に入れる', consequence: '鉄イオンがビタミンCの酸化を促進。安定性低下', solution: '混合順序: 電解質→アミノ酸→糖→微量元素→ビタミン（最後）' },
  { mistake: 'バッグの転倒混和が不十分', consequence: '濃度ムラが生じ、投与初期に高濃度の電解質が急速投与されるリスク', solution: '最低10回は転倒混和。特にカリウム添加時は入念に' },
  { mistake: '遮光カバーを忘れる', consequence: 'ビタミンB2等が光分解→効果減弱', solution: 'ビタミン入りTPNは必ず遮光カバー。調製後すぐに装着' },
  { mistake: '調製後のラベルに情報が不足', consequence: '患者取り違え、使用期限超過のリスク', solution: 'ラベルに: 患者名、薬剤名、濃度、調製日時、使用期限、調製者を必ず記載' },
]

// ========================================
// メインコンポーネント
// ========================================

export function CleanroomGuide() {
  const [activeTab, setActiveTab] = useState<'procedure' | 'equipment' | 'mistakes'>('procedure')
  const [expandedStep, setExpandedStep] = useState<string | null>('p1')

  return (
    <div className="space-y-6">
      {/* タブ */}
      <div className="flex gap-2">
        {[
          { key: 'procedure', label: '📋 調製手順' },
          { key: 'equipment', label: '🔬 設備の種類' },
          { key: 'mistakes', label: '⚠️ よくあるミス' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.key ? 'bg-blue-600 text-white' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 調製手順タブ */}
      {activeTab === 'procedure' && (
        <div className="space-y-3">
          {['準備', '調製', '後片付け'].map(phase => (
            <section key={phase}>
              <h3 className="mb-2 text-base font-bold text-gray-900">{phase === '準備' ? '🔧' : phase === '調製' ? '🧪' : '🧹'} {phase}</h3>
              <div className="space-y-2">
                {PROCEDURE.filter(s => s.phase === phase).map(step => {
                  const isExpanded = expandedStep === step.id
                  return (
                    <div key={step.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                      <button onClick={() => setExpandedStep(isExpanded ? null : step.id)} className="w-full p-4 text-left">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{step.title}</p>
                            <p className="text-xs text-gray-500">⏱ {step.timeEstimate}</p>
                          </div>
                          <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
                          <div>
                            <p className="text-xs font-semibold text-blue-600 mb-1">✅ 手順</p>
                            <ol className="space-y-1 list-decimal ml-4">
                              {step.details.map((d, i) => (
                                <li key={i} className="text-sm text-gray-700">{d}</li>
                              ))}
                            </ol>
                          </div>
                          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                            <p className="text-xs font-semibold text-red-700 mb-1">⚠️ 注意点</p>
                            <ul className="space-y-1">
                              {step.caution.map((c, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-red-700"><span className="shrink-0">❌</span>{c}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}

          {/* チェックリスト */}
          <section className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-sm">
            <h3 className="mb-3 font-bold text-green-800">✅ 調製前チェックリスト（印刷して現場に貼る用）</h3>
            <div className="grid gap-2 md:grid-cols-2">
              {[
                'クリーンベンチ起動済み（30分前）',
                '作業面の清拭完了（水拭き→アルコール）',
                '手洗い・手指消毒完了',
                'ヘアキャップ・マスク・ガウン・手袋装着',
                '処方箋と調製指示書のダブルチェック',
                '使用薬剤の期限確認',
                'アンプル/バイアルの外装清拭',
                'クリーンベンチ内の物品配置確認',
                '遮光カバー・ラベル準備',
                '麻薬の場合: 2名体制確認',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-white border border-green-200 p-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-green-400 text-xs">　</span>
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* 設備タブ */}
      {activeTab === 'equipment' && (
        <div className="space-y-4">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-gray-900">🔬 クリーンベンチ・安全キャビネットの種類</h3>
            <div className="space-y-4">
              {BENCH_TYPES.map((bench, i) => (
                <div key={i} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{bench.icon}</span>
                    <h4 className="font-bold text-gray-900">{bench.type}</h4>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs text-gray-500">気流方向</p>
                      <p className="text-sm font-medium">{bench.airflow}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">主な用途</p>
                      <p className="text-sm font-medium">{bench.purpose}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">価格帯</p>
                      <p className="text-sm font-medium text-blue-700">{bench.price}</p>
                    </div>
                  </div>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold text-green-600">メリット</p>
                      {bench.pros.map((p, j) => <p key={j} className="text-xs text-gray-600">✅ {p}</p>)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-red-600">デメリット</p>
                      {bench.cons.map((c, j) => <p key={j} className="text-xs text-gray-600">❌ {c}</p>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
            <h3 className="mb-3 font-bold text-gray-900">💡 薬局での選び方</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>✅ <b>まず始めるなら: クリーンベンチ（水平層流型）。</b>TPN・麻薬注射剤の調製はこれで十分。50〜100万円で導入可能。</p>
              <p>✅ <b>2026年改定で設備要件は撤廃。</b>在宅薬学総合体制加算2の施設基準からクリーンベンチの設置要件がなくなった（実績要件に変更）。ただし無菌製剤処理加算の算定にはクリーンベンチ等が必要。</p>
              <p>✅ <b>共同利用も選択肢。</b>他の薬局のクリーンベンチを共同利用する契約を結べば、設備投資なしで無菌製剤処理加算が算定可能。</p>
              <p>⚠️ <b>抗がん剤を扱う場合は安全キャビネットを検討。</b>クリーンベンチでの抗がん剤調製は調製者への曝露リスクがある。</p>
            </div>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <h3 className="mb-3 font-bold text-amber-800">🔧 維持管理</h3>
            <div className="space-y-2 text-sm text-amber-700">
              <p>• <b>HEPAフィルター交換:</b> メーカー推奨に従い年1回程度。交換時は業者に依頼。</p>
              <p>• <b>風速測定:</b> 年1回以上。風速が基準値を下回ったらフィルター交換。</p>
              <p>• <b>清浄度確認:</b> 定期的に落下菌試験等を実施。記録を保管。</p>
              <p>• <b>プレフィルター:</b> 月1回確認、汚れたら交換（HEPAフィルターの寿命に影響）。</p>
            </div>
          </section>
        </div>
      )}

      {/* よくあるミスタブ */}
      {activeTab === 'mistakes' && (
        <div className="space-y-3">
          <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <h3 className="mb-1 text-lg font-bold text-red-800">⚠️ よくあるミスと対策</h3>
            <p className="mb-4 text-sm text-red-600">初心者が陥りやすいミスを集約。研修時のチェックポイントとしても使えます。</p>
          </section>

          {COMMON_MISTAKES.map((m, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700">{i + 1}</span>
                <div className="space-y-1">
                  <p className="font-semibold text-red-800">❌ {m.mistake}</p>
                  <p className="text-sm text-gray-600"><span className="font-medium">→ 結果:</span> {m.consequence}</p>
                  <p className="text-sm text-green-700"><span className="font-medium">✅ 対策:</span> {m.solution}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
