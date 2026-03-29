'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'

// ========================================
// データ（出典付き）
// ========================================

// 高齢化率の推移と予測（総務省統計局・国立社会保障人口問題研究所）
const AGING_DATA = [
  { year: '2005', rate: 20.2, label: '20.2%' },
  { year: '2010', rate: 23.0, label: '23.0%' },
  { year: '2015', rate: 26.6, label: '26.6%' },
  { year: '2020', rate: 28.6, label: '28.6%' },
  { year: '2025', rate: 29.4, label: '29.4%（現在）' },
  { year: '2030', rate: 31.2, label: '31.2%（推計）' },
  { year: '2035', rate: 32.8, label: '32.8%（推計）' },
  { year: '2040', rate: 34.8, label: '34.8%（推計）' },
]

// 在宅医療の需要（概算: 在宅患者数の推移）
const ZAITAKU_DEMAND = [
  { year: '2018', patients: 18.0 },
  { year: '2019', patients: 19.5 },
  { year: '2020', patients: 20.0 },
  { year: '2021', patients: 21.5 },
  { year: '2022', patients: 23.5 },
  { year: '2023', patients: 26.0 },
  { year: '2024', patients: 29.0 },
  { year: '2025', patients: 32.0 },
]

// 薬局の在宅対応状況（厚生労働科学研究 2023年度）
const PHARMACY_STATUS = [
  { name: '届出あり・実績あり', value: 36, color: '#22c55e' },
  { name: '届出あり・実績なし', value: 24, color: '#facc15' },
  { name: '届出なし', value: 40, color: '#ef4444' },
]

// 在宅をやらないリスク（定性的）
const RISKS = [
  {
    title: '処方箋枚数の減少',
    icon: '📉',
    description: '門前医療機関の患者が在宅に移行すると、来局する患者が減る。在宅対応しない薬局は患者ごと失う。',
    severity: 'high',
  },
  {
    title: '地域体制加算が取れない',
    icon: '💰',
    description: '在宅薬学総合体制加算や地域支援体制加算の施設基準に在宅実績が必要。在宅をしないと加算が取れず、外来の収益にも影響。',
    severity: 'high',
  },
  {
    title: '地域連携薬局になれない',
    icon: '🏥',
    description: '2021年8月施行の認定薬局制度。地域連携薬局の認定には在宅対応が必須要件。認定がないと地域での信頼・連携において不利に。',
    severity: 'medium',
  },
  {
    title: 'かかりつけ機能の評価低下',
    icon: '👨‍⚕️',
    description: '2026年度改定で「かかりつけ薬剤師」の評価が実績重視に転換。在宅を含む包括的な薬学的管理の実績がなければ、かかりつけ機能の評価が得られなくなる。',
    severity: 'high',
  },
  {
    title: '薬剤師の採用・定着が困難に',
    icon: '👥',
    description: '在宅業務に興味のある若手薬剤師が増加。在宅をやっていない薬局は「成長機会がない」と見なされ、採用で不利に。',
    severity: 'medium',
  },
  {
    title: '地域医療から孤立',
    icon: '🔗',
    description: '在宅をしないとケアマネ・訪問看護師・医師との接点がない。地域の医療チームから声がかからなくなる。',
    severity: 'medium',
  },
]

// 在宅を始めるメリット（定量的）
const BENEFITS = [
  {
    title: '高い技術料単価（介護保険）',
    value: '518単位/回',
    description: '居宅療養管理指導費（単一建物1人）は1回約5,180円。外来の服薬管理指導料（59点=590円）の約9倍。在宅患者の大半は介護保険で算定。',
    icon: '💹',
  },
  {
    title: '医療保険ならさらに高い',
    value: '650点/回',
    description: '末期がん等で医療保険が優先される場合は650点（6,500円/回）。麻薬管理指導加算100点も上乗せ可。',
    icon: '💊',
  },
  {
    title: '加算の波及効果',
    value: '外来にも',
    description: '在宅実績で在宅薬学総合体制加算2（50点/枚）を取得→外来800枚×50点=月40万円の上乗せ。',
    icon: '🏪',
  },
  {
    title: '月4〜8回算定可',
    value: '最大¥41,440',
    description: '介護保険: 518単位×月4回=2,072単位（約20,720円）/人。医療保険の末期がん患者なら月8回で52,000円超/人。',
    icon: '📊',
  },
]

// ========================================
// メインコンポーネント
// ========================================

