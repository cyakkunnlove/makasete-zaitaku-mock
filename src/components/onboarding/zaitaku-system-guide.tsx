'use client'

import { useState } from 'react'

// ========================================
// 在宅医療の登場人物
// ========================================

interface Actor {
  id: string
  name: string
  icon: string
  role: string
  whatTheyDo: string[]
  relationToPharmacy: string
  communicationMethod: string
  frequency: string
  color: string
}

const ACTORS: Actor[] = [
  {
    id: 'doctor', name: '在宅医（かかりつけ医）', icon: '👨‍⚕️',
    role: '在宅医療の中心。訪問診療を行い、処方箋を発行する。',
    whatTheyDo: ['定期的な訪問診療（月2回が一般的）', '処方箋の発行', '訪問薬剤管理指導の指示', '病状の管理・治療方針の決定', '緊急時の対応指示'],
    relationToPharmacy: '処方箋の発行元。薬剤師への訪問指示を出す。報告書の送付先。処方提案・疑義照会の相手。',
    communicationMethod: 'FAX（報告書・トレーシングレポート）、電話（緊急時）、ICTツール',
    frequency: '訪問ごと（報告書）+ 必要時（疑義照会・処方提案）', color: 'bg-blue-100 border-blue-300',
  },
  {
    id: 'caremanager', name: 'ケアマネジャー（介護支援専門員）', icon: '📋',
    role: '介護保険サービスの司令塔。ケアプランを作成し、各サービスを調整する。',
    whatTheyDo: ['要介護認定の申請支援', 'ケアプラン（居宅サービス計画）の作成', '各サービス事業所の調整', 'サービス担当者会議の開催', '月1回のモニタリング訪問'],
    relationToPharmacy: '介護保険で算定する場合の報告先（毎回）。サービス担当者会議への招集元。新規患者の紹介元にもなる。',
    communicationMethod: 'FAX、電話、サービス担当者会議、ICTツール',
    frequency: '訪問ごと（情報提供書）+ サービス担当者会議', color: 'bg-green-100 border-green-300',
  },
  {
    id: 'nurse', name: '訪問看護師', icon: '👩‍⚕️',
    role: '医師の指示のもと、患者宅で看護ケアを提供。バイタル管理、処置、服薬支援等。',
    whatTheyDo: ['バイタルチェック・全身状態の観察', '褥瘡ケア・カテーテル管理等の処置', '服薬確認・内服介助', '医師への状態報告', '終末期ケア'],
    relationToPharmacy: '患者の生活状態を最も把握している。服薬状況や副作用の情報源。薬の飲みにくさ等のフィードバック。PCAポンプのトラブル時の連携相手。',
    communicationMethod: '電話、FAX、ICTツール、同日訪問時の対面',
    frequency: '必要時（情報共有）+ 定期（状態変化時）', color: 'bg-pink-100 border-pink-300',
  },
  {
    id: 'helper', name: 'ヘルパー（訪問介護員）', icon: '🤝',
    role: '日常生活の援助。身体介護（入浴・排泄等）と生活援助（掃除・買い物等）。',
    whatTheyDo: ['身体介護（入浴、排泄、食事介助）', '生活援助（掃除、洗濯、買い物）', '服薬の声かけ・見守り', '状態変化の報告（ケアマネ経由）'],
    relationToPharmacy: '服薬の「声かけ」を依頼できる（服薬介助ではなく）。お薬カレンダーのセットを一緒にやることも。残薬の発見者になることも。',
    communicationMethod: 'ケアマネ経由、連絡ノート',
    frequency: '直接連携は少ない。ケアマネ経由が基本', color: 'bg-orange-100 border-orange-300',
  },
  {
    id: 'family', name: '患者の家族', icon: '👨‍👩‍👧',
    role: '在宅療養の最大のサポーター。服薬管理の協力者であり、キーパーソン。',
    whatTheyDo: ['日常の服薬管理・見守り', '処方箋の薬局への送付（FAX等）', '状態変化の連絡', '介護全般'],
    relationToPharmacy: '訪問時の同席者。服薬指導の対象。処方箋のFAX送信者。緊急連絡の窓口。介護保険の契約相手（認知症の場合）。',
    communicationMethod: '訪問時の対面、電話',
    frequency: '毎回の訪問時', color: 'bg-amber-100 border-amber-300',
  },
  {
    id: 'hospital', name: '病院（退院時連携）', icon: '🏥',
    role: '入院治療後の退院時に、在宅チームへの引き継ぎを行う。',
    whatTheyDo: ['退院時カンファレンスの開催', '退院時サマリー・診療情報提供書の作成', '退院後の処方設計', '在宅医への紹介'],
    relationToPharmacy: '退院時カンファレンスへの参加で、入院中の治療経過・退院後の処方意図を把握できる。病院薬剤師からの情報提供を受ける。',
    communicationMethod: '退院時カンファレンス、FAX、電話',
    frequency: '退院時（新規患者の受入時）', color: 'bg-purple-100 border-purple-300',
  },
]

