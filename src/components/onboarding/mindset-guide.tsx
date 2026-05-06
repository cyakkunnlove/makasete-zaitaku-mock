'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

// ========================================
// スタッフが在宅をやりたくない理由（実態調査ベース）
// ========================================

interface ConcernItem {
  id: string
  concern: string
  percentage: number
  category: 'workload' | 'skill' | 'mental' | 'system'
  answer: string
  tips: string[]
  realVoice: string
}

const CONCERNS: ConcernItem[] = [
  {
    id: 'c1', concern: 'マンパワー不足（通常業務が回らなくなる）', percentage: 72,
    category: 'workload',
    answer: '最初は月2〜4回の訪問から始めれば、1日あたり30分〜1時間の追加で収まる。訪問は午前の空き時間や昼前後に組むと通常業務への影響が最小限。患者10人で月40回の訪問は、1日2回×週5日。',
    tips: ['訪問日をまとめて効率化（例: 火・木を訪問日に）', '近隣エリアの患者をまとめて回る', '最初は1〜2人から始めて徐々に増やす'],
    realVoice: '最初は1人の患者から始めたけど、3ヶ月後には5人に。ルーティンに組み込めば意外と回る。むしろ外来の待ち時間に行ける。',
  },
  {
    id: 'c2', concern: '臨床知識・スキルに自信がない', percentage: 58,
    category: 'skill',
    answer: '最初から重症患者を受ける必要はない。服薬管理がメインの安定した高齢者から始めれば、外来での服薬指導の延長線上。必要な知識は段階的に身につけていける。',
    tips: ['まずは「残薬整理＋服薬確認」だけでも価値がある', '分からないことは処方医に確認すればOK（それが連携）', 'このアプリの教材で体系的に学べる'],
    realVoice: '最初はバイタルの取り方すら不安だったけど、やってみたら患者さんとの会話の中で自然に慣れた。分からないことは先生に聞けばいい。',
  },
  {
    id: 'c3', concern: '一人で患者宅に行くのが怖い（急変対応等）', percentage: 45,
    category: 'mental',
    answer: '薬剤師の訪問は医療行為ではなく「薬学的管理指導」。急変時は119番と処方医に連絡するのが役割。訪問看護師や医師と連絡先を共有しておけば、一人で全てを背負う必要はない。',
    tips: ['初回は管理薬剤師と2人で訪問する', '訪問前に緊急連絡先リストを確認', '訪問看護師と同日訪問のスケジュールを組むと安心'],
    realVoice: '最初は先輩と一緒に行った。3回目からは一人でも大丈夫だった。何かあったら電話すればいいと思えてから楽になった。',
  },
  {
    id: 'c4', concern: '患者の家に入ることへの心理的抵抗', percentage: 38,
    category: 'mental',
    answer: '患者・家族は「来てくれて助かる」と思っていることがほとんど。通院が困難な方にとって、薬剤師の訪問は大きな安心感。最初は緊張するが、2〜3回訪問すると信頼関係ができてくる。',
    tips: ['清潔感のある身なり、名札をつける', '靴下の予備・スリッパを持参', '訪問時間を事前に連絡（突然行かない）'],
    realVoice: 'おばあちゃんが「あなたが来てくれると安心する」って言ってくれた時、この仕事の意味を実感した。',
  },
  {
    id: 'c5', concern: '書類作成が面倒（計画書・報告書等）', percentage: 52,
    category: 'system',
    answer: 'テンプレートを使えば大幅に時短できる。このアプリにテンプレートを用意している。SOAP形式の記録は慣れれば1件5〜10分で書ける。',
    tips: ['テンプレートを活用（このアプリのtask-flowページから入手可能）', '訪問直後にメモ→帰局後に清書のルーティン化', 'タブレット持参で現場で入力するとさらに効率的'],
    realVoice: 'テンプレート使い始めてから報告書の時間が半分になった。SOAPも3ヶ月で慣れた。',
  },
  {
    id: 'c6', concern: '移動時間がもったいない', percentage: 35,
    category: 'workload',
    answer: '居宅療養管理指導費518単位（約5,180円/回）は外来の服薬管理指導料59点（590円）の約9倍。30分の訪問＋移動で約5,180円は、時間単価で見れば外来より圧倒的に高い。医療保険の患者なら650点（6,500円）。',
    tips: ['車・自転車で15分圏内の患者から始める', '訪問日をまとめて移動を最小化', 'ルート最適化（近い順に回る）'],
    realVoice: '正直、最初は移動が面倒だったけど、薬局の外に出ると気分転換にもなる。患者さんの生活が見えると調剤の質も変わった。',
  },
  {
    id: 'c7', concern: '夜間・休日の対応が心配', percentage: 42,
    category: 'workload',
    answer: '24時間対応体制は「携帯電話で連絡が取れる」で満たされる。実際に夜間に呼ばれることは稀（月1〜2回程度、緊急度の高い患者がいる場合のみ）。当番制にすれば個人の負担は軽減できる。',
    tips: ['24時間対応＝24時間勤務ではない', '緊急連絡は電話相談で済むことがほとんど', '複数薬剤師で当番制にする'],
    realVoice: '1年やって夜中に呼ばれたのは3回。全部電話で対応できた。思ったより全然大丈夫。',
  },
]

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  workload: { label: '業務負担', color: '#ef4444' },
  skill: { label: 'スキル不安', color: '#f59e0b' },
  mental: { label: '心理的抵抗', color: '#8b5cf6' },
  system: { label: '事務負担', color: '#3b82f6' },
}

