'use client'

import { useState } from 'react'

// ========================================
// オピオイド換算データ
// ========================================

type RouteType = '経口' | '注射' | '貼付'
type StrengthClass = 'strong' | 'weak'

interface OpioidDrug {
  id: string
  brandName: string
  genericName: string
  route: RouteType
  strengthClass: StrengthClass
  // 経口モルヒネmg/日への換算係数: morphineEquiv = dose * factor
  morphineFactor: number
  // フェンタニル貼付の場合は特殊処理
  isPatch?: boolean
  specs: string[] // 規格一覧（表示用）
  defaultSpec: number // デフォルト用量(mg)
  unit: string
}

const OPIOID_DRUGS: OpioidDrug[] = [
  // ═══════════════════════════════════
  // 強オピオイド — モルヒネ系
  // ═══════════════════════════════════
  { id: 'mscontin', brandName: 'MSコンチン錠', genericName: 'モルヒネ硫酸塩徐放錠', route: '経口', strengthClass: 'strong', morphineFactor: 1, specs: ['10mg', '30mg', '60mg'], defaultSpec: 30, unit: 'mg' },
  { id: 'ms-twilon', brandName: 'MSツワイスロンカプセル', genericName: 'モルヒネ硫酸塩徐放カプセル', route: '経口', strengthClass: 'strong', morphineFactor: 1, specs: ['10mg', '30mg', '60mg'], defaultSpec: 30, unit: 'mg' },
  { id: 'pacif', brandName: 'パシーフカプセル', genericName: 'モルヒネ塩酸塩徐放カプセル', route: '経口', strengthClass: 'strong', morphineFactor: 1, specs: ['30mg', '60mg', '120mg'], defaultSpec: 30, unit: 'mg' },
  { id: 'kadian', brandName: 'カディアンカプセル/スティック', genericName: 'モルヒネ硫酸塩徐放カプセル', route: '経口', strengthClass: 'strong', morphineFactor: 1, specs: ['20mg', '30mg', '60mg'], defaultSpec: 30, unit: 'mg' },
  { id: 'piigard', brandName: 'ピーガード錠', genericName: 'モルヒネ塩酸塩徐放錠', route: '経口', strengthClass: 'strong', morphineFactor: 1, specs: ['20mg', '30mg', '60mg'], defaultSpec: 30, unit: 'mg' },
  { id: 'opso', brandName: 'オプソ内服液', genericName: 'モルヒネ塩酸塩内服液', route: '経口', strengthClass: 'strong', morphineFactor: 1, specs: ['5mg', '10mg'], defaultSpec: 5, unit: 'mg' },
  { id: 'morphine-powder', brandName: 'モルヒネ塩酸塩末/錠', genericName: 'モルヒネ塩酸塩', route: '経口', strengthClass: 'strong', morphineFactor: 1, specs: ['10mg'], defaultSpec: 10, unit: 'mg' },
  { id: 'anpec-suppository', brandName: 'アンペック坐剤', genericName: 'モルヒネ塩酸塩坐剤（直腸）', route: '経口', strengthClass: 'strong', morphineFactor: 1.5, specs: ['10mg', '20mg', '30mg'], defaultSpec: 20, unit: 'mg' },
  { id: 'morphine-inj', brandName: 'モルヒネ注射液/プレフィルド', genericName: 'モルヒネ塩酸塩注', route: '注射', strengthClass: 'strong', morphineFactor: 3, specs: ['10mg', '50mg', '200mg'], defaultSpec: 10, unit: 'mg' },

  // ═══════════════════════════════════
  // 強オピオイド — オキシコドン系
  // ═══════════════════════════════════
  { id: 'oxycontin', brandName: 'オキシコンチンTR錠', genericName: 'オキシコドン塩酸塩徐放錠', route: '経口', strengthClass: 'strong', morphineFactor: 1.5, specs: ['5mg', '10mg', '20mg', '40mg'], defaultSpec: 10, unit: 'mg' },
  { id: 'oxynorm', brandName: 'オキノーム散', genericName: 'オキシコドン塩酸塩散', route: '経口', strengthClass: 'strong', morphineFactor: 1.5, specs: ['2.5mg', '5mg', '10mg', '20mg'], defaultSpec: 5, unit: 'mg' },
  { id: 'oxifast-inj', brandName: 'オキファスト注', genericName: 'オキシコドン塩酸塩注', route: '注射', strengthClass: 'strong', morphineFactor: 4, specs: ['10mg', '50mg'], defaultSpec: 10, unit: 'mg' },

  // ═══════════════════════════════════
  // 強オピオイド — フェンタニル系
  // ═══════════════════════════════════
  { id: 'fentanyl-patch', brandName: 'フェントス/デュロテップMTパッチ', genericName: 'フェンタニルクエン酸塩貼付', route: '貼付', strengthClass: 'strong', morphineFactor: 1, isPatch: true, specs: ['0.5mg(12.5μg/h)', '1mg(25μg/h)', '2mg(50μg/h)', '4mg(100μg/h)', '6mg(150μg/h)', '8mg(200μg/h)'], defaultSpec: 25, unit: 'μg/h' },
  { id: 'fentos-1day', brandName: 'ワンデュロパッチ', genericName: 'フェンタニル1日貼付', route: '貼付', strengthClass: 'strong', morphineFactor: 1, isPatch: true, specs: ['0.84mg(12.5μg/h)', '1.7mg(25μg/h)', '3.4mg(50μg/h)', '5mg(75μg/h)', '6.7mg(100μg/h)'], defaultSpec: 25, unit: 'μg/h' },
  { id: 'abstral', brandName: 'アブストラル舌下錠', genericName: 'フェンタニルクエン酸塩舌下錠', route: '経口', strengthClass: 'strong', morphineFactor: 1, specs: ['100μg', '200μg', '400μg'], defaultSpec: 0.1, unit: 'mg' },
  { id: 'efen', brandName: 'イーフェンバッカル錠', genericName: 'フェンタニルクエン酸塩バッカル錠', route: '経口', strengthClass: 'strong', morphineFactor: 1, specs: ['50μg', '100μg', '200μg', '400μg', '600μg', '800μg'], defaultSpec: 0.1, unit: 'mg' },
  { id: 'fentanyl-inj', brandName: 'フェンタニル注射液', genericName: 'フェンタニルクエン酸塩注', route: '注射', strengthClass: 'strong', morphineFactor: 100, specs: ['0.1mg', '0.25mg', '0.5mg'], defaultSpec: 0.1, unit: 'mg' },

  // ═══════════════════════════════════
  // 強オピオイド — ヒドロモルフォン系
  // ═══════════════════════════════════
  { id: 'nalsus', brandName: 'ナルサス錠', genericName: 'ヒドロモルフォン塩酸塩徐放錠', route: '経口', strengthClass: 'strong', morphineFactor: 5, specs: ['2mg', '6mg', '12mg', '24mg'], defaultSpec: 6, unit: 'mg' },
  { id: 'nalrapid', brandName: 'ナルラピド錠', genericName: 'ヒドロモルフォン塩酸塩速放錠', route: '経口', strengthClass: 'strong', morphineFactor: 5, specs: ['1mg', '2mg', '4mg'], defaultSpec: 1, unit: 'mg' },
  { id: 'narvein', brandName: 'ナルベイン注', genericName: 'ヒドロモルフォン塩酸塩注', route: '注射', strengthClass: 'strong', morphineFactor: 20, specs: ['2mg', '20mg'], defaultSpec: 2, unit: 'mg' },

  // ═══════════════════════════════════
  // 強オピオイド — メサドン
  // ═══════════════════════════════════
  { id: 'methadone', brandName: 'メサペイン錠', genericName: 'メサドン塩酸塩', route: '経口', strengthClass: 'strong', morphineFactor: -1, specs: ['5mg', '10mg'], defaultSpec: 5, unit: 'mg' },
  // ※メサドンは換算比が非線形（モルヒネ量で変動）。後述の特殊処理で対応

  // ═══════════════════════════════════
  // 強オピオイド — タペンタドール
  // ═══════════════════════════════════
  { id: 'tapenta', brandName: 'タペンタ錠', genericName: 'タペンタドール塩酸塩', route: '経口', strengthClass: 'strong', morphineFactor: 0.2, specs: ['25mg', '50mg', '100mg'], defaultSpec: 50, unit: 'mg' },

  // ═══════════════════════════════════
  // 強オピオイド — ペチジン（調剤薬局で処方されることは稀だが麻薬として記載）
  // ═══════════════════════════════════
  { id: 'pethidine', brandName: 'ペチジン注/オピスタン注', genericName: 'ペチジン塩酸塩', route: '注射', strengthClass: 'strong', morphineFactor: 0.3, specs: ['35mg', '50mg'], defaultSpec: 50, unit: 'mg' },

  // ═══════════════════════════════════
  // 非麻薬性 — ブプレノルフィン
  // ═══════════════════════════════════
  { id: 'norspan', brandName: 'ノルスパンテープ', genericName: 'ブプレノルフィン貼付', route: '貼付', strengthClass: 'strong', morphineFactor: 1, isPatch: true, specs: ['5mg(5μg/h)', '10mg(10μg/h)', '20mg(20μg/h)'], defaultSpec: 10, unit: 'μg/h' },
  { id: 'lepetan-inj', brandName: 'レペタン注', genericName: 'ブプレノルフィン塩酸塩注（※部分作動薬・天井効果あり）', route: '注射', strengthClass: 'strong', morphineFactor: 40, specs: ['0.2mg', '0.3mg'], defaultSpec: 0.2, unit: 'mg' },

  // ═══════════════════════════════════
  // 弱オピオイド
  // ═══════════════════════════════════
  { id: 'codeine', brandName: 'コデインリン酸塩錠/散', genericName: 'コデインリン酸塩', route: '経口', strengthClass: 'weak', morphineFactor: 1/6, specs: ['5mg', '20mg'], defaultSpec: 20, unit: 'mg' },
  { id: 'dihydrocodeine', brandName: 'ジヒドロコデインリン酸塩散', genericName: 'ジヒドロコデイン', route: '経口', strengthClass: 'weak', morphineFactor: 1/3, specs: ['10mg'], defaultSpec: 10, unit: 'mg' },
  { id: 'tramadol', brandName: 'トラマールOD錠/カプセル', genericName: 'トラマドール塩酸塩', route: '経口', strengthClass: 'weak', morphineFactor: 0.2, specs: ['25mg', '50mg'], defaultSpec: 50, unit: 'mg' },
  { id: 'onetram', brandName: 'ワントラム錠', genericName: 'トラマドール塩酸塩徐放', route: '経口', strengthClass: 'weak', morphineFactor: 0.2, specs: ['100mg', '150mg', '200mg'], defaultSpec: 100, unit: 'mg' },
  { id: 'tramal-inj', brandName: 'トラマール注', genericName: 'トラマドール塩酸塩注', route: '注射', strengthClass: 'weak', morphineFactor: 0.25, specs: ['100mg'], defaultSpec: 100, unit: 'mg' },
  { id: 'tramcet', brandName: 'トラムセット配合錠', genericName: 'トラマドール37.5mg+アセトアミノフェン325mg', route: '経口', strengthClass: 'weak', morphineFactor: 0.2, specs: ['37.5mg(トラマドール分)'], defaultSpec: 37.5, unit: 'mg' },
  { id: 'pentazocine', brandName: 'ソセゴン錠/注', genericName: 'ペンタゾシン', route: '経口', strengthClass: 'weak', morphineFactor: 0.17, specs: ['25mg'], defaultSpec: 25, unit: 'mg' },
  { id: 'lepetan-supp', brandName: 'レペタン坐剤', genericName: 'ブプレノルフィン坐剤（直腸・※部分作動薬）', route: '経口', strengthClass: 'strong', morphineFactor: 30, specs: ['0.2mg', '0.4mg'], defaultSpec: 0.2, unit: 'mg' },
]