// ========================================
// 保険制度の基本
// ========================================

const INSURANCE_COMPARISON = [
  { item: '対象者', medical: '通院困難な在宅患者（年齢問わず）', care: '要介護・要支援認定を受けた在宅患者' },
  { item: '算定名称', medical: '在宅患者訪問薬剤管理指導料', care: '居宅療養管理指導費' },
  { item: '点数/単位', medical: '650点/320点/290点', care: '518単位/378単位/341単位' },
  { item: '1回あたり金額', medical: '6,500円/3,200円/2,900円', care: '約5,180円/約3,780円/約3,410円' },
  { item: '報告先', medical: '処方医', care: '処方医＋ケアマネジャー' },
  { item: '回数上限', medical: '月4回（がん等は月8回）', care: '月4回（がん末期等は月8回）' },
  { item: '訪問間隔', medical: '週1回（令和8年改定）', care: '週1回（令和8年改定）' },
  { item: '請求先', medical: '審査支払機関（社保・国保）', care: '国民健康保険団体連合会（国保連）' },
  { item: '自己負担', medical: '1〜3割', care: '1〜3割（介護保険の負担割合）' },
  { item: '優先順位', medical: '末期がん等は医療保険が優先', care: '要介護認定者は原則こちら' },
]

// ========================================
// 情報共有のポイント
// ========================================

const COMMUNICATION_POINTS = [
  { who: '処方医への報告', what: '服薬状況、副作用、残薬、バイタル、処方提案', when: '毎回訪問後（当日中）', how: 'FAXが最も一般的。トレーシングレポート形式。緊急時は電話。', tip: '報告はA4 1枚以内。SOAPで簡潔に。「問題なし」も立派な報告。' },
  { who: 'ケアマネへの情報提供', what: '服薬状況、残薬、生活上の気づき、次回訪問予定', when: '毎回訪問後（介護保険算定の場合は必須）', how: 'FAX、ICTツール、連絡ノート', tip: '薬の話だけでなく「生活の気づき」を共有すると連携の質が上がる。' },
  { who: '訪問看護師との情報共有', what: '服薬変更の連絡、副作用情報、PCAポンプ関連', when: '処方変更時、状態変化時', how: '電話、ICTツール、同日訪問時の申し送り', tip: '看護師は患者の「生活の中での薬の困りごと」を最もよく知っている。積極的に情報を求める。' },
  { who: '家族への説明', what: '薬の効果・副作用、飲み方、保管方法、残薬の管理', when: '毎回の訪問時', how: '対面（訪問時）、電話', tip: '高齢の配偶者が介護者の場合、説明は短く・繰り返し・書面も渡す。' },
]

// ========================================
// メインコンポーネント
// ========================================

