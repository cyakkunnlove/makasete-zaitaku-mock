'use client'

import { useState } from 'react'

// ========================================
// チェックリストデータ
// ========================================

interface CheckCategory {
  id: string
  title: string
  icon: string
  description: string
  items: CheckItem[]
}

interface CheckItem {
  id: string
  text: string
  detail: string
  required: boolean
  link?: string
}

const CHECKLIST: CheckCategory[] = [
  {
    id: 'cat1', title: '① 経営方針・体制', icon: '👑',
    description: 'オーナー・管理薬剤師が在宅に取り組む方針を明確にしているか',
    items: [
      { id: 'c01', text: 'オーナーが在宅に取り組む方針を決定・表明している', detail: 'スタッフ全員に「在宅を始める」ことが伝わっている状態。口頭＋書面がベスト。', required: true },
      { id: 'c02', text: '在宅患者訪問薬剤管理指導の届出を提出済み', detail: '地方厚生局への届出。未届では訪問しても算定できない。', required: true },
      { id: 'c03', text: '24時間対応体制が整備されている', detail: '携帯電話での連絡体制でOK。当番表があるとベスト。', required: true },
      { id: 'c04', text: '介護保険の居宅療養管理指導の体制がある', detail: '介護保険で算定する場合は介護給付費の請求体制が必要。国保連への請求準備。', required: true },
    ],
  },
  {
    id: 'cat2', title: '② 人員・役割分担', icon: '👥',
    description: 'スタッフの役割が明確で、不在時のバックアップ体制があるか',
    items: [
      { id: 'c05', text: '在宅責任者が決まっている', detail: '管理薬剤師が兼任可。在宅業務全体の統括者。', required: true },
      { id: 'c06', text: '訪問担当薬剤師（メイン＋サブ）が決まっている', detail: '最低2名体制。メイン不在時にサブが対応できる。', required: true },
      { id: 'c07', text: '事務担当（書類・レセプト）が決まっている', detail: '介護保険の請求事務は外来とは別の知識が必要。研修済みか確認。', required: true },
      { id: 'c08', text: '緊急対応の当番制が決まっている', detail: '夜間・休日の携帯当番。週ごとのローテーションが一般的。', required: false },
      { id: 'c09', text: 'スタッフへの在宅勉強会を実施済み', detail: '最低1回は全スタッフに在宅の概要を説明。マインドセット構築。', required: true },
    ],
  },
  {
    id: 'cat3', title: '③ 書類・契約準備', icon: '📄',
    description: '初回訪問に必要な書類テンプレートが準備されているか',
    items: [
      { id: 'c10', text: '居宅療養管理指導の契約書テンプレートがある', detail: '介護保険で算定する場合に必須。利用者用・薬局用の2通。', required: true },
      { id: 'c11', text: '重要事項説明書テンプレートがある', detail: 'サービス内容・費用・苦情窓口を記載。契約書と一緒に交付。', required: true },
      { id: 'c12', text: '個人情報同意書テンプレートがある', detail: '多職種への情報共有に必要。患者の署名を取得。', required: true },
      { id: 'c13', text: '薬学的管理指導計画書のフォーマットがある', detail: '訪問の目的・内容・頻度を記載。算定の根拠。', required: true },
      { id: 'c14', text: '訪問報告書（トレーシングレポート）のフォーマットがある', detail: '医師への報告用。SOAP形式推奨。', required: true },
      { id: 'c15', text: 'ケアマネへの情報提供書のフォーマットがある', detail: '介護保険で算定する場合に必須。毎回訪問後に送付。', required: true },
    ],
  },
  {
    id: 'cat4', title: '④ 受入条件・判断基準', icon: '📋',
    description: '自局で対応可能な患者の範囲を明確にしているか',
    items: [
      { id: 'c16', text: '受入条件表を作成している', detail: '対応可能な距離、時間帯、疾患、必要設備の基準を明文化。', required: true },
      { id: 'c17', text: '対応可能エリア（訪問範囲）を決めている', detail: '車・自転車で15分圏内が目安。最初は近隣から。', required: true },
      { id: 'c18', text: '対応困難な場合の連携先（他薬局）を把握している', detail: '在宅対応可能な近隣薬局のリスト。「できません」で終わらない。', required: false },
    ],
  },
  {
    id: 'cat5', title: '⑤ 設備・備品', icon: '🔧',
    description: '在宅訪問に必要な最低限の設備・備品があるか',
    items: [
      { id: 'c19', text: '訪問バッグ（薬剤・器材を入れるもの）がある', detail: '保冷バッグがあるとなお良い（要冷蔵の薬剤がある場合）。', required: true },
      { id: 'c20', text: '血圧計・パルスオキシメーターがある', detail: 'バイタルチェック用。訪問時に持参。', required: true },
      { id: 'c21', text: 'お薬カレンダー・一包化用品がある', detail: '服薬管理の基本ツール。100均でも入手可。', required: false },
      { id: 'c22', text: '名札・スリッパ（訪問用）がある', detail: '患者宅に上がる際のマナー。清潔感のある身なりも。', required: true },
      { id: 'c23', text: '麻薬金庫がある（麻薬を扱う場合）', detail: '麻薬の保管には施錠できる堅固な設備が必要。', required: false },
      { id: 'c24', text: 'クリーンベンチがある（無菌調剤を行う場合）', detail: 'TPN・麻薬注射剤の調製に必要。共同利用の契約でもOK。', required: false },
    ],
  },
  {
    id: 'cat6', title: '⑥ 連携体制', icon: '🏥',
    description: '医師・ケアマネ等との連携準備ができているか',
    items: [
      { id: 'c25', text: '門前医療機関に「在宅対応を始める」ことを伝えた', detail: '処方医からの訪問指示がないと始まらない。積極的にPR。', required: true },
      { id: 'c26', text: '地域のケアマネ事業所に情報提供した', detail: '在宅対応薬局リストへの登録、チラシ配布等。', required: false },
      { id: 'c27', text: '近隣の訪問看護ステーションの連絡先を把握している', detail: '患者のバイタルや状態変化の情報共有先。', required: false },
      { id: 'c28', text: '地域の薬剤師会の在宅関連の研修に参加した', detail: '研修受講歴は加算の施設基準にも関係する場合がある。', required: false },
    ],
  },
]