// フェンタニル貼付の換算テーブル（μg/h → 経口モルヒネmg/日）
const FENTANYL_PATCH_TABLE: Record<number, number> = {
  12.5: 30,
  25: 60,
  50: 120,
  75: 180,
  100: 240,
  150: 360,
  200: 480,
}

// ノルスパンテープの換算テーブル（μg/h → 経口モルヒネmg/日相当）
// ※非がん性慢性疼痛用。天井効果あり。がん性疼痛への換算は参考値
const NORSPAN_TABLE: Record<number, number> = {
  5: 15,   // 5μg/h ≈ 経口モルヒネ15mg/日
  10: 30,  // 10μg/h ≈ 30mg/日
  20: 60,  // 20μg/h ≈ 60mg/日
}

// メサドンの換算（非線形: モルヒネ量で換算比が変わる）
// メサペイン適正使用ガイドに準拠
function _methadoneFromMorphine(morphineMgPerDay: number): number {
  // 逆算: モルヒネ→メサドン用量（参考値）。切替シミュレーターで将来使用
  if (morphineMgPerDay <= 90) return morphineMgPerDay / 4      // 4:1
  if (morphineMgPerDay <= 300) return morphineMgPerDay / 8     // 8:1
  if (morphineMgPerDay <= 600) return morphineMgPerDay / 12    // 12:1
  return morphineMgPerDay / 16                                  // 16:1
}

