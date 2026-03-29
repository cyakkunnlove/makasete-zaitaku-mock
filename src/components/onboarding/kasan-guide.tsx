'use client'

import { useState } from 'react'

// ========================================
// 在宅関連の加算一覧（令和6年度改定ベース）
// ========================================

interface KasanItem {
  id: string
  name: string
  points: string
  category: string
  insurance: '医療' | '介護' | '両方'
  requirements: string[]
  keyPoints: string[]
  pitfalls: string[]
}

const KASAN_DATA: KasanItem[] = [
  {
    id: 'k1', name: '在宅患者訪問薬剤管理指導料', points: '1（単一建物1人）: 650点\n2（単一建物2-9人）: 320点\n3（その他）: 290点', category: '基本',
    insurance: '医療',
    requirements: [
      '通院が困難な在宅療養患者に対し、医師の指示に基づき訪問し薬学的管理指導を実施',
      '月4回まで算定可（末期悪性腫瘍・麻薬注射・CVN患者は週2回かつ月8回まで）',
      '月2回以上算定する場合は週1回まで（令和8年度改定で「中6日以上」→「週1回」に変更）',
      '調剤した薬剤の服用期間内に実施（調剤のない月でも算定可、摘要欄に記載要）',
      '薬剤師1人あたり週40回まで',
    ],
    keyPoints: [
      '「通院困難」の判断は医師と連携して行う。歩けなくても通院手段があれば算定不可のケースも',
      '在宅協力薬局が訪問した場合も算定可（摘要欄に記載）',
      '同一日に複数の医療機関の処方で訪問しても、算定は1回のみ',
    ],
    pitfalls: [
      '「単一建物」の人数カウントは同一日に訪問した人数ではなく、同一月にその建物で算定した総患者数',
      '介護保険の居宅療養管理指導費との併算定不可（同一患者・同一月で医療か介護かどちらか）',
      '調剤基本料の注2に該当する薬局（敷地内薬局等）は算定不可',
    ],
  },
  {
    id: 'k2', name: '居宅療養管理指導費', points: '単一建物1人: 518単位\n単一建物2-9人: 378単位\nその他: 341単位\n※1単位≒10円', category: '基本',
    insurance: '介護',
    requirements: [
      '要介護認定を受けた在宅患者に対し、居宅サービス計画に基づき実施',
      '月4回まで（がん末期・CVN患者は月8回まで、2024年度改定）',
      '週1回まで（令和8年度改定で「6日以上の間隔」→「週1回」に変更）',
      '情報提供はケアマネジャーへ（介護保険は医師ではなくケアマネに報告）',
    ],
    keyPoints: [
      '医療保険の訪問薬剤管理指導料とほぼ同内容だが、報告先と算定ルートが異なる',
      '要介護・要支援の患者は原則こちらで算定（医療保険との二重算定不可）',
      '介護予防居宅療養管理指導費もあり（要支援者向け、点数は同じ）',
    ],
    pitfalls: [
      '医療保険で算定すべきケースに介護保険で算定してしまうミス（例: 末期悪性腫瘍は医療保険優先）',
      '居宅サービス計画（ケアプラン）への位置づけが必要',
      '介護保険の場合、自己負担割合が1割・2割・3割と患者によって異なる',
    ],
  },
  {
    id: 'k3', name: '麻薬管理指導加算', points: '100点（令和8年度改定で22点→100点に引上げ）', category: '加算',
    insurance: '医療',
    requirements: [
      '麻薬を調剤し、必要な薬学的管理・指導を行った場合に算定',
      '服薬管理指導料、在宅患者訪問薬剤管理指導料を算定した日に限り算定可能',
      '麻薬の服薬状況、保管状況、残薬の管理、副作用モニタリング等を実施',
    ],
    keyPoints: [
      '在宅に限らず外来でも算定可能（服薬管理指導料に加算）',
      '在宅では訪問薬剤管理指導料に加算して算定',
      '算定のためには薬歴に麻薬管理の指導内容を記録する必要がある',
    ],
    pitfalls: [
      '麻薬を調剤しているだけでは算定不可。指導内容の記録が必須',
      '麻薬の残薬確認・廃棄支援なども含めて指導する',
      '服薬管理指導料を算定しない日には算定できない',
    ],
  },
  {
    id: 'k4', name: '在宅患者医療用麻薬持続注射療法加算', points: '250点', category: '加算',
    insurance: '医療',
    requirements: [
      '在宅で医療用麻薬の持続注射（PCAポンプ等）を行っている患者に対し、訪問し薬学的管理指導を実施',
      '在宅患者訪問薬剤管理指導料の算定日に加算',
      '2024年度改定で新設',
    ],
    keyPoints: [
      '麻薬管理指導加算（22点）とは別の加算。併算定はできない（持続注射加算を算定する場合、麻薬管理指導加算は算定不可）',
      '注射による麻薬投与患者は月8回まで訪問可能',
      '薬液の無菌調製も薬局の役割',
    ],
    pitfalls: [
      '麻薬管理指導加算との併算定不可を見落とすケースがある',
      '持続注射の患者には頻回訪問が必要 → 月8回（週2回）の算定上限を活用',
    ],
  },
  {
    id: 'k5', name: '無菌製剤処理加算', points: 'イ（中心静脈栄養法用輸液）: 69点\nロ（抗悪性腫瘍剤）: 79点\nハ（麻薬注射剤）: 69点\n※15歳未満: イ137点、ロ147点、ハ137点\n（令和8年度改定で小児加算の対象を6歳未満→15歳未満に拡大）', category: '加算',
    insurance: '医療',
    requirements: [
      '無菌室、クリーンベンチ、または安全キャビネットを使用して無菌製剤処理を実施',
      '中心静脈栄養法用輸液、抗悪性腫瘍剤、麻薬注射剤の調製が対象',
      '在宅患者訪問薬剤管理指導料を算定している患者に限る',
    ],
    keyPoints: [
      '2024年度改定で「ハ」が新設（麻薬注射剤を無菌調製した場合。希釈の有無を問わない）',
      'クリーンベンチの設備投資が必要だが、1件あたり69〜79点は収益に大きく貢献',
      '在宅薬学総合体制加算2の施設基準にもクリーンベンチが必要',
    ],
    pitfalls: [
      'クリーンベンチの年次点検（HEPAフィルター等）を怠ると施設基準に影響',
      '無菌調製の記録（手順・環境モニタリング・使用薬剤）を保存すること',
      '抗がん剤は安全キャビネット（陰圧型）が望ましい。クリーンベンチ（陽圧型）での調製は安全性に課題',
    ],
  },
  {
    id: 'k6', name: '在宅薬学総合体制加算', points: '1: 15点\n2: 50点（個人宅）/ 10点（施設）', category: '体制',
    insurance: '医療',
    requirements: [
      '【加算1】在宅訪問の実績、24時間対応体制、ターミナルケアの実績等',
      '【加算2】加算1の要件に加え: ①麻薬6品目以上備蓄（注射剤1品目以上含む） ②麻薬管理指導・無菌製剤処理・小児在宅のいずれかの実績 ③常勤換算3名以上の薬剤師配置 ④高度管理医療機器販売業許可 ⑤衛生材料供給体制（令和8年度改定でクリーンベンチ等の設備要件は廃止→実績・人員要件に変更）',
    ],
    keyPoints: [
      '加算2は処方箋受付ごとに50点（個人宅）→ 月100枚なら月5,000点（＝5万円）の増収',
      '地域連携薬局の要件とほぼ重なる → 取得すればダブルの効果',
      '24時間対応体制は携帯電話による連絡体制でも可',
      '2024年度改定で新設された加算。在宅に本格的に取り組む薬局への評価',
    ],
    pitfalls: [
      '加算2の実績要件（無菌・麻薬持続注射の算定6回以上）は届出前の直近1年間の実績',
      '「衛生材料の供給体制」は実際に供給した実績は不要だが、体制整備の証拠は必要',
      '加算1と2は併算定不可。2を取れるなら2を算定',
    ],
  },
  {
    id: 'k7', name: '在宅患者緊急訪問薬剤管理指導料', points: '1: 500点\n2: 200点', category: '緊急',
    insurance: '医療',
    requirements: [
      '在宅療養患者の急変等に際し、医師の求めにより緊急に訪問し薬学的管理指導を実施',
      '1: 計画的訪問に係る疾患の急変時\n2: それ以外の疾患',
      '月4回まで（末期悪性腫瘍等は月8回まで）',
    ],
    keyPoints: [
      '「医師の求め」が要件。薬局が自主的に行った訪問では算定不可',
      '深夜・休日の緊急訪問には夜間休日等加算（400点）が上乗せ',
      '2024年度改定でターミナルケア時の緊急訪問に新たな評価',
    ],
    pitfalls: [
      '医師の指示を受けた日時の記録が必要',
      '定期訪問の日に急変があった場合、緊急訪問と定期訪問を同日に算定はできない',
    ],
  },
  {
    id: 'k8', name: '在宅患者緊急時等共同指導料', points: '700点', category: '緊急',
    insurance: '医療',
    requirements: [
      '在宅療養患者の急変等に際し、医師、看護師等と共同でカンファレンスを行い、薬学的管理指導を実施',
      '月2回まで',
    ],
    keyPoints: [
      '多職種カンファレンスへの参加が要件',
      'ICTを活用したカンファレンス（ビデオ通話等）でも算定可',
      '700点は在宅加算の中でも高額。積極的に参加すべき',
    ],
    pitfalls: [
      '事前のカンファレンスではなく、急変等に際しての共同指導が要件',
      'カンファレンス参加者の記録（日時・参加者・内容）を保存',
    ],
  },
  {
    id: 'k9', name: 'ターミナルケア加算', points: '1（在宅死亡）: 2,000点\n2（入院先死亡、情報提供あり）: 500点', category: '加算',
    insurance: '医療',
    requirements: [
      '死亡日前14日以内に2回以上の訪問薬剤管理指導を実施した末期患者が死亡した場合',
      '1: 在宅で死亡した場合\n2: 入院先で死亡し、入院先医療機関に情報提供した場合',
    ],
    keyPoints: [
      '2,000点は大きい。末期患者への訪問を14日以内に2回以上行うことが要件',
      '2024年度改定で「2」が新設（入院先死亡＋情報提供でも500点算定可）',
      '看取りに関わる薬局の評価。在宅緩和ケアの質を高めるインセンティブ',
    ],
    pitfalls: [
      '死亡日前14日以内に2回以上の訪問実績がないと算定不可。訪問頻度の管理が重要',
      '訪問記録・カルテにターミナルケアの内容を詳細に記載すること',
    ],
  },
  {
    id: 'k10', name: '在宅患者オンライン薬剤管理指導料', points: '59点', category: '基本',
    insurance: '医療',
    requirements: [
      '在宅療養患者に情報通信機器を用いた薬学的管理指導を実施',
      '訪問薬剤管理指導と同日の実施は不可',
      '月4回まで（訪問と合わせて）',
    ],
    keyPoints: [
      '訪問できない場合の補完的手段として使える',
      '映像と音声の同時送受信が必要（電話のみは不可）',
      '59点は低いが、移動時間ゼロで算定できるメリット',
    ],
    pitfalls: [
      '初回はオンラインのみでは不可。過去に1回以上の訪問実績が必要',
      '通信障害時の対応計画を事前に決めておくこと',
    ],
  },
]

