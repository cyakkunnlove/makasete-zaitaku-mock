'use client'

import { useState } from 'react'

// ========================================
// ポンプ分類と機種データ（事実ベース）
// ========================================

type PumpCategory = 'electric-syringe' | 'electric-reservoir' | 'disposable' | 'infusion'

interface PumpInfo {
  id: string
  name: string
  manufacturer: string
  category: PumpCategory
  features: string[]
  pcaFunction: boolean
  usedFor: string[]
  syringeSize?: string
  flowRate?: string
  weight?: string
  batteryLife?: string
  keyPoints: string[]
  alarms: string[]
  image?: string
}

const PUMP_CATEGORIES: { key: PumpCategory; label: string; icon: string; desc: string }[] = [
  { key: 'electric-syringe', label: '電動式シリンジポンプ', icon: '💉', desc: 'シリンジを装着して微量持続投与。在宅緩和ケアで最も使用される' },
  { key: 'electric-reservoir', label: '電動式リザーバーポンプ（PCAポンプ）', icon: '🔋', desc: 'カセット/バッグから精密輸液。PCA機能搭載で患者自身がレスキュー可能' },
  { key: 'disposable', label: 'ディスポーザブル（バルーン型）', icon: '🎈', desc: 'バルーンの収縮力で薬液注入。電源不要。一定流量で使い捨て' },
  { key: 'infusion', label: '輸液ポンプ', icon: '💧', desc: '点滴スタンドに設置。TPN等の大量輸液に使用。在宅でも使用あり' },
]