export function ZaitakuSystemGuide() {
  const [activeTab, setActiveTab] = useState<'actors' | 'insurance' | 'communication'>('actors')
  const [selectedActor, setSelectedActor] = useState<string | null>('doctor')

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {[
          { key: 'actors', label: '👥 登場人物と関係' },
          { key: 'insurance', label: '💰 保険制度の基本' },
          { key: 'communication', label: '📨 情報共有のポイント' },
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

      {/* 登場人物タブ */}
      {activeTab === 'actors' && (
        <div className="space-y-6">
          {/* 関係図（簡易版） */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-gray-900">🗺️ 在宅医療チームの全体像</h3>
            <div className="relative">
              {/* 中心: 患者 */}
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-red-100 border-2 border-red-400 px-6 py-3 text-center">
                  <span className="text-2xl">🧓</span>
                  <p className="text-sm font-bold text-red-800">患者</p>
                </div>
              </div>
              {/* 周囲の関係者 */}
              <div className="grid grid-cols-3 gap-3">
                {ACTORS.map(actor => (
                  <button
                    key={actor.id}
                    onClick={() => setSelectedActor(selectedActor === actor.id ? null : actor.id)}
                    className={`rounded-xl border-2 p-3 text-center transition ${actor.color} ${
                      selectedActor === actor.id ? 'ring-2 ring-blue-400 scale-105' : 'hover:scale-102'
                    }`}
                  >
                    <span className="text-2xl">{actor.icon}</span>
                    <p className="mt-1 text-xs font-bold text-gray-900">{actor.name.replace(/（.*）/, '')}</p>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-center text-xs text-gray-400">タップで詳細を表示</p>
            </div>
          </section>

          {/* 薬局の立ち位置 */}
          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
            <h3 className="mb-2 font-bold text-gray-900">🏪 薬局の立ち位置</h3>
            <p className="text-sm text-gray-700">薬局は在宅医療チームの中で<b>「薬のプロ」</b>としての役割を担います。</p>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {[
                { label: '処方医に対して', desc: '服薬状況の報告、副作用情報の提供、処方提案（減薬・変更等）' },
                { label: 'ケアマネに対して', desc: '服薬に関する情報提供、生活上の気づきの共有、サービス担当者会議への参加' },
                { label: '患者・家族に対して', desc: '薬の説明、服薬支援（一包化・カレンダー）、残薬管理、副作用の早期発見' },
              ].map((item, i) => (
                <div key={i} className="rounded-lg bg-white border border-blue-200 p-3">
                  <p className="text-xs font-bold text-blue-700">{item.label}</p>
                  <p className="mt-1 text-xs text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 選択された関係者の詳細 */}
          {selectedActor && (() => {
            const actor = ACTORS.find(a => a.id === selectedActor)
            if (!actor) return null
            return (
              <section className={`rounded-2xl border-2 p-6 shadow-sm ${actor.color}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{actor.icon}</span>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">{actor.name}</h4>
                    <p className="text-sm text-gray-600">{actor.role}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">🔧 主な業務</p>
                    <ul className="space-y-1">{actor.whatTheyDo.map((w, i) => <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-blue-400 shrink-0">•</span>{w}</li>)}</ul>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3">
                    <p className="text-xs font-semibold text-blue-700 mb-1">🏪 薬局との関係</p>
                    <p className="text-sm text-gray-700">{actor.relationToPharmacy}</p>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="rounded-lg bg-white/80 p-2">
                      <p className="text-xs text-gray-500">連絡手段</p>
                      <p className="text-sm font-medium">{actor.communicationMethod}</p>
                    </div>
                    <div className="rounded-lg bg-white/80 p-2">
                      <p className="text-xs text-gray-500">連携頻度</p>
                      <p className="text-sm font-medium">{actor.frequency}</p>
                    </div>
                  </div>
                </div>
              </section>
            )
          })()}
        </div>
      )}

      {/* 保険制度タブ */}
      {activeTab === 'insurance' && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-lg font-bold text-gray-900">💰 医療保険 vs 介護保険</h3>
            <p className="mb-4 text-sm text-gray-500">在宅患者の大半（約8割）は介護保険で算定。末期がん等は医療保険が優先。同月で両方は不可。</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700 w-1/4">項目</th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-blue-700 w-3/8">医療保険</th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-green-700 w-3/8 bg-green-50">介護保険（メイン）</th>
                  </tr>
                </thead>
                <tbody>
                  {INSURANCE_COMPARISON.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="border border-gray-200 px-3 py-2 font-medium text-gray-900 bg-gray-50">{row.item}</td>
                      <td className="border border-gray-200 px-3 py-2 text-gray-700">{row.medical}</td>
                      <td className="border border-gray-200 px-3 py-2 text-gray-700 bg-green-50">{row.care}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* どちらで算定するかの判断フロー */}
          <section className="rounded-2xl border border-purple-200 bg-purple-50 p-6 shadow-sm">
            <h3 className="mb-3 font-bold text-gray-900">🔀 どちらで算定する？ 判断フロー</h3>
            <div className="space-y-3">
              {[
                { q: '患者は要介護（要支援）認定を受けている？', yes: '→ 次へ', no: '→ 医療保険で算定', color: 'bg-blue-100' },
                { q: '末期がん・難病等「厚生労働大臣が定める疾病等」に該当する？', yes: '→ 医療保険で算定（介護より優先）', no: '→ 次へ', color: 'bg-amber-100' },
                { q: '要介護認定を受けている＋上記疾病に非該当？', yes: '→ 介護保険で算定（居宅療養管理指導費）', no: '', color: 'bg-green-100' },
              ].map((step, i) => (
                <div key={i} className={`rounded-lg border p-4 ${step.color}`}>
                  <p className="font-semibold text-gray-900">Q{i + 1}. {step.q}</p>
                  <div className="mt-1 flex gap-4 text-sm">
                    {step.yes && <p><span className="font-bold text-green-700">はい</span> {step.yes}</p>}
                    {step.no && <p><span className="font-bold text-red-700">いいえ</span> {step.no}</p>}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-500">※ 同一患者・同一月で医療保険と介護保険を両方算定することはできません。</p>
          </section>

          {/* 「厚生労働大臣が定める疾病等」の一覧 */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 font-bold text-gray-900">📋 医療保険が優先される疾病等</h3>
            <p className="mb-3 text-sm text-gray-500">以下に該当する場合、要介護認定があっても医療保険で算定します。</p>
            <div className="grid gap-2 md:grid-cols-2">
              {[
                '末期の悪性腫瘍',
                '多発性硬化症',
                '重症筋無力症',
                'スモン',
                '筋萎縮性側索硬化症（ALS）',
                '脊髄小脳変性症',
                'ハンチントン病',
                '進行性筋ジストロフィー症',
                'パーキンソン病関連疾患',
                '多系統萎縮症',
                'プリオン病',
                '亜急性硬化性全脳炎',
                'ライソゾーム病',
                '副腎白質ジストロフィー',
                '脊髄性筋萎縮症',
                '球脊髄性筋萎縮症',
                '慢性炎症性脱髄性多発神経炎',
                '後天性免疫不全症候群（AIDS）',
                '頸髄損傷',
                '人工呼吸器を使用している状態',
              ].map((disease, i) => (
                <div key={i} className="rounded bg-gray-50 px-3 py-1.5 text-sm text-gray-700">
                  {disease}
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-400">出典: 厚生労働大臣が定める疾病等（告示）</p>
          </section>
        </div>
      )}

      {/* 情報共有タブ */}
      {activeTab === 'communication' && (
        <div className="space-y-4">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-gray-900">📨 誰に・何を・いつ・どうやって共有するか</h3>
            {COMMUNICATION_POINTS.map((cp, i) => (
              <div key={i} className="mb-4 rounded-xl border border-gray-200 p-4">
                <h4 className="font-bold text-gray-900 mb-2">{cp.who}</h4>
                <div className="grid gap-2 md:grid-cols-2">
                  <div><p className="text-xs text-gray-500">何を</p><p className="text-sm">{cp.what}</p></div>
                  <div><p className="text-xs text-gray-500">いつ</p><p className="text-sm">{cp.when}</p></div>
                  <div><p className="text-xs text-gray-500">どうやって</p><p className="text-sm">{cp.how}</p></div>
                  <div className="rounded-lg bg-blue-50 p-2"><p className="text-xs text-blue-600">💡 {cp.tip}</p></div>
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <h3 className="mb-2 font-bold text-amber-800">📌 連携で大切なこと</h3>
            <div className="space-y-2 text-sm text-amber-700">
              <p>✅ <b>「薬のことは薬局に聞こう」と思われる存在になる。</b>そのためには的確で迅速な報告が最重要。</p>
              <p>✅ <b>報告は「問題があった時だけ」ではない。</b>「問題なし。服薬良好」も医師にとって貴重な情報。</p>
              <p>✅ <b>ケアマネには「薬以外」の気づきも共有する。</b>「部屋が散らかっている」「食欲がなさそう」等の生活情報はケアマネが最も欲しい情報。</p>
              <p>✅ <b>訪問看護師とは「同志」。</b>患者宅で過ごす時間が最も長い職種。薬の効果・副作用の情報をお互いに共有することで、患者ケアの質が格段に上がる。</p>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
