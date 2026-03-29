'use client'

import { useState } from 'react'

// ========================================
// 配合変化データ（在宅でよく遭遇するもの）
// ========================================

type RiskLevel = 'danger' | 'warning' | 'caution' | 'safe'

interface CompatibilityEntry {
  id: string
  drugA: string
  drugB: string
  risk: RiskLevel
  phenomenon: string
  mechanism: string
  countermeasure: string
  category: string
}

const COMPATIBILITY_DATA: CompatibilityEntry[] = [
  // 在宅で頻出する配合変化
  {
    id: 'c1', drugA: 'フェニトイン注（アレビアチン）', drugB: 'ブドウ糖液', risk: 'danger',
    phenomenon: '白濁・結晶析出', mechanism: 'フェニトインはpH12の強アルカリ。酸性の輸液と混合するとpHが低下し結晶が析出する', countermeasure: '生食で単独ルート投与。他の輸液との混合禁忌', category: 'pH変動',
  },
  {
    id: 'c2', drugA: 'オメプラゾール注（オメプラール）', drugB: '酸性輸液（ヴィーン3G等）', risk: 'danger',
    phenomenon: '褐変・含量低下', mechanism: 'オメプラゾール（pH9.5〜11）が酸性輸液と混合しpH低下→分解', countermeasure: '単独投与。側管投与時は前後に生食フラッシュ必須', category: 'pH変動',
  },
  {
    id: 'c3', drugA: 'フロセミド注（ラシックス）', drugB: '酸性薬剤（ドパミン、ドブタミン等）', risk: 'danger',
    phenomenon: '白濁・沈殿', mechanism: 'フロセミド（pH8.6〜9.6）が酸性環境で析出', countermeasure: '別ルートまたは生食フラッシュ後に投与', category: 'pH変動',
  },
  {
    id: 'c4', drugA: 'ミダゾラム注（ドルミカム）', drugB: '生食希釈後の側管投与', risk: 'warning',
    phenomenon: '結晶析出の報告あり', mechanism: 'ミダゾラムは酸性（pH3）で安定。アルカリ側で析出リスク', countermeasure: 'ブドウ糖液での希釈が安定。アルカリ性薬剤との混合回避', category: 'pH変動',
  },
  {
    id: 'c5', drugA: 'ヘパリンNa', drugB: 'モルヒネ塩酸塩', risk: 'safe',
    phenomenon: '配合可能', mechanism: '安定性が確認されている組み合わせ', countermeasure: '24時間以内に使用。在宅の持続皮下注でよく併用される', category: '在宅頻用',
  },
  {
    id: 'c6', drugA: 'イントラリポス（脂肪乳剤）', drugB: '電解質を含む輸液・薬剤', risk: 'danger',
    phenomenon: '乳化破壊（クラッキング）', mechanism: '電解質により脂肪粒子が凝集・合一。目視では分からないことも', countermeasure: '原則単独ルート投与。やむを得ない場合、栄養輸液（薬剤なし）の側管から', category: '脂肪乳剤',
  },
  {
    id: 'c7', drugA: 'カルシウム含有輸液（ラクテック等）', drugB: 'セフトリアキソン（ロセフィン）', risk: 'danger',
    phenomenon: '不溶性沈殿物（カルシウム塩）の析出', mechanism: 'セフトリアキソンとカルシウムが結合し不溶性の結晶を形成', countermeasure: '絶対に混合しない。同一ラインでの逐次投与も禁忌。生食フラッシュを挟んでも不可', category: 'カルシウム',
  },
  {
    id: 'c8', drugA: 'フェンタニル注', drugB: 'ケタミン注', risk: 'safe',
    phenomenon: '配合可能', mechanism: '在宅緩和ケアで併用される組み合わせ。安定性確認済み', countermeasure: '通常の持続皮下注・持続静注で使用可', category: '在宅頻用',
  },
  {
    id: 'c9', drugA: 'メトクロプラミド注（プリンペラン）', drugB: 'モルヒネ・フェンタニル', risk: 'safe',
    phenomenon: '配合可能', mechanism: '制吐剤として鎮痛薬と併用される。安定性確認済み', countermeasure: '在宅緩和ケアの持続注射で頻用される組み合わせ', category: '在宅頻用',
  },
  {
    id: 'c10', drugA: 'ミダゾラム注', drugB: 'モルヒネ塩酸塩注', risk: 'safe',
    phenomenon: '配合可能', mechanism: '終末期の鎮静・疼痛管理で併用。安定性確認済み', countermeasure: '生食での希釈が望ましい。24時間以内に使用', category: '在宅頻用',
  },
  {
    id: 'c11', drugA: 'TPN（高カロリー輸液）', drugB: 'ビタミン剤（MVIなど）', risk: 'caution',
    phenomenon: '遮光不足で分解', mechanism: 'ビタミンB2は光分解しやすい。特にビタミンCとの共存下で加速', countermeasure: '遮光カバー使用。混合後24時間以内に投与完了', category: 'TPN',
  },
  {
    id: 'c12', drugA: 'TPN（高カロリー輸液）', drugB: '微量元素製剤（エレメンミック等）', risk: 'caution',
    phenomenon: 'ビタミンCとの反応', mechanism: '鉄イオンがビタミンCの酸化を促進', countermeasure: '微量元素の添加は投与直前に。ビタミン剤との混合は投与直前', category: 'TPN',
  },
  {
    id: 'c13', drugA: 'カテコラミン（ドパミン、ドブタミン）', drugB: 'アルカリ性薬剤', risk: 'danger',
    phenomenon: '着色・力価低下', mechanism: 'カテコラミンは酸性側で安定。アルカリ環境で酸化分解', countermeasure: '単独ルート推奨。流量変化で投与量に直結するため側管投与は危険', category: 'pH変動',
  },
  {
    id: 'c14', drugA: 'インスリン', drugB: '輸液バッグ内壁', risk: 'warning',
    phenomenon: 'バッグ・チューブへの吸着', mechanism: 'インスリンがプラスチック内壁に吸着し、実投与量が減少', countermeasure: 'バッグを数回転倒混和。初めの50mL程度は吸着で濃度低い前提で管理', category: '吸着',
  },
]