const PUMPS: PumpInfo[] = [
  // 電動式シリンジポンプ
  {
    id: 'te-361', name: 'テルフュージョン小型シリンジポンプ TE-361PCA', manufacturer: 'テルモ',
    category: 'electric-syringe', pcaFunction: true,
    features: ['10mLシリンジ専用', 'PCA機能搭載', '小型・軽量（約200g）', '流量0.01〜99.9mL/h'],
    usedFor: ['モルヒネ持続皮下注', 'フェンタニル持続静注', '在宅緩和ケア全般'],
    syringeSize: '10mL', flowRate: '0.01〜99.9mL/h', weight: '約200g', batteryLife: '約50時間（単3電池×2）',
    keyPoints: [
      '主にモルヒネ塩酸塩10%（10mg/mL）10mLシリンジでの使用を想定',
      'PCAボタンで患者がレスキュードーズを自己投与可能',
      'ロックアウト時間の設定でPCAの過剰投与を防止',
      'シリンジ残量が少なくなるとアラーム→交換のタイミング指導が重要',
    ],
    alarms: ['閉塞アラーム（ルート閉塞・折れ）', 'シリンジ残量アラーム', 'バッテリー低下', '流量異常'],
  },
  {
    id: 'te-ss700', name: 'テルフュージョンシリンジポンプ SS-700シリーズ', manufacturer: 'テルモ',
    category: 'electric-syringe', pcaFunction: false,
    features: ['5〜50mLシリンジ対応', '病院・在宅両方で使用', '高い流量精度'],
    usedFor: ['微量持続投与全般', 'ICU/病棟からの在宅移行時'],
    syringeSize: '5/10/20/30/50mL', flowRate: '0.1〜200mL/h',
    keyPoints: [
      '病院で使い慣れた機種を在宅に持ち出すケースが多い',
      'PCA機能がないため、レスキューは別途対応が必要',
      'シリンジサイズの設定を間違えると流量が大幅にずれるので注意',
    ],
    alarms: ['閉塞', 'シリンジ残量', '設定エラー', 'バッテリー'],
  },
  // 電動式リザーバーポンプ（PCAポンプ）
  {
    id: 'cadd-legacy', name: 'CADD-Legacy PCA 6300', manufacturer: 'スミスメディカル（現ICU Medical）',
    category: 'electric-reservoir', pcaFunction: true,
    features: ['50/100mLカセット使用', 'PCA機能標準搭載', '在宅PCAポンプの代表機種', '流量0.1mL/h〜'],
    usedFor: ['がん性疼痛の持続投与+PCA', '在宅緩和ケア', '術後疼痛管理'],
    flowRate: '0.1〜75mL/h', weight: '約397g（薬液なし）', batteryLife: '約45時間（9V電池×1）',
    keyPoints: [
      '在宅PCAポンプの最も普及した機種の一つ',
      '設定項目: ①持続流量(mL/h) ②ドーズ量(mL) ③ロックアウト時間(分) ④4時間リミット',
      '流量下限が0.1mL/hのため、薬液濃度の設計が重要',
      '増量時は0.1mL/h単位→薬液濃度によっては2倍になることも',
      'カセット交換時はプライミングを忘れない',
      '薬液は薬局で無菌的にカセットに充填→患者宅に届ける運用',
    ],
    alarms: ['閉塞（Occlusion）', 'カセット残量（Near Empty / Empty）', 'バッテリー低下', 'ドアオープン', 'エアインライン'],
  },
  {
    id: 'coopdech-amy', name: 'クーデックエイミー PCA', manufacturer: '大研医器',
    category: 'electric-reservoir', pcaFunction: true,
    features: ['日本製PCAポンプ', 'PCA機能搭載', '操作が比較的シンプル'],
    usedFor: ['がん性疼痛の持続投与+PCA', '在宅緩和ケア'],
    keyPoints: [
      'CADD-Legacyと並ぶ在宅PCAポンプの主要機種',
      '操作パネルが日本語表記で分かりやすい',
      '地域によって採用機種が異なるため、地域の在宅医・薬局との情報共有が重要',
    ],
    alarms: ['閉塞', '残量低下', 'バッテリー', 'ドアオープン'],
  },
  // ディスポーザブル（バルーン型）
  {
    id: 'infusor', name: 'バクスターインフューザー', manufacturer: 'バクスター',
    category: 'disposable', pcaFunction: false,
    features: ['バルーン型', '電源不要', '使い捨て', '一定流量'],
    usedFor: ['抗がん剤持続投与（5-FU等）', '抗菌薬持続投与', '在宅化学療法'],
    keyPoints: [
      '流量は製品ごとに固定（0.5/2/5mL/h等）→流量変更には製品変更が必要',
      '温度変化で流量が変動する（高温で速く、低温で遅くなる）',
      '患者の入浴・外出時の温度変化に注意を指導',
      '電源不要で携帯性に優れ、患者のQOL維持に貢献',
    ],
    alarms: [],
  },
  {
    id: 'i-fuser', name: 'アイフューザープラス', manufacturer: 'ニプロ',
    category: 'disposable', pcaFunction: true,
    features: ['バルーン型', 'PCAボタン付き', '電源不要'],
    usedFor: ['がん性疼痛', '在宅緩和ケア'],
    keyPoints: [
      'バルーン型でPCA機能を搭載した製品',
      'PCAボタンを押すと一定量の薬液が追加投与される',
      '電源不要でPCA可能なため、活動的な患者に適する',
    ],
    alarms: [],
  },
  // 輸液ポンプ
  {
    id: 'te-lm700', name: 'テルフュージョン輸液ポンプ LM-700シリーズ', manufacturer: 'テルモ',
    category: 'infusion', pcaFunction: false,
    features: ['点滴スタンド設置型', '大容量輸液対応', '滴下センサー搭載'],
    usedFor: ['TPN（中心静脈栄養）', '大量補液', '在宅での高カロリー輸液'],
    flowRate: '1〜1200mL/h',
    keyPoints: [
      '在宅TPN患者で使用。主に夜間就寝中に投与するケースが多い',
      'チューブのセットが正しくないと流量が不正確になる',
      'フリーフロー防止機構を確認（クランプ忘れで急速投与のリスク）',
      '定期的なルート交換と清潔管理が重要',
    ],
    alarms: ['閉塞', '気泡検出', '滴下異常', 'バッテリー', '輸液終了'],
  },
]

// ========================================
// トラブルシューティング
// ========================================

interface Trouble {
  symptom: string
  cause: string
  action: string
  urgency: 'high' | 'medium' | 'low'
}

const TROUBLESHOOTING: Trouble[] = [
  { symptom: '閉塞アラームが鳴る', cause: 'ルートの折れ・クランプ閉じ忘れ・針先の位置ずれ・薬液結晶化', action: '①ルート全体の折れ・クランプ確認 ②刺入部の確認 ③生食フラッシュ試行 ④改善しなければ医師に連絡', urgency: 'high' },
  { symptom: '刺入部が腫れている（皮下注の場合）', cause: '皮下組織への薬液漏出（皮下硬結）', action: '①投与を一時停止 ②刺入部を変更（前回と5cm以上離す） ③腫れが強い場合は医師に報告', urgency: 'medium' },
  { symptom: '流量が合っていない気がする', cause: 'シリンジサイズの設定ミス/チューブの装着不良/バルーン型は温度変化', action: '①設定値の再確認 ②チューブの装着状態確認 ③バルーン型は室温に注意', urgency: 'medium' },
  { symptom: 'PCAボタンを押しても出ない', cause: 'ロックアウト時間中/4時間リミット到達/閉塞', action: '①直前のPCA使用時間を確認 ②アラーム表示確認 ③改善しなければ薬局・医師に連絡', urgency: 'medium' },
  { symptom: 'バッテリーアラーム', cause: '電池残量低下', action: '①予備電池に交換（あらかじめ患者宅に予備を常備） ②交換手順を家族に事前指導', urgency: 'low' },
  { symptom: '薬液の変色・濁り', cause: '配合変化/光分解/温度による変性', action: '①投与を即時中止 ②薬局に連絡して薬液を新規調製 ③遮光カバー・保冷の確認', urgency: 'high' },
]