function methadoneToMorphine(methadoneMgPerDay: number): number {
  // メサドン→モルヒネ換算（概算。実際はメサペイン適正使用ガイド参照）
  // 安全のため控えめに5:1で換算
  return methadoneMgPerDay * 5
}

function calcMorphineEquiv(drug: OpioidDrug, dosePerTime: number, timesPerDay: number): number {
  if (drug.isPatch) {
    if (drug.id === 'norspan') {
      return NORSPAN_TABLE[dosePerTime] ?? (dosePerTime * 3)
    }
    // フェンタニル貼付剤は1日量ではなくμg/hで換算
    return FENTANYL_PATCH_TABLE[dosePerTime] ?? (dosePerTime * 2.4)
  }
  if (drug.id === 'methadone') {
    const dailyDose = dosePerTime * timesPerDay
    return methadoneToMorphine(dailyDose)
  }
  // アブストラル・イーフェンは1回使用のROO製剤（Rapid Onset Opioid）
  // レスキュー目的。1回量×回数でモルヒネ換算（概算: フェンタニル経粘膜≈経口モルヒネ1:1は不正確だが目安）
  if (drug.id === 'abstral' || drug.id === 'efen') {
    const dailyDose = dosePerTime * timesPerDay // mg単位
    // フェンタニルROOは単純換算困難。目安としてフェンタニル0.1mg≈モルヒネ10mg程度
    return dailyDose * 100
  }
  const dailyDose = dosePerTime * timesPerDay
  return dailyDose * drug.morphineFactor
}