// ========================================
// メインコンポーネント
// ========================================

export function PreAcceptanceChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const toggle = (id: string) => setChecked(prev => ({ ...prev, [id]: !prev[id] }))

  const allItems = CHECKLIST.flatMap(c => c.items)
  const requiredItems = allItems.filter(i => i.required)
  const checkedCount = allItems.filter(i => checked[i.id]).length
  const requiredCheckedCount = requiredItems.filter(i => checked[i.id]).length
  const allRequiredDone = requiredCheckedCount === requiredItems.length
  const progress = Math.round((checkedCount / allItems.length) * 100)

  return (
    <div className="space-y-6">
      {/* 進捗バー */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900">✅ 初回受入前チェックリスト</h3>
          <span className="text-sm font-bold text-blue-600">{checkedCount}/{allItems.length}</span>
        </div>
        <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${allRequiredDone ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>必須項目: {requiredCheckedCount}/{requiredItems.length}</span>
          <span>{progress}% 完了</span>
        </div>

        {allRequiredDone ? (
          <div className="mt-3 rounded-lg bg-green-50 border border-green-300 p-3 text-center">
            <p className="text-sm font-bold text-green-800">🎉 必須項目がすべて完了！初回患者を受け入れる準備が整いました。</p>
          </div>
        ) : (
          <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-sm text-amber-800">⚠️ 必須項目があと<b>{requiredItems.length - requiredCheckedCount}件</b>残っています。</p>
          </div>
        )}
      </section>

      {/* カテゴリ別チェックリスト */}
      {CHECKLIST.map(cat => {
        const catChecked = cat.items.filter(i => checked[i.id]).length
        const catTotal = cat.items.length
        return (
          <section key={cat.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{cat.icon}</span>
                <div>
                  <h4 className="font-bold text-gray-900">{cat.title}</h4>
                  <p className="text-xs text-gray-500">{cat.description}</p>
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                catChecked === catTotal ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>{catChecked}/{catTotal}</span>
            </div>

            <div className="space-y-2">
              {cat.items.map(item => (
                <div
                  key={item.id}
                  className={`rounded-lg border p-3 transition cursor-pointer ${
                    checked[item.id] ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => toggle(item.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 mt-0.5 ${
                      checked[item.id] ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'
                    }`}>
                      {checked[item.id] && <span className="text-xs">✓</span>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${checked[item.id] ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                          {item.text}
                        </p>
                        {item.required && (
                          <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">必須</span>
                        )}
                      </div>
                      <p className={`mt-0.5 text-xs ${checked[item.id] ? 'text-green-600' : 'text-gray-500'}`}>
                        {item.detail}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}

      {/* 印刷用ボタン */}
      <div className="flex gap-2 no-print">
        <button onClick={() => window.print()} className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          🖨️ チェックリストを印刷
        </button>
        <button
          onClick={() => setChecked({})}
          className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          リセット
        </button>
      </div>

      {/* 補足 */}
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
        <h3 className="mb-2 font-bold text-gray-900">💡 チェックリストの使い方</h3>
        <div className="space-y-1 text-sm text-gray-700">
          <p>• <b>赤い「必須」タグ</b>がついた項目は、初回患者を受け入れる前に必ず完了してください</p>
          <p>• 必須以外の項目は、在宅を始めてから段階的に整備していけばOKです</p>
          <p>• <b>全必須項目完了</b>で「受入準備完了」の表示が出ます</p>
          <p>• このチェックリストはブラウザ上でのチェック状態です。印刷して紙でも管理できます</p>
          <p>• 不明な項目は、各タスク・教材ページで詳しく学べます</p>
        </div>
      </section>
    </div>
  )
}
