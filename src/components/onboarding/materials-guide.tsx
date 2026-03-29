'use client'

import { useState } from 'react'

// ========================================
// 医療材料の分類と供給ルール
// ========================================

type SupplyRoute = 'prescription' | 'hospital-only' | 'consultation' | 'otc'

interface MaterialItem {
  id: string
  name: string
  category: string
  supplyRoute: SupplyRoute
  prescriptionOk: boolean
  reimbursement: string
  notes: string
  examples: string[]
}

const SUPPLY_ROUTE_LABELS: Record<SupplyRoute, { label: string; color: string }> = {
  prescription: { label: '院外処方可', color: 'bg-green-100 text-green-700 border-green-200' },
  'hospital-only': { label: '院内のみ', color: 'bg-red-100 text-red-700 border-red-200' },
  consultation: { label: '医療機関→薬局（合議）', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  otc: { label: '自費/OTC', color: 'bg-gray-100 text-gray-700 border-gray-200' },
}

// ========================================
// 特定保険医療材料（薬局で院外処方可能なもの）
// ========================================
const MATERIALS: MaterialItem[] = [
  // ■ 院外処方可能な特定保険医療材料
  {
    id: 'm1', name: 'インスリン製剤等注射用ディスポーザブル注射器', category: '自己注射関連',
    supplyRoute: 'prescription', prescriptionOk: true,
    reimbursement: '保険償還価格で算定',
    notes: '針を含む。医師の処方箋に基づき交付。高度管理医療機器販売業の許可不要（条件あり）',
    examples: ['マイクロファインプラス', 'JMSシリンジ'],
  },
  {
    id: 'm2', name: '万年筆型注入器用注射針', category: '自己注射関連',
    supplyRoute: 'prescription', prescriptionOk: true,
    reimbursement: '保険償還価格で算定（1本あたり）',
    notes: 'インスリン、GLP-1等のペン型注射器用。BD マイクロファインプロ等',
    examples: ['BD マイクロファインプロ 32G', 'ナノパスニードルII 34G', 'ペンニードル プラス 32G'],
  },
  {
    id: 'm3', name: '在宅中心静脈栄養用輸液セット', category: 'TPN関連',
    supplyRoute: 'prescription', prescriptionOk: true,
    reimbursement: '本体：保険償還価格。フィルター付き/なしで区分あり',
    notes: '医療機関がセット加算を算定した場合は院外処方不可。全て院内か全て院外かの二択',
    examples: ['テルフュージョン輸液セット', 'JMS輸液セット'],
  },
  {
    id: 'm4', name: '埋込型カテーテルアクセス用穿刺針（ヒューバー針）', category: 'TPN関連',
    supplyRoute: 'prescription', prescriptionOk: true,
    reimbursement: '保険償還価格で算定',
    notes: 'CVポート（皮下埋込型）に穿刺して輸液ラインと接続するための針',
    examples: ['グリッパープラス', 'セーフタッチヒューバー針'],
  },
  {
    id: 'm5', name: '携帯型ディスポーザブル注入ポンプ', category: 'ポンプ関連',
    supplyRoute: 'prescription', prescriptionOk: true,
    reimbursement: '保険償還価格で算定。PCA型は別区分',
    notes: 'バルーン型の使い捨てポンプ。在宅化学療法・緩和ケアで使用',
    examples: ['バクスターインフューザー', 'アイフューザー'],
  },
  {
    id: 'm6', name: '腹膜透析液交換セット', category: '透析関連',
    supplyRoute: 'prescription', prescriptionOk: true,
    reimbursement: '保険償還価格で算定',
    notes: 'CAPD（持続携行式腹膜透析）用',
    examples: ['つなぐセット', 'ステイセーフ交換セット'],
  },
  {
    id: 'm7', name: '在宅寝たきり患者処置用栄養用ディスポーザブルカテーテル', category: '栄養関連',
    supplyRoute: 'prescription', prescriptionOk: true,
    reimbursement: '保険償還価格で算定',
    notes: '経管栄養用のチューブ。胃ろう用ボタン型は別区分',
    examples: ['NGチューブ', 'フィーディングチューブ'],
  },
  {
    id: 'm8', name: '在宅寝たきり患者処置用膀胱留置用ディスポーザブルカテーテル', category: '排泄関連',
    supplyRoute: 'prescription', prescriptionOk: true,
    reimbursement: '保険償還価格で算定',
    notes: 'フォーリーカテーテルなど。在宅での定期交換に使用',
    examples: ['バードI.C.フォーリートレイ', 'シルバーフォーリーカテーテル'],
  },
  {
    id: 'm9', name: '在宅寝たきり患者処置用気管切開後留置用チューブ', category: '呼吸関連',
    supplyRoute: 'prescription', prescriptionOk: true,
    reimbursement: '保険償還価格で算定',
    notes: '気管切開患者の在宅管理用',
    examples: ['コーケンネオブレス', 'シャイリー気管切開チューブ'],
  },
  {
    id: 'm10', name: '皮膚欠損用創傷被覆材', category: '創傷関連',
    supplyRoute: 'prescription', prescriptionOk: true,
    reimbursement: '保険償還価格で算定',
    notes: '褥瘡等のドレッシング材。院外処方箋で交付可能',
    examples: ['デュオアクティブ', 'ハイドロサイト', 'カルトスタット', 'アクアセル'],
  },
  {
    id: 'm11', name: '非固着性シリコンガーゼ', category: '創傷関連',
    supplyRoute: 'prescription', prescriptionOk: true,
    reimbursement: '保険償還価格で算定',
    notes: '傷に付着しにくいガーゼ。創傷被覆材とは別区分',
    examples: ['メピテル', 'アダプティック'],
  },
  {
    id: 'm12', name: '在宅血液透析用特定保険医療材料', category: '透析関連',
    supplyRoute: 'prescription', prescriptionOk: true,
    reimbursement: '保険償還価格で算定',
    notes: '在宅血液透析の回路等',
    examples: ['透析回路セット'],
  },
  {
    id: 'm13', name: '水循環回路セット', category: '特殊',
    supplyRoute: 'prescription', prescriptionOk: true,
    reimbursement: '保険償還価格で算定',
    notes: '体温調節等に使用',
    examples: [],
  },

  // ■ 衛生材料（合議ルート）
  {
    id: 'm20', name: 'ガーゼ・脱脂綿', category: '衛生材料',
    supplyRoute: 'consultation', prescriptionOk: false,
    reimbursement: '医療機関→薬局間の合議（購入価格ベース）',
    notes: '処方箋では出せない。医療機関の指示により薬局が患者に供給し、費用は医療機関に請求する',
    examples: ['滅菌ガーゼ', '脱脂綿'],
  },
  {
    id: 'm21', name: '絆創膏・テープ類', category: '衛生材料',
    supplyRoute: 'consultation', prescriptionOk: false,
    reimbursement: '合議',
    notes: '同上。在宅薬学総合体制加算の施設基準で衛生材料供給体制が求められる',
    examples: ['サージカルテープ', 'マイクロポア', 'テガダーム（固定用フィルム）'],
  },
  {
    id: 'm22', name: '消毒綿・アルコール綿', category: '衛生材料',
    supplyRoute: 'consultation', prescriptionOk: false,
    reimbursement: '合議',
    notes: 'インスリン注射やCVポート消毒に使用。大量に必要',
    examples: ['アルウエッティone', 'エタノール綿'],
  },
  {
    id: 'm23', name: '手袋（ディスポ）', category: '衛生材料',
    supplyRoute: 'consultation', prescriptionOk: false,
    reimbursement: '合議',
    notes: '褥瘡処置、ストーマケア等で必要',
    examples: ['プラスチック手袋', 'ラテックス手袋'],
  },

  // ■ 院内のみ（薬局では扱えない）
  {
    id: 'm30', name: '注射器（自己注射用以外）', category: '処置用',
    supplyRoute: 'hospital-only', prescriptionOk: false,
    reimbursement: '医療機関の処置料に包括',
    notes: '薬剤師が訪問時に使う注射器は処方箋では出せない。医療機関から支給',
    examples: ['ディスポーザブルシリンジ（自己注射用以外）'],
  },
  {
    id: 'm31', name: '翼状針・留置針', category: '処置用',
    supplyRoute: 'hospital-only', prescriptionOk: false,
    reimbursement: '医療機関側で算定',
    notes: '点滴用の翼状針は特定保険医療材料に該当しないため処方箋では出せない',
    examples: ['サーフロー留置針', '翼状針'],
  },
  {
    id: 'm32', name: '採血管・スピッツ', category: '検査用',
    supplyRoute: 'hospital-only', prescriptionOk: false,
    reimbursement: '検査料に包括',
    notes: '検査に付随する材料は医療機関の管轄',
    examples: [],
  },
  {
    id: 'm33', name: '吸引カテーテル', category: '処置用',
    supplyRoute: 'hospital-only', prescriptionOk: false,
    reimbursement: '在宅療養指導管理材料加算に包括',
    notes: '在宅人工呼吸管理・気管切開管理の指導管理材料として医療機関が供給',
    examples: ['吸引カテーテル各サイズ'],
  },
]

// ========================================
// 重要ルール
// ========================================
const KEY_RULES = [
  {
    title: '特定保険医療材料は「全部院内」か「全部院外」',
    detail: '医療機関がセット加算等を算定した場合、同じカテゴリの材料を院外処方することはできない。逆に院外処方した場合、医療機関はセット加算を算定できない。中途半端な分割は不可。',
    source: '在宅療養指導管理材料加算 通則２',
  },
  {
    title: '衛生材料は「合議」で薬局→医療機関に請求',
    detail: '処方箋には載らない衛生材料（ガーゼ、テープ等）は、医療機関の指示で薬局が患者に供給し、購入価格ベースで医療機関に請求する。価格は相互の合議。',
    source: '保険医療機関及び保険医療養担当規則 第20条、在宅薬学総合体制加算の施設基準',
  },
  {
    title: '院外処方可能な注射薬は限定列挙',
    detail: '在宅で使用するために院外処方箋で出せる注射薬は「厚生労働大臣が定める注射薬」に限定されている。リストにない注射薬は原則院外処方不可。ただし高カロリー輸液・電解質輸液と併用する場合は可能なケースあり。',
    source: '保険医療機関及び保険医療養担当規則 別表第一',
  },
  {
    title: '保険償還価格 ≠ 薬局の購入価格',
    detail: '特定保険医療材料は保険償還価格（告示価格）で保険請求する。薬局の仕入れ値との差が利益にも損失にもなりうる。仕入れルートと価格交渉が重要。',
    source: '特定保険医療材料の材料価格算定に関する留意事項',
  },
  {
    title: '高度管理医療機器の販売業許可',
    detail: 'インスリン注射器等を処方箋に基づき交付する場合、一定の条件を満たせば高度管理医療機器販売業の許可は不要。ただし、それ以外の高度管理医療機器を販売・貸与する場合は許可が必要。',
    source: '薬事法施行規則の一部を改正する省令（平成17年）',
  },
]

// ========================================
// よくある判断に迷うケース
// ========================================
const CONFUSING_CASES = [
  {
    question: 'CVポート患者のヒューバー針は薬局で出せる？',
    answer: '出せる。「埋込型カテーテルアクセス用穿刺針」として特定保険医療材料に該当。保険償還価格で算定。',
    point: '医療機関がセット加算を算定していないことが前提。',
  },
  {
    question: '翼状針（点滴用）は処方箋で出せる？',
    answer: '出せない。翼状針・留置針は特定保険医療材料の対象外。医療機関から支給される。',
    point: '在宅で皮下注射用のカテーテル針（持続皮下注用）は別途確認が必要。',
  },
  {
    question: 'TPN患者の輸液セットとフィルターは別々に処方？',
    answer: 'フィルター付き輸液セットとして一体で処方される場合と、輸液セット＋インラインフィルターで別々の場合がある。保険償還価格も異なるため処方箋の記載を確認。',
    point: '医療機関がセット加算を算定している場合は全て院内供給となり、薬局では出せない。',
  },
  {
    question: '褥瘡のドレッシング材は処方箋で出せる？',
    answer: '出せる。「皮膚欠損用創傷被覆材」として特定保険医療材料に該当。ただし、一般的なガーゼは「衛生材料」なので処方箋では出せない（合議ルート）。',
    point: 'ドレッシング材（デュオアクティブ等）と一般ガーゼを混同しないこと。',
  },
  {
    question: '消毒用アルコール綿は処方箋で出せる？',
    answer: '出せない。衛生材料に該当するため、医療機関の指示で薬局が供給→合議で医療機関に請求する。',
    point: 'インスリン患者は大量に使うため、供給体制の整備が重要。',
  },
  {
    question: 'インスリン患者の注射針だけ他の薬局で出してもいい？',
    answer: '可能。インスリン製剤と注射針は別々の薬局で交付可能。ただし処方箋が必要。',
    point: 'インスリンは処方箋調剤、針も処方箋に基づく交付。両方処方箋に記載が必要。',
  },
  {
    question: 'バルーン型ポンプ（インフューザー等）は薬局で出せる？',
    answer: '出せる。「携帯型ディスポーザブル注入ポンプ」として特定保険医療材料に該当。',
    point: '電動式ポンプ（CADD等）の本体は貸与が一般的で、処方箋での交付対象ではない。',
  },
  {
    question: '在宅酸素療法の材料は薬局で扱える？',
    answer: '原則は医療機関が在宅酸素療法指導管理料で包括的に管理。酸素濃縮器・ボンベはリース会社が供給することが多く、薬局が直接関与するケースは少ない。',
    point: 'ただし、関連する消耗品（カニューレ等）について薬局への問い合わせが来ることはある。',
  },
]

// ========================================
// メインコンポーネント
// ========================================

export function MaterialsGuide() {
  const [selectedRoute, setSelectedRoute] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchText, setSearchText] = useState('')
  const [expandedCase, setExpandedCase] = useState<number | null>(null)

  const categories = ['all', ...Array.from(new Set(MATERIALS.map(m => m.category)))]

  const filtered = MATERIALS.filter(m => {
    if (selectedRoute !== 'all' && m.supplyRoute !== selectedRoute) return false
    if (selectedCategory !== 'all' && m.category !== selectedCategory) return false
    if (searchText) {
      const q = searchText.toLowerCase()
      if (!m.name.toLowerCase().includes(q) && !m.examples.some(e => e.toLowerCase().includes(q))) return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* セクション1: 供給ルートの基本 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-lg font-bold text-gray-900">📦 医療材料の供給ルート（基本）</h3>
        <p className="mb-4 text-sm text-gray-500">薬局が在宅で扱う医療材料は、供給方法が4パターンに分かれます。</p>
        <div className="grid gap-3 md:grid-cols-2">
          {Object.entries(SUPPLY_ROUTE_LABELS).map(([key, val]) => (
            <div key={key} className={`rounded-xl border p-4 ${val.color}`}>
              <p className="font-semibold">{val.label}</p>
              <p className="mt-1 text-xs">
                {key === 'prescription' && '処方箋に記載され、保険償還価格で算定。薬局で在庫を持つ'}
                {key === 'hospital-only' && '医療機関の処置料等に包括。薬局では扱えない'}
                {key === 'consultation' && '処方箋には載らない。医療機関の指示で薬局が供給し、合議価格で請求'}
                {key === 'otc' && '保険適用外。患者の自費購入またはドラッグストア等で購入'}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* セクション2: 重要ルール */}
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <h3 className="mb-1 text-lg font-bold text-gray-900">⚠️ 必ず押さえるルール</h3>
        <div className="space-y-3">
          {KEY_RULES.map((rule, i) => (
            <div key={i} className="rounded-lg border border-red-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">{i + 1}</span>
                <div>
                  <p className="font-semibold text-gray-900">{rule.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{rule.detail}</p>
                  <p className="mt-1 text-xs text-red-500">根拠: {rule.source}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* セクション3: 材料データベース */}
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
        <h3 className="mb-1 text-lg font-bold text-gray-900">🔍 医療材料データベース</h3>
        <p className="mb-4 text-sm text-gray-500">在宅で薬局が関わる材料を供給ルート別にまとめています。</p>

        {/* フィルター */}
        <div className="mb-4 space-y-3">
          <input
            type="text"
            placeholder="材料名・商品名で検索..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedRoute('all')} className={`rounded-full px-3 py-1 text-xs font-medium ${selectedRoute === 'all' ? 'bg-blue-600 text-white' : 'border border-gray-300 bg-white text-gray-700'}`}>すべて</button>
            {Object.entries(SUPPLY_ROUTE_LABELS).map(([key, val]) => (
              <button key={key} onClick={() => setSelectedRoute(key)} className={`rounded-full px-3 py-1 text-xs font-medium ${selectedRoute === key ? 'bg-blue-600 text-white' : 'border border-gray-300 bg-white text-gray-700'}`}>
                {val.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`rounded-full px-3 py-1 text-xs font-medium ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'border border-gray-300 bg-white text-gray-700'}`}>
                {cat === 'all' ? 'カテゴリ全て' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* カード一覧 */}
        <div className="space-y-2">
          {filtered.map(m => {
            const route = SUPPLY_ROUTE_LABELS[m.supplyRoute]
            return (
              <div key={m.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{m.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${route.color}`}>{route.label}</span>
                      <span className="text-xs text-gray-400">{m.category}</span>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600">{m.notes}</p>
                <p className="mt-1 text-xs text-blue-600">💰 {m.reimbursement}</p>
                {m.examples.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.examples.map(e => (
                      <span key={e} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{e}</span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {filtered.length === 0 && <p className="py-4 text-center text-sm text-gray-400">該当する材料がありません</p>}
        </div>
      </section>

      {/* セクション4: 判断に迷うケースQ&A */}
      <section className="rounded-2xl border border-purple-200 bg-purple-50 p-6 shadow-sm">
        <h3 className="mb-1 text-lg font-bold text-gray-900">❓ 判断に迷うケース Q&A</h3>
        <p className="mb-4 text-sm text-gray-500">現場でよく迷うケースをまとめました。</p>
        <div className="space-y-2">
          {CONFUSING_CASES.map((c, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <button
                onClick={() => setExpandedCase(expandedCase === i ? null : i)}
                className="w-full p-4 text-left flex items-center justify-between"
              >
                <p className="font-medium text-gray-900">Q. {c.question}</p>
                <span className="text-gray-400 shrink-0 ml-2">{expandedCase === i ? '▲' : '▼'}</span>
              </button>
              {expandedCase === i && (
                <div className="border-t border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm text-gray-800"><span className="font-bold text-green-700">A.</span> {c.answer}</p>
                  <p className="mt-2 text-xs text-purple-600">💡 {c.point}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