export function WhyZaitaku() {
  const [activeTab, setActiveTab] = useState<'data' | 'risk' | 'benefit'>('data')

  return (
    <div className="space-y-6">
      {/* タブ切替 */}
      <div className="flex gap-2">
        {[
          { key: 'data', label: '📊 データで見る' },
          { key: 'risk', label: '⚠️ やらないリスク' },
          { key: 'benefit', label: '💰 始めるメリット' },
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

      {/* データタブ */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          {/* 高齢化率推移グラフ */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-lg font-bold text-gray-900">📈 日本の高齢化率の推移と予測</h3>
            <p className="mb-4 text-sm text-gray-500">2040年には3人に1人が65歳以上に。在宅医療の需要は構造的に増加する。</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={AGING_DATA}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" fontSize={12} />
                  <YAxis domain={[15, 40]} fontSize={12} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(value) => [`${value}%`, '高齢化率']} />
                  <Bar dataKey="rate" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    {AGING_DATA.map((_, index) => (
                      <Cell key={index} fill={index >= 5 ? '#93c5fd' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-gray-400">出典: 総務省統計局（実績値）、国立社会保障・人口問題研究所（推計値、薄色部分）</p>
          </section>

          {/* 在宅医療の需要推移 */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-lg font-bold text-gray-900">🏠 在宅医療を受ける患者数の推移</h3>
            <p className="mb-4 text-sm text-gray-500">在宅患者数は年々増加。2025年は団塊世代が全員75歳以上になる節目の年。</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ZAITAKU_DEMAND}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v) => `${v}万人`} />
                  <Tooltip formatter={(value) => [`約${value}万人`, '在宅患者数']} />
                  <Line type="monotone" dataKey="patients" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-gray-400">出典: 厚生労働省「在宅医療の体制構築に係る指針」等より概算推計</p>
          </section>

          {/* 薬局の在宅対応状況 */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-lg font-bold text-gray-900">🏪 薬局の在宅対応状況</h3>
            <p className="mb-4 text-sm text-gray-500">届出している薬局のうち、実際に在宅を実施しているのは約6割。4割は届出だけで実績なし。</p>
            <div className="flex flex-col items-center md:flex-row md:justify-around">
              <div className="h-64 w-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={PHARMACY_STATUS}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ value }) => `${value}%`}
                      fontSize={12}
                    >
                      {PHARMACY_STATUS.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(value) => [`${value}%`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2 md:mt-0">
                {PHARMACY_STATUS.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="inline-block h-4 w-4 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-700">{item.name}: <b>{item.value}%</b></span>
                  </div>
                ))}
                <p className="mt-2 text-xs text-gray-500">
                  💡 「届出あり・実績なし」の24%は<br/>
                  やり方がわからず始められていない薬局。<br/>
                  <b>このアプリがその壁を解消します。</b>
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400">出典: 2023年度厚生労働科学研究「地域の実情に応じた在宅医療提供体制構築のための研究」</p>
          </section>

          {/* 数字で見るまとめ */}
          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
            <h3 className="mb-4 font-bold text-gray-900">🔢 数字で見る在宅の「今」</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { number: '29.4%', label: '高齢化率（2025年）', sub: '過去最高を更新中', color: 'from-blue-500 to-blue-600' },
                { number: '34.8%', label: '高齢化率（2040年予測）', sub: '3人に1人が65歳以上', color: 'from-red-500 to-red-600' },
                { number: '約6万局', label: '全国の薬局数', sub: 'コンビニより多い', color: 'from-purple-500 to-purple-600' },
                { number: '約36%', label: '在宅実績がある薬局', sub: '残り64%は未着手 or 実績なし', color: 'from-amber-500 to-amber-600' },
                { number: '約32万人', label: '在宅医療の患者数（推計）', sub: '10年で約1.8倍に増加', color: 'from-green-500 to-green-600' },
                { number: '2025年', label: '団塊世代が全員75歳以上に', sub: '在宅需要の急増フェーズ', color: 'from-rose-500 to-rose-600' },
              ].map((item, i) => (
                <div key={i} className={`rounded-xl bg-gradient-to-br ${item.color} p-4 text-center text-white`}>
                  <p className="text-2xl font-bold">{item.number}</p>
                  <p className="text-xs font-medium opacity-90">{item.label}</p>
                  <p className="mt-1 text-xs opacity-75">{item.sub}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* リスクタブ */}
      {activeTab === 'risk' && (
        <div className="space-y-4">
          <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <h3 className="mb-1 text-lg font-bold text-red-800">⚠️ 在宅をやらないとどうなるか</h3>
            <p className="mb-4 text-sm text-red-600">在宅をやらない選択は「現状維持」ではなく「後退」です。</p>
          </section>

          {RISKS.map((risk, i) => (
            <div key={i} className={`rounded-2xl border p-6 shadow-sm ${
              risk.severity === 'high' ? 'border-red-200 bg-white' : 'border-amber-200 bg-white'
            }`}>
              <div className="flex items-start gap-4">
                <span className="text-3xl">{risk.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900">{risk.title}</h4>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      risk.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {risk.severity === 'high' ? '影響大' : '影響中'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{risk.description}</p>
                </div>
              </div>
            </div>
          ))}

          <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
            <h4 className="mb-2 font-bold text-gray-900">🔮 5年後の2つのシナリオ</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border-2 border-red-300 bg-white p-4">
                <p className="mb-2 font-bold text-red-700">❌ 在宅をやらなかった場合</p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• 処方箋枚数が年5〜10%減少</li>
                  <li>• 地域体制加算の取得困難</li>
                  <li>• 地域の医療チームから孤立</li>
                  <li>• 若手薬剤師が集まらない</li>
                  <li>• 門前薬局としての存在価値が低下</li>
                </ul>
              </div>
              <div className="rounded-xl border-2 border-green-300 bg-white p-4">
                <p className="mb-2 font-bold text-green-700">✅ 在宅を始めた場合</p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• 在宅で月10〜50万円の新規収益</li>
                  <li>• 加算の波及で外来収益も向上</li>
                  <li>• 地域連携薬局の認定取得</li>
                  <li>• 医師・ケアマネとの信頼関係構築</li>
                  <li>• 薬剤師の専門性発揮とやりがい向上</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* メリットタブ */}
      {activeTab === 'benefit' && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-sm">
            <h3 className="mb-1 text-lg font-bold text-green-800">💰 在宅を始めるメリット</h3>
            <p className="mb-4 text-sm text-green-600">在宅は「社会貢献」だけでなく「経営戦略」としても合理的です。</p>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            {BENEFITS.map((benefit, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-3xl">{benefit.icon}</span>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-lg font-bold text-green-700">{benefit.value}</span>
                </div>
                <h4 className="font-bold text-gray-900">{benefit.title}</h4>
                <p className="mt-1 text-sm text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>

          {/* 収益モデル例 */}
          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
            <h3 className="mb-4 font-bold text-gray-900">📊 収益モデル例（在宅患者10人の場合）</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-white">
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">項目</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700">月額</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">備考</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { item: '居宅療養管理指導費（介護）', amount: 165760, note: '518単位×月4回×8人（介護保険80%）', highlight: true },
                    { item: '訪問薬剤管理指導料（医療）', amount: 52000, note: '650点×月4回×2人（医療保険20%: がん等）', highlight: false },
                    { item: '麻薬管理指導加算', amount: 8000, note: '100点×月4回×2人（医療保険の麻薬患者）', highlight: false },
                    { item: '在宅薬学総合体制加算2', amount: 400000, note: '50点×外来800枚/月（波及効果）', highlight: true },
                    { item: '無菌製剤処理加算', amount: 2760, note: '69点×月4回×1人（10%想定）', highlight: false },
                  ].map((row, i) => (
                    <tr key={i} className={`border-b border-gray-100 ${row.highlight ? 'bg-blue-50' : ''}`}>
                      <td className="px-3 py-2 text-gray-900">{row.item}</td>
                      <td className="px-3 py-2 text-right font-bold text-blue-700">¥{row.amount.toLocaleString()}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{row.note}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-300 bg-gray-50">
                    <td className="px-3 py-2 font-bold text-gray-900">合計</td>
                    <td className="px-3 py-2 text-right text-xl font-bold text-green-700">¥628,520</td>
                    <td className="px-3 py-2 text-xs text-gray-500">年間約750万円</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              ※ 薬剤料・調剤技術料は別途。上記は技術料・加算のみ。外来処方箋800枚/月の薬局を想定。
              <b>在宅患者の8割は介護保険で算定</b>（居宅療養管理指導費）。医療保険は末期がん等の重症患者が中心。
              在宅薬学総合体制加算2の波及効果（外来にも加算）が最も大きく、<b>在宅を始めること自体が薬局全体の収益を押し上げる</b>構造です。
            </p>
          </section>

          {/* 始めるハードルは低い */}
          <section className="rounded-2xl border border-purple-200 bg-purple-50 p-6 shadow-sm">
            <h3 className="mb-3 font-bold text-gray-900">🚀 始めるハードルは実は低い</h3>
            <div className="space-y-3">
              {[
                { myth: '特別な設備が必要', truth: '最初は設備不要。クリーンベンチは共同利用でもOK。2026年改定で設備要件は撤廃された。' },
                { myth: '患者を見つけるのが大変', truth: '門前医療機関の医師に「在宅対応始めました」と伝えるだけで紹介が来る。ケアマネからの相談も。' },
                { myth: '専門知識がないと無理', truth: 'このアプリの教材で段階的に学べる。最初は服薬管理がメインの安定した患者から。' },
                { myth: '人員が足りない', truth: '薬剤師1人でも開始可能。月4〜8回の訪問は通常業務の合間に組み込める。' },
              ].map((item, i) => (
                <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-sm text-gray-400 line-through">「{item.myth}」</p>
                  <p className="mt-1 text-sm text-gray-800">→ {item.truth}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