// ========================================
// 等力価換算表
// ========================================

const CONVERSION_TABLE = [
  // 強オピオイド
  { drug: '経口モルヒネ（基準）', example: 'MSコンチン, オプソ, パシーフ, カディアン, ピーガード', route: '経口', cls: 'strong', dose30: '30mg', dose60: '60mg', dose120: '120mg' },
  { drug: 'モルヒネ坐剤', example: 'アンペック坐剤', route: '直腸', cls: 'strong', dose30: '20mg', dose60: '40mg', dose120: '80mg' },
  { drug: 'モルヒネ注射', example: 'モルヒネ塩酸塩注, プレフィルド', route: '注射', cls: 'strong', dose30: '10mg', dose60: '20mg', dose120: '40mg' },
  { drug: 'オキシコドン経口', example: 'オキシコンチンTR, オキノーム', route: '経口', cls: 'strong', dose30: '20mg', dose60: '40mg', dose120: '80mg' },
  { drug: 'オキシコドン注射', example: 'オキファスト注', route: '注射', cls: 'strong', dose30: '7.5mg', dose60: '15mg', dose120: '30mg' },
  { drug: 'フェンタニル貼付', example: 'フェントス, デュロテップMT, ワンデュロ', route: '貼付', cls: 'strong', dose30: '12.5μg/h', dose60: '25μg/h', dose120: '50μg/h' },
  { drug: 'フェンタニル注射', example: 'フェンタニル注', route: '注射', cls: 'strong', dose30: '0.3mg/日', dose60: '0.6mg/日', dose120: '1.2mg/日' },
  { drug: 'ヒドロモルフォン経口', example: 'ナルサス, ナルラピド', route: '経口', cls: 'strong', dose30: '6mg', dose60: '12mg', dose120: '24mg' },
  { drug: 'ヒドロモルフォン注射', example: 'ナルベイン注', route: '注射', cls: 'strong', dose30: '1.5mg/日', dose60: '3mg/日', dose120: '6mg/日' },
  { drug: 'タペンタドール', example: 'タペンタ錠', route: '経口', cls: 'strong', dose30: '150mg', dose60: '300mg', dose120: '—(上限500mg)' },
  { drug: 'メサドン ※', example: 'メサペイン錠', route: '経口', cls: 'methadone', dose30: '※非線形', dose60: '※非線形', dose120: '※非線形' },
  { drug: 'ブプレノルフィン貼付', example: 'ノルスパンテープ', route: '貼付', cls: 'strong', dose30: '10μg/h', dose60: '20μg/h', dose120: '—(上限20μg/h)' },
  // 弱オピオイド
  { drug: 'コデイン', example: 'コデインリン酸塩', route: '経口', cls: 'weak', dose30: '180mg', dose60: '—(上限240mg)', dose120: '—' },
  { drug: 'ジヒドロコデイン', example: 'ジヒドロコデインリン酸塩', route: '経口', cls: 'weak', dose30: '90mg', dose60: '180mg', dose120: '—' },
  { drug: 'トラマドール', example: 'トラマール, ワントラム, トラムセット', route: '経口', cls: 'weak', dose30: '150mg', dose60: '300mg', dose120: '—(上限400mg)' },
  { drug: 'ペンタゾシン', example: 'ソセゴン', route: '経口', cls: 'weak', dose30: '180mg', dose60: '—', dose120: '—' },
]