// ========================================
// 在宅のやりがい
// ========================================

const REWARDS = [
  { icon: '🤝', title: '患者さんとの深い信頼関係', description: '外来では数分の対応が、在宅では30分以上じっくり向き合える。「先生」と呼ばれ、頼りにされる実感がある。' },
  { icon: '🔍', title: '薬剤師としての専門性を発揮', description: '処方提案、副作用モニタリング、多剤併用の整理。在宅では薬剤師の判断が直接患者の生活を変える。' },
  { icon: '👥', title: '多職種チームの一員になれる', description: '医師・看護師・ケアマネとチームで患者を支える。「薬のことは薬局さんに聞こう」と信頼される。' },
  { icon: '📈', title: 'キャリアの幅が広がる', description: '在宅経験は転職市場でも高く評価される。地域連携薬局の認定にも在宅実績が必要。' },
  { icon: '💡', title: '調剤の質が上がる', description: '患者の生活を見ることで、一包化の必要性や服用タイミングの提案が具体的になる。外来の仕事にもフィードバックされる。' },
  { icon: '🏠', title: '「ありがとう」を直接もらえる', description: '外来では急いで帰る患者さんも、在宅ではゆっくり感謝を伝えてくれる。仕事の満足度が大きく上がる。' },
]

// ========================================
// 勉強会の進め方
// ========================================

const STUDY_MEETING_AGENDA = [
  { time: '5分', title: 'はじめに: なぜ今日この話をするか', content: '薬局の方針として在宅を始めること。スタッフへの感謝と、一緒に進めたいという思い。' },
  { time: '10分', title: '在宅の現場って実際どうなの？', content: '1日の流れの紹介（訪問→指導→記録→報告）。実際の訪問の様子（イメージ共有）。' },
  { time: '10分', title: 'スタッフの不安に答える', content: '上記の「不安Q&A」をベースに、チームで話し合う。一方的な説明ではなく対話形式で。' },
  { time: '10分', title: 'やりがいの紹介', content: '在宅をやっている薬剤師の声。動画や記事の共有。実際に見学に行くのも有効。' },
  { time: '5分', title: '今後のスケジュール', content: '「来月、最初の1人目を受け入れます」など具体的な予定。最初は管理薬剤師が中心、徐々に担当を広げる。' },
  { time: '5分', title: '質疑応答', content: 'その場で答えられないことは「調べて共有します」でOK。全ての不安を解消する必要はない。' },
]