// ========================================
// 側管投与の基本ルール
// ========================================

const SIDE_INFUSION_RULES = [
  { rule: 'メインを一時停止してから側管薬を投与', reason: 'カテコラミンやインスリンなど微量調整薬がメインにある場合、側管からの薬液流入で流量が変わり投与量に影響する' },
  { rule: '投与前後に生食（または5%Glu）でフラッシュ', reason: 'ルート内で前後の薬剤が混合し配合変化を起こすことを防ぐ' },
  { rule: 'pH差の大きい薬剤は別ルートで投与', reason: 'アルカリ性（pH>8）と酸性（pH<5）の薬剤は混合で沈殿・分解リスクが高い' },
  { rule: '脂肪乳剤（イントラリポス等）は原則単独ルート', reason: '電解質や薬剤との接触で乳化が破壊される（クラッキング）' },
  { rule: '配合変化が不明な場合は「混ぜない」を原則とする', reason: 'ルート閉塞や力価低下は在宅では即座に対応できないため、安全側に倒す' },
]

// ========================================
// メインコンポーネント
// ========================================

export function CompatibilityGuide() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedRisk, setSelectedRisk] = useState<string>('all')
  const [searchText, setSearchText] = useState('')

  const categories = ['all', 'pH変動', 'カルシウム', '脂肪乳剤', 'TPN', '吸着', '在宅頻用']
  const categoryLabels: Record<string, string> = {
    all: 'すべて', 'pH変動': '⚗️ pH変動', 'カルシウム': '🧪 カルシウム', '脂肪乳剤': '💧 脂肪乳剤', TPN: '🩸 TPN', '吸着': '📎 吸着', '在宅頻用': '✅ 在宅頻用',
  }

  const filtered = COMPATIBILITY_DATA.filter(entry => {
    if (selectedCategory !== 'all' && entry.category !== selectedCategory) return false
    if (selectedRisk !== 'all' && entry.risk !== selectedRisk) return false
    if (searchText) {
      const q = searchText.toLowerCase()
      if (!entry.drugA.toLowerCase().includes(q) && !entry.drugB.toLowerCase().includes(q) && !entry.phenomenon.toLowerCase().includes(q)) return false
    }
    return true
  })

  const riskLabel = (r: RiskLevel) => {
    switch (r) {
      case 'danger': return { text: '禁忌', bg: 'bg-red-100 text-red-700 border-red-200' }
      case 'warning': return { text: '注意', bg: 'bg-amber-100 text-amber-700 border-amber-200' }
      case 'caution': return { text: '条件付', bg: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
      case 'safe': return { text: '配合可', bg: 'bg-green-100 text-green-700 border-green-200' }
    }
  }

  return (
    <div className="space-y-6">
      {/* セクション1: 側管投与の基本ルール */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-lg font-bold text-gray-900">📋 側管投与の基本ルール</h3>
        <p className="mb-4 text-sm text-gray-500">在宅で点滴を扱う際に必ず守るべき原則です。</p>
        <div className="space-y-3">
          {SIDE_INFUSION_RULES.map((item, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{i + 1}</span>
                <div>
                  <p className="font-medium text-gray-900">{item.rule}</p>
                  <p className="mt-1 text-sm text-gray-500">{item.reason}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* セクション2: 配合変化一覧 */}
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
        <h3 className="mb-1 text-lg font-bold text-gray-900">🔍 配合変化データベース</h3>
        <p className="mb-4 text-sm text-gray-500">在宅で遭遇しやすい組み合わせを中心にまとめています。</p>

        {/* フィルター */}
        <div className="mb-4 space-y-3">
          <input
            type="text"
            placeholder="薬剤名で検索..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  selectedCategory === cat ? 'bg-blue-600 text-white' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {categoryLabels[cat] || cat}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {(['all', 'danger', 'warning', 'caution', 'safe'] as const).map(r => (
              <button
                key={r}
                onClick={() => setSelectedRisk(r)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  selectedRisk === r ? 'bg-blue-600 text-white' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {r === 'all' ? 'すべて' : riskLabel(r).text}
              </button>
            ))}
          </div>
        </div>

        {/* カード一覧 */}
        <div className="space-y-3">
          {filtered.map(entry => {
            const risk = riskLabel(entry.risk)
            return (
              <div key={entry.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <span>{entry.drugA}</span>
                    <span className="text-gray-400">×</span>
                    <span>{entry.drugB}</span>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${risk.bg}`}>
                    {risk.text}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium text-gray-600">現象:</span> <span className="text-gray-800">{entry.phenomenon}</span></p>
                  <p><span className="font-medium text-gray-600">機序:</span> <span className="text-gray-500">{entry.mechanism}</span></p>
                  <p><span className="font-medium text-blue-600">対策:</span> <span className="text-gray-800">{entry.countermeasure}</span></p>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-400">該当する組み合わせがありません</p>
          )}
        </div>
      </section>

      {/* セクション3: pH早見表 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-lg font-bold text-gray-900">📊 在宅頻用注射薬のpH早見表</h3>
        <p className="mb-4 text-sm text-gray-500">pH差が大きい薬剤同士の混合は配合変化リスクが高くなります。</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-2 text-left font-semibold text-gray-700">薬剤名</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700">pH</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">性質</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">注意点</th>
              </tr>
            </thead>
            <tbody>
              {[
                { drug: 'フェニトイン（アレビアチン）', ph: '約12', prop: '強アルカリ', note: '単独ルート必須。他の薬剤との混合禁忌', color: 'bg-purple-50' },
                { drug: 'オメプラゾール（オメプラール）', ph: '9.5〜11', prop: 'アルカリ', note: '酸性輸液で分解。前後フラッシュ必須', color: 'bg-purple-50' },
                { drug: 'フロセミド（ラシックス）', ph: '8.6〜9.6', prop: 'アルカリ', note: '酸性薬剤と白濁', color: 'bg-blue-50' },
                { drug: 'ヘパリンNa', ph: '5.0〜7.5', prop: '中性', note: '比較的安定。モルヒネとの配合可', color: 'bg-green-50' },
                { drug: '生理食塩液', ph: '4.5〜8.0', prop: '中性', note: 'フラッシュの第一選択', color: 'bg-green-50' },
                { drug: '5%ブドウ糖液', ph: '3.5〜6.5', prop: '弱酸性', note: 'アルカリ性薬剤との混合に注意', color: 'bg-yellow-50' },
                { drug: 'モルヒネ塩酸塩注', ph: '2.5〜5.0', prop: '酸性', note: '多くの薬剤と配合可。持続皮下注で頻用', color: 'bg-orange-50' },
                { drug: 'ミダゾラム（ドルミカム）', ph: '約3', prop: '酸性', note: 'アルカリ側で析出。ブドウ糖液で希釈推奨', color: 'bg-orange-50' },
                { drug: 'ドパミン・ドブタミン', ph: '2.5〜5.0', prop: '酸性', note: '単独ルート推奨。微量調整のため流量変化厳禁', color: 'bg-red-50' },
              ].map((row, i) => (
                <tr key={i} className={`border-b border-gray-100 ${row.color}`}>
                  <td className="px-3 py-2 font-medium text-gray-900">{row.drug}</td>
                  <td className="px-3 py-2 text-center font-bold text-gray-900">{row.ph}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      row.prop.includes('アルカリ') ? 'bg-purple-200 text-purple-800' :
                      row.prop === '中性' ? 'bg-green-200 text-green-800' :
                      'bg-orange-200 text-orange-800'
                    }`}>{row.prop}</span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 在宅での注意 */}
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <h3 className="mb-2 font-bold text-red-800">⚠️ 在宅特有の注意点</h3>
        <ul className="space-y-2 text-sm text-red-700">
          <li className="flex items-start gap-2"><span>•</span>在宅では配合変化が起きても即座に発見・対応が難しい。<b>「迷ったら混ぜない」</b>を原則とする</li>
          <li className="flex items-start gap-2"><span>•</span>持続皮下注射で複数薬剤を混合する場合、安定性が確認された組み合わせのみ使用する</li>
          <li className="flex items-start gap-2"><span>•</span>TPN調製は無菌操作に加え、<b>混合順序</b>（ビタミン・微量元素は最後に添加）に注意</li>
          <li className="flex items-start gap-2"><span>•</span>患者・家族への指導: 輸液バッグの色の変化や濁りに気づいたら投与を中止し連絡するよう伝える</li>
          <li className="flex items-start gap-2"><span>•</span>配合変化の情報は各薬剤のインタビューフォームや<b>配合変化表</b>（各メーカーHP）で最新情報を確認する</li>
        </ul>
      </section>
    </div>
  )
}