// ========================================
// 処方入力行
// ========================================

interface PrescriptionRow {
  id: string
  drugId: string
  dosePerTime: number
  timesPerDay: number
  isRescue: boolean
}

let rowCounter = 0
function newRow(isRescue: boolean): PrescriptionRow {
  rowCounter++
  return { id: `row-${rowCounter}`, drugId: 'mscontin', dosePerTime: 30, timesPerDay: isRescue ? 2 : 2, isRescue }
}

// ========================================
// メインコンポーネント
// ========================================

export function NarcoticCalculator() {
  const [rows, setRows] = useState<PrescriptionRow[]>([])
  const [switchTarget, setSwitchTarget] = useState('')
  const [reductionRate, setReductionRate] = useState(80)

  const addRow = (isRescue: boolean) => setRows([...rows, newRow(isRescue)])
  const removeRow = (id: string) => setRows(rows.filter(r => r.id !== id))
  const updateRow = (id: string, patch: Partial<PrescriptionRow>) => {
    setRows(rows.map(r => r.id === id ? { ...r, ...patch } : r))
  }

  // 換算計算
  const regularRows = rows.filter(r => !r.isRescue)
  const rescueRows = rows.filter(r => r.isRescue)

  const calcRow = (row: PrescriptionRow) => {
    const drug = OPIOID_DRUGS.find(d => d.id === row.drugId)
    if (!drug) return 0
    return calcMorphineEquiv(drug, row.dosePerTime, row.timesPerDay)
  }

  const regularTotal = regularRows.reduce((sum, r) => sum + calcRow(r), 0)
  const rescueTotal = rescueRows.reduce((sum, r) => sum + calcRow(r), 0)
  const grandTotal = regularTotal + rescueTotal

  // レスキュー目安
  const rescueGuideMin = Math.round(regularTotal / 6)
  const rescueGuideMax = Math.round(regularTotal / 4)

  // 切替シミュレーション
  const switchDrug = OPIOID_DRUGS.find(d => d.id === switchTarget)
  const switchedDose = switchDrug
    ? switchDrug.isPatch
      ? Object.entries(FENTANYL_PATCH_TABLE).reduce((closest, [ugh, morph]) => {
          const target = grandTotal * (reductionRate / 100)
          return Math.abs(morph - target) < Math.abs(closest[1] - target) ? [ugh, morph] as [string, number] : closest
        }, ['25', 60] as [string, number])
      : null
    : null

  const switchedAmount = switchDrug && !switchDrug.isPatch
    ? switchDrug.id === 'methadone'
      ? Math.round(_methadoneFromMorphine(grandTotal * (reductionRate / 100)))
      : switchDrug.morphineFactor > 0
        ? Math.round((grandTotal * (reductionRate / 100)) / switchDrug.morphineFactor)
        : 0
    : 0

  return (
    <div className="space-y-6">
      {/* セクション1: 等力価換算表 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-lg font-bold text-gray-900">📊 オピオイド等力価換算表</h3>
        <p className="mb-4 text-sm text-gray-500">経口モルヒネを基準とした換算。同じ列が同等の鎮痛効果。</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-2 text-left font-semibold text-gray-700">薬剤</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">投与経路</th>
                <th className="px-3 py-2 text-center font-semibold text-blue-700">モルヒネ<br/>30mg相当</th>
                <th className="px-3 py-2 text-center font-semibold text-blue-700">モルヒネ<br/>60mg相当</th>
                <th className="px-3 py-2 text-center font-semibold text-blue-700">モルヒネ<br/>120mg相当</th>
              </tr>
            </thead>
            <tbody>
              {CONVERSION_TABLE.map((row, i) => (
                <tr key={i} className={`border-b border-gray-100 ${row.cls === 'weak' ? 'bg-amber-50' : row.cls === 'methadone' ? 'bg-red-50' : ''}`}>
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-900">{row.drug}</div>
                    {row.example && <div className="text-xs text-gray-400">{row.example}</div>}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      row.route === '経口' ? 'bg-blue-100 text-blue-700' :
                      row.route === '注射' ? 'bg-red-100 text-red-700' :
                      'bg-green-100 text-green-700'
                    }`}>{row.route}</span>
                  </td>
                  <td className="px-3 py-2 text-center font-medium text-gray-900">{row.dose30}</td>
                  <td className="px-3 py-2 text-center font-medium text-gray-900">{row.dose60}</td>
                  <td className="px-3 py-2 text-center font-medium text-gray-900">{row.dose120}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-white border border-gray-200" /> 強オピオイド</span>
          <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-amber-50 border border-amber-200" /> 弱オピオイド</span>
          <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-red-50 border border-red-200" /> メサドン（非線形換算）</span>
        </div>
        <div className="mt-2 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
          <p><b>※ メサドン（メサペイン）の注意:</b> 換算比がモルヒネ投与量により変動する（非線形）。
          モルヒネ90mg/日以下→4:1、91〜300mg→8:1、301〜600mg→12:1、600mg超→16:1。
          必ず「メサペイン適正使用ガイド」を参照し、e-ラーニング受講済みの薬剤師が対応すること。</p>
        </div>
      </section>

      {/* セクション2: 換算計算機 */}
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
        <h3 className="mb-1 text-lg font-bold text-gray-900">🧮 オピオイド換算計算機</h3>
        <p className="mb-4 text-sm text-gray-500">現在服用中の薬剤を入力すると、経口モルヒネ換算量を算出します。</p>

        {/* 定期薬 */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-semibold text-gray-700">💊 定期薬</h4>
            <button onClick={() => addRow(false)} className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700">
              ＋ 定期薬を追加
            </button>
          </div>
          {regularRows.length === 0 && <p className="text-sm text-gray-400">定期薬が追加されていません</p>}
          {regularRows.map(row => (
            <DrugRow key={row.id} row={row} onChange={updateRow} onRemove={removeRow} />
          ))}
        </div>

        {/* 頓服 */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-semibold text-gray-700">🆘 頓服（レスキュー）</h4>
            <button onClick={() => addRow(true)} className="rounded-full bg-orange-500 px-3 py-1 text-xs font-medium text-white hover:bg-orange-600">
              ＋ 頓服を追加
            </button>
          </div>
          {rescueRows.length === 0 && <p className="text-sm text-gray-400">頓服が追加されていません</p>}
          {rescueRows.map(row => (
            <DrugRow key={row.id} row={row} onChange={updateRow} onRemove={removeRow} isRescue />
          ))}
        </div>

        {/* 結果 */}
        {rows.length > 0 && (
          <div className="rounded-xl border border-blue-300 bg-white p-4">
            <div className="mb-3 text-center">
              <p className="text-xs text-gray-500">合計 経口モルヒネ換算量</p>
              <p className="text-3xl font-bold text-blue-700">{Math.round(grandTotal)} mg/日</p>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="rounded-lg bg-blue-50 p-3 text-center">
                <p className="text-xs text-gray-500">定期分</p>
                <p className="text-lg font-bold text-gray-900">{Math.round(regularTotal)} mg/日</p>
              </div>
              <div className="rounded-lg bg-orange-50 p-3 text-center">
                <p className="text-xs text-gray-500">レスキュー分</p>
                <p className="text-lg font-bold text-gray-900">{Math.round(rescueTotal)} mg/日</p>
              </div>
            </div>
            {regularTotal > 0 && (
              <div className="mt-3 rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-600">💡 レスキュー1回量の目安（定期量の1/6〜1/4）</p>
                <p className="text-sm font-bold text-gray-900">経口モルヒネ換算: {rescueGuideMin}〜{rescueGuideMax} mg/回</p>
              </div>
            )}
            {rows.some(r => r.drugId === 'methadone') && (
              <div className="mt-3 rounded-lg bg-red-100 border border-red-300 p-3 text-xs text-red-800">
                <b>⚠️ メサドン（メサペイン）を含む処方です。</b>メサドンの換算は非線形のため、表示値は概算（5:1）です。
                実際の用量調整は必ず「メサペイン適正使用ガイド」を参照してください。
              </div>
            )}
            {rows.some(r => r.drugId === 'abstral' || r.drugId === 'efen') && (
              <div className="mt-3 rounded-lg bg-amber-100 border border-amber-300 p-3 text-xs text-amber-800">
                <b>💡 アブストラル/イーフェン（ROO製剤）について:</b> フェンタニル経粘膜製剤は突出痛のレスキュー専用です。
                用量は定期オピオイドの量とは独立して個別に用量調節するため、単純なモルヒネ換算は適用できません。表示値は参考程度としてください。
              </div>
            )}
            <p className="mt-3 text-xs text-red-500">
              ⚠️ この換算値はあくまで目安です。実際のオピオイドスイッチングでは、不完全交差耐性を考慮し、換算量の70〜80%を初回投与量とすることが一般的です。必ず医師と相談の上で調整してください。
            </p>
          </div>
        )}
      </section>

      {/* セクション3: 切替シミュレーター */}
      {grandTotal > 0 && (
        <section className="rounded-2xl border border-purple-200 bg-purple-50 p-6 shadow-sm">
          <h3 className="mb-1 text-lg font-bold text-gray-900">🔄 オピオイドスイッチング シミュレーター</h3>
          <p className="mb-4 text-sm text-gray-500">現在のモルヒネ換算量({Math.round(grandTotal)}mg/日)から切替先を選択してください。</p>

          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">切替先の薬剤</label>
              <select
                value={switchTarget}
                onChange={(e) => setSwitchTarget(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">選択してください</option>
                {OPIOID_DRUGS.map(d => (
                  <option key={d.id} value={d.id}>{d.brandName}（{d.route}）</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">減量係数</label>
              <div className="flex items-center gap-2">
                <input
                  type="range" min={50} max={100} step={5}
                  value={reductionRate}
                  onChange={(e) => setReductionRate(Number(e.target.value))}
                  className="flex-1 accent-purple-600"
                />
                <span className="w-12 text-right font-bold text-purple-700">{reductionRate}%</span>
              </div>
              <p className="text-xs text-gray-500">一般的には70〜80%（不完全交差耐性の考慮）</p>
            </div>
          </div>

          {switchDrug && (
            <div className="rounded-xl border border-purple-300 bg-white p-4">
              <h4 className="mb-2 font-semibold text-gray-900">切替結果</h4>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg bg-gray-50 p-3 text-center">
                  <p className="text-xs text-gray-500">現在のモルヒネ換算</p>
                  <p className="text-lg font-bold">{Math.round(grandTotal)} mg/日</p>
                </div>
                <div className="rounded-lg bg-purple-50 p-3 text-center">
                  <p className="text-xs text-gray-500">減量後</p>
                  <p className="text-lg font-bold text-purple-700">{Math.round(grandTotal * reductionRate / 100)} mg/日</p>
                </div>
                <div className="rounded-lg bg-green-50 p-3 text-center">
                  <p className="text-xs text-gray-500">{switchDrug.brandName}</p>
                  <p className="text-lg font-bold text-green-700">
                    {switchDrug.isPatch && switchedDose
                      ? `${switchedDose[0]}μg/h`
                      : `${switchedAmount} ${switchDrug.unit}/日`
                    }
                  </p>
                </div>
              </div>
              {regularTotal > 0 && (
                <div className="mt-3 rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-600">💡 切替後のレスキュー目安（切替後1日量の1/6）</p>
                  <p className="text-sm font-bold text-gray-900">
                    経口モルヒネ換算: {Math.round(grandTotal * reductionRate / 100 / 6)} mg/回
                  </p>
                </div>
              )}
              <p className="mt-3 text-xs text-red-500">
                ⚠️ シミュレーション結果は参考値です。腎機能・肝機能・年齢・副作用歴を考慮し、医師の判断で調整してください。
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

// ========================================
// 薬剤入力行コンポーネント
// ========================================

function DrugRow({
  row,
  onChange,
  onRemove,
  isRescue = false,
}: {
  row: PrescriptionRow
  onChange: (id: string, patch: Partial<PrescriptionRow>) => void
  onRemove: (id: string) => void
  isRescue?: boolean
}) {
  const drug = OPIOID_DRUGS.find(d => d.id === row.drugId)

  const handleDrugChange = (drugId: string) => {
    const newDrug = OPIOID_DRUGS.find(d => d.id === drugId)
    onChange(row.id, {
      drugId,
      dosePerTime: newDrug?.defaultSpec ?? 0,
    })
  }

  return (
    <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-3">
      <select
        value={row.drugId}
        onChange={(e) => handleDrugChange(e.target.value)}
        className="flex-1 min-w-[180px] rounded border border-gray-300 px-2 py-1.5 text-sm"
      >
        {OPIOID_DRUGS.map(d => (
          <option key={d.id} value={d.id}>{d.brandName}</option>
        ))}
      </select>

      <div className="flex items-center gap-1">
        <input
          type="number"
          value={row.dosePerTime}
          onChange={(e) => onChange(row.id, { dosePerTime: Number(e.target.value) })}
          className="w-20 rounded border border-gray-300 px-2 py-1.5 text-right text-sm"
          min={0}
          step={drug?.isPatch ? 12.5 : 1}
        />
        <span className="text-xs text-gray-500">{drug?.isPatch ? 'μg/h' : 'mg'}</span>
      </div>

      {!drug?.isPatch && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">×</span>
          <input
            type="number"
            value={row.timesPerDay}
            onChange={(e) => onChange(row.id, { timesPerDay: Number(e.target.value) })}
            className="w-14 rounded border border-gray-300 px-2 py-1.5 text-right text-sm"
            min={1}
            max={20}
          />
          <span className="text-xs text-gray-500">{isRescue ? '回/日' : '回/日'}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-blue-600">
          ={Math.round(calcMorphineEquiv(drug!, row.dosePerTime, row.timesPerDay))}mg
        </span>
        <button onClick={() => onRemove(row.id)} className="text-red-400 hover:text-red-600">✕</button>
      </div>
    </div>
  )
}