// ========================================
// 実際のケースでのQ&A（疑義解釈ベース）
// ========================================

interface QAItem {
  id: string
  question: string
  answer: string
  source: string
  category: string
}

const QA_DATA: QAItem[] = [
  {
    id: 'qa1', question: '医療保険と介護保険、どちらで算定する？',
    answer: '原則として要介護認定を受けている患者は介護保険で算定（居宅療養管理指導費）。ただし、末期悪性腫瘍の患者など厚生労働大臣が定める疾病等に該当する場合は医療保険で算定する。同一月に医療保険と介護保険の両方で算定することはできない。',
    source: '厚生労働省通知・疑義解釈', category: '基本',
  },
  {
    id: 'qa2', question: '月の途中で要介護認定が出た場合、保険の切り替えはどうなる？',
    answer: '認定日以降は介護保険に切り替える。月の前半に医療保険で算定済みの場合、同一月は医療保険のまま。翌月から介護保険に移行するのが実務上のルール。',
    source: '実務運用', category: '基本',
  },
  {
    id: 'qa3', question: '末期がん患者（要介護3）の訪問は医療保険？介護保険？',
    answer: '医療保険で算定する。「厚生労働大臣が定める疾病等」に「末期の悪性腫瘍」が含まれるため、要介護認定の有無にかかわらず医療保険が優先される。',
    source: '厚生労働大臣が定める疾病等（告示）', category: '基本',
  },
  {
    id: 'qa4', question: '訪問薬剤管理指導料で「単一建物」の人数はどう数える？',
    answer: '同一月に同一建物内で訪問薬剤管理指導料を算定した患者の合計人数。同一日ではない。例: 3/5にAさん、3/15にBさんを同じマンションで訪問→2人カウント→「2-9人」の区分で320点。',
    source: '疑義解釈（平成30年）', category: '算定',
  },
  {
    id: 'qa5', question: '調剤のない月でも訪問薬剤管理指導料は算定できる？',
    answer: 'できる。前回調剤した薬剤の服用期間内であれば、調剤のない月でも訪問し算定可能。ただし、レセプトの摘要欄に「調剤年月日」と「投薬日数」を記載する必要がある。',
    source: '算定要件（7）', category: '算定',
  },
  {
    id: 'qa6', question: '無菌製剤処理加算のクリーンベンチは共同利用でもいい？',
    answer: '他の薬局と共同利用でも算定可能。ただし、共同利用先の薬局名を届出に記載し、共同利用に関する契約を締結していることが必要。在宅薬学総合体制加算2も同様に共同利用が認められている。',
    source: '疑義解釈（令和6年その2）', category: '無菌',
  },
  {
    id: 'qa7', question: '麻薬管理指導加算と在宅患者医療用麻薬持続注射療法加算は併算定できる？',
    answer: 'できない。持続注射療法加算（250点）を算定する場合、麻薬管理指導加算（22点）は算定不可。持続注射療法加算の方が点数が高いので、PCAポンプ等の患者では持続注射療法加算を優先する。',
    source: '在宅患者訪問薬剤管理指導料 注4', category: '加算',
  },
  {
    id: 'qa8', question: 'サ高住（サービス付き高齢者向け住宅）の入居者に訪問できる？',
    answer: 'サ高住は「居宅」に該当するため算定可能。ただし、「医師または薬剤師の配置義務がある施設」に入居している場合は算定不可。特養・老健は算定不可。有料老人ホーム・グループホーム・サ高住は算定可能。',
    source: '疑義解釈', category: '基本',
  },
  {
    id: 'qa9', question: '緊急訪問と定期訪問を同日にできる？',
    answer: 'できない。同一日に定期訪問の訪問薬剤管理指導料と緊急訪問薬剤管理指導料の両方を算定することはできない。どちらかを選択する。通常は緊急訪問（500点）の方が高い。',
    source: '疑義解釈', category: '緊急',
  },
  {
    id: 'qa10', question: '在宅薬学総合体制加算2の「麻薬6品目以上」の数え方は？',
    answer: '成分名ではなく「品目」でカウント。例えばMSコンチン10mgと30mgは2品目。注射剤1品目以上を含む合計6品目以上の備蓄が必要。モルヒネ注、フェンタニル注、オキファスト注のいずれか1品目以上＋経口・貼付の5品目以上、のような構成。',
    source: '在宅薬学総合体制加算の施設基準', category: '体制',
  },
  {
    id: 'qa11', question: 'ターミナルケア加算の「14日以内に2回」はどう数える？',
    answer: '死亡日を含まない死亡日前14日以内。例: 3/20死亡の場合、3/6〜3/19の期間に2回以上の訪問実績が必要。3/20当日の訪問はカウントしない。',
    source: '疑義解釈', category: '加算',
  },
  {
    id: 'qa12', question: 'オンライン薬剤管理指導を初回からできる？',
    answer: 'できない。過去に対面での訪問薬剤管理指導を1回以上実施した患者に限る。初回は必ず対面で訪問する必要がある。',
    source: '算定要件', category: '基本',
  },
  {
    id: 'qa13', question: '地域支援体制加算と在宅薬学総合体制加算は併算定できる？',
    answer: 'できる。両方の施設基準を満たしていれば、処方箋受付ごとに両方の加算を算定可能。在宅に本格的に取り組む薬局は、地域支援体制加算＋在宅薬学総合体制加算2の両取りを目指すべき。',
    source: '施設基準通知', category: '体制',
  },
  {
    id: 'qa14', question: '夜間・休日に緊急訪問した場合の加算は？',
    answer: '在宅患者緊急訪問薬剤管理指導料に夜間休日等加算（400点）を上乗せ可能。さらに2024年度改定で、ターミナル期の患者に深夜に緊急訪問した場合の評価も新設。合計で900点以上になるケースも。',
    source: '令和6年度改定', category: '緊急',
  },
]