// ========================================
// メインコンポーネント
// ========================================

export function PumpGuide() {
  const [selectedCategory, setSelectedCategory] = useState<PumpCategory | 'all'>('all')
  const [expandedPump, setExpandedPump] = useState<string | null>(null)

  const filteredPumps = selectedCategory === 'all'
    ? PUMPS
    : PUMPS.filter(p => p.category === selectedCategory)

  return (
    <div className="space-y-6">
      {/* セクション1: ポンプの分類 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-lg font-bold text-gray-900">🏥 在宅で使用するポンプの分類</h3>
        <p className="mb-4 text-sm text-gray-500">在宅医療で使うポンプは大きく4種類に分かれます。</p>
        <div className="grid gap-3 md:grid-cols-2">
          {PUMP_CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(selectedCategory === cat.key ? 'all' : cat.key)}
              className={`rounded-xl border p-4 text-left transition ${
                selectedCategory === cat.key ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xl">{cat.icon}</span>
                <span className="font-semibold text-gray-900">{cat.label}</span>
              </div>
              <p className="text-xs text-gray-500">{cat.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* セクション2: 機種一覧 */}
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
        <h3 className="mb-1 text-lg font-bold text-gray-900">📋 主要機種ガイド</h3>
        <p className="mb-4 text-sm text-gray-500">
          {selectedCategory === 'all' ? '全機種を表示しています。上のカテゴリで絞り込めます。' : `${PUMP_CATEGORIES.find(c => c.key === selectedCategory)?.label}の機種を表示中`}
        </p>

        <div className="space-y-3">
          {filteredPumps.map(pump => {
            const isExpanded = expandedPump === pump.id
            const cat = PUMP_CATEGORIES.find(c => c.key === pump.category)
            return (
              <div key={pump.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <button
                  onClick={() => setExpandedPump(isExpanded ? null : pump.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span>{cat?.icon}</span>
                        <span className="font-semibold text-gray-900">{pump.name}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <span>{pump.manufacturer}</span>
                        {pump.pcaFunction && <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700 font-medium">PCA対応</span>}
                      </div>
                    </div>
                    <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {pump.features.map(f => (
                      <span key={f} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{f}</span>
                    ))}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
                    {/* スペック */}
                    <div className="grid gap-2 md:grid-cols-4">
                      {pump.syringeSize && (
                        <div className="rounded-lg bg-white p-2 text-center border border-gray-200">
                          <p className="text-xs text-gray-500">シリンジ</p>
                          <p className="text-sm font-bold">{pump.syringeSize}</p>
                        </div>
                      )}
                      {pump.flowRate && (
                        <div className="rounded-lg bg-white p-2 text-center border border-gray-200">
                          <p className="text-xs text-gray-500">流量</p>
                          <p className="text-sm font-bold">{pump.flowRate}</p>
                        </div>
                      )}
                      {pump.weight && (
                        <div className="rounded-lg bg-white p-2 text-center border border-gray-200">
                          <p className="text-xs text-gray-500">重量</p>
                          <p className="text-sm font-bold">{pump.weight}</p>
                        </div>
                      )}
                      {pump.batteryLife && (
                        <div className="rounded-lg bg-white p-2 text-center border border-gray-200">
                          <p className="text-xs text-gray-500">バッテリー</p>
                          <p className="text-sm font-bold">{pump.batteryLife}</p>
                        </div>
                      )}
                    </div>

                    {/* 用途 */}
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">使用場面</p>
                      <div className="flex flex-wrap gap-1">
                        {pump.usedFor.map(u => (
                          <span key={u} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{u}</span>
                        ))}
                      </div>
                    </div>

                    {/* 重要ポイント */}
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">💡 薬剤師が押さえるポイント</p>
                      <ul className="space-y-1">
                        {pump.keyPoints.map((kp, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-blue-400 shrink-0">•</span>{kp}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* アラーム */}
                    {pump.alarms.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">🔔 主なアラーム</p>
                        <div className="flex flex-wrap gap-1">
                          {pump.alarms.map(a => (
                            <span key={a} className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">{a}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* セクション3: PCA設定の基本 */}
      <section className="rounded-2xl border border-purple-200 bg-purple-50 p-6 shadow-sm">
        <h3 className="mb-1 text-lg font-bold text-gray-900">⚙️ PCA（自己調整鎮痛）設定の基本</h3>
        <p className="mb-4 text-sm text-gray-500">PCAポンプの主な設定項目と考え方です。</p>
        <div className="space-y-3">
          {[
            { label: '持続流量（Continuous Rate）', desc: 'ベースとなる持続注入速度（mL/h）。医師の指示に基づく。', example: '例: モルヒネ1mg/mL溶液を0.5mL/h → 12mg/日' },
            { label: 'ドーズ量（Dose Volume）', desc: 'PCAボタン1回で追加投与される量（mL）。レスキュードーズに相当。', example: '例: 1日量の1/6 = 2mgのレスキュー → 0.2mL/回' },
            { label: 'ロックアウト時間（Lockout Interval）', desc: 'PCA投与後、次のPCAが使えるまでの時間（分）。過剰投与を防止。', example: '例: 15〜30分が一般的。短すぎると過量投与リスク' },
            { label: '4時間リミット（4h Limit）', desc: '4時間以内に投与可能な最大量（持続+PCA合計）。安全上限。', example: '例: 持続2mL + PCA最大6mL = 合計8mL/4h' },
          ].map((item, i) => (
            <div key={i} className="rounded-lg border border-purple-200 bg-white p-4">
              <p className="font-semibold text-gray-900">{item.label}</p>
              <p className="mt-1 text-sm text-gray-600">{item.desc}</p>
              <p className="mt-1 text-xs text-purple-600">{item.example}</p>
            </div>
          ))}
        </div>
      </section>

      {/* セクション4: トラブルシューティング */}
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <h3 className="mb-1 text-lg font-bold text-gray-900">🚨 トラブルシューティング</h3>
        <p className="mb-4 text-sm text-gray-500">在宅でよく起きるトラブルと対応方法です。</p>
        <div className="space-y-3">
          {TROUBLESHOOTING.map((t, i) => (
            <div key={i} className={`rounded-lg border bg-white p-4 ${
              t.urgency === 'high' ? 'border-red-300' : t.urgency === 'medium' ? 'border-amber-300' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  t.urgency === 'high' ? 'bg-red-100 text-red-700' : t.urgency === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                }`}>{t.urgency === 'high' ? '緊急' : t.urgency === 'medium' ? '注意' : '軽微'}</span>
                <span className="font-semibold text-gray-900">{t.symptom}</span>
              </div>
              <p className="text-sm text-gray-500"><span className="font-medium">原因:</span> {t.cause}</p>
              <p className="text-sm text-gray-800"><span className="font-medium text-blue-600">対応:</span> {t.action}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 薬剤師の役割 */}
      <section className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-sm">
        <h3 className="mb-2 font-bold text-green-800">💊 在宅でのポンプ管理における薬剤師の役割</h3>
        <ul className="space-y-2 text-sm text-green-700">
          <li className="flex items-start gap-2"><span>✅</span><b>薬液の無菌調製:</b> カセット・シリンジへの薬液充填はクリーンベンチで薬剤師が行う</li>
          <li className="flex items-start gap-2"><span>✅</span><b>処方提案:</b> 薬液濃度・流量の設計。ポンプの流量下限を考慮した濃度設定</li>
          <li className="flex items-start gap-2"><span>✅</span><b>配合変化の確認:</b> 持続注射液に複数薬剤を混合する場合の安定性確認</li>
          <li className="flex items-start gap-2"><span>✅</span><b>患者・家族教育:</b> PCAの使い方、アラーム時の対応、薬液交換手順</li>
          <li className="flex items-start gap-2"><span>✅</span><b>定期モニタリング:</b> 訪問時にポンプの動作確認、残量確認、副作用チェック</li>
          <li className="flex items-start gap-2"><span>✅</span><b>地域連携:</b> 使用ポンプの機種・操作を地域の医師・看護師と共有</li>
        </ul>
      </section>
    </div>
  )
}