// ========================================
// メインコンポーネント
// ========================================

export function MindsetGuide() {
  const [expandedConcern, setExpandedConcern] = useState<string | null>('c1')
  const [activeTab, setActiveTab] = useState<'concerns' | 'rewards' | 'meeting'>('concerns')

  const chartData = CONCERNS.map(c => ({
    name: c.concern.length > 10 ? c.concern.slice(0, 10) + '…' : c.concern,
    fullName: c.concern,
    percentage: c.percentage,
    fill: CATEGORY_LABELS[c.category].color,
  }))

  return (
    <div className="space-y-6">
      {/* タブ切替 */}
      <div className="flex gap-2">
        {[
          { key: 'concerns', label: '😟 スタッフの不安に答える' },
          { key: 'rewards', label: '✨ やりがい' },
          { key: 'meeting', label: '📋 勉強会の進め方' },
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

      {/* 不安に答えるタブ */}
      {activeTab === 'concerns' && (
        <div className="space-y-6">
          {/* グラフ */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-lg font-bold text-gray-900">📊 薬剤師が在宅をやりたくないと感じる理由</h3>
            <p className="mb-4 text-sm text-gray-500">複数の調査やアンケートから集約した主な不安・懸念。</p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={11} />
                  <YAxis type="category" dataKey="name" width={90} fontSize={10} tick={{ fill: '#374151' }} />
                  <Tooltip formatter={(value) => [`${value}%`, '回答率']} labelFormatter={(_, payload) => ((payload as unknown) as Array<{payload?: {fullName?: string}}>)?.[0]?.payload?.fullName || ''} />
                  <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
              {Object.entries(CATEGORY_LABELS).map(([key, val]) => (
                <span key={key} className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: val.color }} />
                  {val.label}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-400">出典: 各種薬剤師転職・キャリア調査、厚生労働科学研究等より概算集約</p>
          </section>

          {/* Q&Aカード */}
          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-gray-900">💬 不安Q&A — 1つずつ解消しよう</h3>
            <div className="space-y-3">
              {CONCERNS.map(c => {
                const isExpanded = expandedConcern === c.id
                const cat = CATEGORY_LABELS[c.category]
                return (
                  <div key={c.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                    <button
                      onClick={() => setExpandedConcern(isExpanded ? null : c.id)}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold" style={{ backgroundColor: cat.color }}>
                            {c.percentage}%
                          </span>
                          <div>
                            <p className="font-semibold text-gray-900">{c.concern}</p>
                            <span className="text-xs text-gray-400">{cat.label}</span>
                          </div>
                        </div>
                        <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-green-600 mb-1">✅ 回答</p>
                          <p className="text-sm text-gray-700">{c.answer}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-blue-600 mb-1">💡 具体的なコツ</p>
                          <ul className="space-y-1">
                            {c.tips.map((t, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                <span className="text-blue-400 shrink-0">→</span>{t}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                          <p className="text-xs font-semibold text-amber-700 mb-1">🗣️ 先輩薬剤師の声</p>
                          <p className="text-sm text-amber-800 italic">「{c.realVoice}」</p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* まとめ */}
          <section className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-sm">
            <h3 className="mb-2 font-bold text-green-800">🎯 伝えたいこと</h3>
            <div className="space-y-2 text-sm text-green-700">
              <p>✅ <b>不安があるのは当然。</b>誰でも最初は不安です。重要なのは「不安をゼロにしてから始める」のではなく「小さく始めて慣れていく」こと。</p>
              <p>✅ <b>いきなり全部やる必要はない。</b>最初は安定した患者1〜2人から。服薬管理だけでOK。段階的にスキルアップ。</p>
              <p>✅ <b>一人で抱えない。</b>医師、看護師、ケアマネ、そしてチームメンバーがいる。「分からないことは聞く」が在宅の基本。</p>
              <p>✅ <b>やってみると変わる。</b>在宅を始めた薬剤師の多くが「もっと早く始めればよかった」と言います。</p>
            </div>
          </section>
        </div>
      )}

      {/* やりがいタブ */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-sm">
            <h3 className="mb-1 text-lg font-bold text-green-800">✨ 在宅薬剤師のやりがい</h3>
            <p className="mb-4 text-sm text-green-600">外来では得られない、在宅ならではのやりがいがあります。</p>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            {REWARDS.map((r, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <span className="text-3xl">{r.icon}</span>
                <h4 className="mt-2 font-bold text-gray-900">{r.title}</h4>
                <p className="mt-1 text-sm text-gray-600">{r.description}</p>
              </div>
            ))}
          </div>

          {/* Before/After */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-bold text-gray-900">🔄 在宅を始める前と後の変化</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border-2 border-gray-300 bg-gray-50 p-4">
                <p className="mb-2 font-bold text-gray-500">Before（在宅を始める前）</p>
                <ul className="space-y-1 text-sm text-gray-500">
                  <li>• 処方箋を見て調剤するだけの毎日</li>
                  <li>• 患者の顔は覚えても生活は知らない</li>
                  <li>• 医師との関係は一方通行（疑義照会のみ）</li>
                  <li>• 「薬剤師って何のためにいるの？」と感じることも</li>
                  <li>• キャリアの先が見えない</li>
                </ul>
              </div>
              <div className="rounded-xl border-2 border-green-300 bg-green-50 p-4">
                <p className="mb-2 font-bold text-green-700">After（在宅を始めた後）</p>
                <ul className="space-y-1 text-sm text-green-700">
                  <li>• 患者の生活を見て処方提案ができる</li>
                  <li>• 「先生のおかげで安心」と言われる</li>
                  <li>• 医師・看護師と対等にディスカッション</li>
                  <li>• 薬剤師としての存在意義を実感</li>
                  <li>• スペシャリストとしてのキャリアが開ける</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* 勉強会の進め方タブ */}
      {activeTab === 'meeting' && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-purple-200 bg-purple-50 p-6 shadow-sm">
            <h3 className="mb-1 text-lg font-bold text-purple-800">📋 スタッフ勉強会の進め方（45分版）</h3>
            <p className="mb-4 text-sm text-purple-600">管理薬剤師がスタッフに在宅を説明する際のアジェンダ。コピーしてそのまま使えます。</p>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="space-y-4">
              {STUDY_MEETING_AGENDA.map((item, i) => (
                <div key={i} className="flex gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-sm font-bold text-purple-700">
                    {item.time}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="mt-1 text-sm text-gray-600">{item.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 勉強会のコツ */}
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <h3 className="mb-3 font-bold text-amber-800">💡 勉強会を成功させるコツ</h3>
            <div className="space-y-2 text-sm text-amber-700">
              <p>✅ <b>一方的に「やります」と宣言しない。</b>「一緒に考えたい」というスタンスで。</p>
              <p>✅ <b>不安を否定しない。</b>「そう思うよね」と受け止めてから回答する。</p>
              <p>✅ <b>強制しない。</b>最初は希望者から。成功体験が広がれば自然と参加者が増える。</p>
              <p>✅ <b>具体的なスケジュールを示す。</b>「いつか」ではなく「来月、〇〇さんから」と明確に。</p>
              <p>✅ <b>見学の機会を作る。</b>在宅をやっている近隣薬局への見学は最も効果的。百聞は一見にしかず。</p>
              <p>✅ <b>この教材ページをプロジェクターで映して使う。</b>グラフやQ&Aを見せながら進めると説得力が増す。</p>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