// ========================================
// メインコンポーネント
// ========================================

export function KasanGuide() {
  const [selectedKasanCategory, setSelectedKasanCategory] = useState<string>('all')
  const [selectedQACategory, setSelectedQACategory] = useState<string>('all')
  const [expandedKasan, setExpandedKasan] = useState<string | null>(null)
  const [expandedQA, setExpandedQA] = useState<string | null>(null)

  const kasanCategories = ['all', ...Array.from(new Set(KASAN_DATA.map(k => k.category)))]
  const qaCategories = ['all', ...Array.from(new Set(QA_DATA.map(q => q.category)))]

  const filteredKasan = selectedKasanCategory === 'all' ? KASAN_DATA : KASAN_DATA.filter(k => k.category === selectedKasanCategory)
  const filteredQA = selectedQACategory === 'all' ? QA_DATA : QA_DATA.filter(q => q.category === selectedQACategory)

  return (
    <div className="space-y-6">
      {/* セクション1: 加算一覧 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-lg font-bold text-gray-900">📋 在宅関連加算一覧（令和6年度改定準拠）</h3>
        <p className="mb-4 text-sm text-gray-500">在宅で算定できる主な加算をまとめています。タップで詳細を表示。</p>

        <div className="mb-4 flex flex-wrap gap-2">
          {kasanCategories.map(cat => (
            <button key={cat} onClick={() => setSelectedKasanCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${selectedKasanCategory === cat ? 'bg-blue-600 text-white' : 'border border-gray-300 bg-white text-gray-700'}`}>
              {cat === 'all' ? 'すべて' : cat}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filteredKasan.map(k => {
            const isExpanded = expandedKasan === k.id
            return (
              <div key={k.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <button onClick={() => setExpandedKasan(isExpanded ? null : k.id)} className="w-full p-4 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{k.name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${k.insurance === '医療' ? 'bg-blue-100 text-blue-700' : k.insurance === '介護' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                          {k.insurance}保険
                        </span>
                      </div>
                      <pre className="mt-1 whitespace-pre-wrap text-sm font-bold text-blue-600 font-sans">{k.points}</pre>
                    </div>
                    <span className="text-gray-400 shrink-0">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">📝 算定要件</p>
                      <ul className="space-y-1">
                        {k.requirements.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-blue-400 shrink-0">•</span>{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">💡 ポイント</p>
                      <ul className="space-y-1">
                        {k.keyPoints.map((p, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                            <span className="shrink-0">✅</span>{p}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">⚠️ 落とし穴</p>
                      <ul className="space-y-1">
                        {k.pitfalls.map((p, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                            <span className="shrink-0">❌</span>{p}
                          </li>
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

      {/* セクション2: 疑義解釈Q&A */}
      <section className="rounded-2xl border border-purple-200 bg-purple-50 p-6 shadow-sm">
        <h3 className="mb-1 text-lg font-bold text-gray-900">❓ 実務Q&A（疑義解釈・通知ベース）</h3>
        <p className="mb-4 text-sm text-gray-500">現場で実際に迷うケースを疑義解釈・通知に基づきまとめました。</p>

        <div className="mb-4 flex flex-wrap gap-2">
          {qaCategories.map(cat => (
            <button key={cat} onClick={() => setSelectedQACategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${selectedQACategory === cat ? 'bg-purple-600 text-white' : 'border border-gray-300 bg-white text-gray-700'}`}>
              {cat === 'all' ? 'すべて' : cat}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filteredQA.map(q => {
            const isExpanded = expandedQA === q.id
            return (
              <div key={q.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <button onClick={() => setExpandedQA(isExpanded ? null : q.id)} className="w-full p-4 text-left flex items-start justify-between">
                  <p className="font-medium text-gray-900">Q. {q.question}</p>
                  <span className="text-gray-400 shrink-0 ml-2">{isExpanded ? '▲' : '▼'}</span>
                </button>
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    <p className="text-sm text-gray-800"><span className="font-bold text-green-700">A.</span> {q.answer}</p>
                    <p className="mt-2 text-xs text-purple-600">📚 根拠: {q.source}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* 注意書き */}
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <h3 className="mb-2 font-bold text-amber-800">📌 注意事項</h3>
        <ul className="space-y-1 text-sm text-amber-700">
          <li>• 本ページの内容は令和8年度（2026年度）調剤報酬改定に基づいています（2026年6月施行）</li>
          <li>• 主な変更点: 麻薬管理指導加算22→100点、訪問間隔「中6日以上」→「週1回」、在宅薬学総合体制加算2の設備要件廃止→実績要件化、無菌製剤処理加算の小児対象6歳未満→15歳未満</li>
          <li>• 実際の算定にあたっては最新の告示・通知・疑義解釈を必ず確認してください</li>
          <li>• 地方厚生局や審査支払機関の解釈が地域で異なる場合があります</li>
        </ul>
      </section>
    </div>
  )
}
