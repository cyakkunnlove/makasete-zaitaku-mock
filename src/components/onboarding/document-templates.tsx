'use client'

import { useState, useRef } from 'react'

// ========================================
// 薬局情報（デモ用。実際はログインユーザーから取得）
// ========================================

interface PharmacyInfo {
  name: string
  address: string
  phone: string
  fax: string
  manager: string
  openHours: string
  emergencyPhone: string
}

const DEMO_PHARMACY: PharmacyInfo = {
  name: '城南みらい薬局',
  address: '東京都世田谷区上馬3-14-6',
  phone: '03-3412-2290',
  fax: '03-3412-2291',
  manager: '山田 美咲',
  openHours: '月〜金 9:00-18:00 / 土 9:00-13:00',
  emergencyPhone: '090-XXXX-XXXX',
}

// ========================================
// 書類テンプレート定義
// ========================================

type DocType = 'contract' | 'important-matter' | 'consent' | 'care-plan' | 'care-manager-report' | 'visit-report'

interface DocTemplate {
  id: DocType
  title: string
  description: string
  icon: string
  required: string
}

const TEMPLATES: DocTemplate[] = [
  { id: 'contract', title: '居宅療養管理指導 契約書', description: '介護保険で算定する場合に必要。利用者用・薬局用の2通。', icon: '📋', required: '介護保険: 必須' },
  { id: 'important-matter', title: '重要事項説明書', description: 'サービス内容・費用・苦情窓口等を記載。契約書と一緒に交付。', icon: '📄', required: '介護保険: 必須' },
  { id: 'consent', title: '個人情報同意書', description: '情報共有の範囲を明記。多職種連携に必要。', icon: '🔒', required: '推奨' },
  { id: 'care-plan', title: '薬学的管理指導計画書', description: '訪問の目的・内容・頻度を計画。算定の根拠となる重要書類。', icon: '📝', required: '必須' },
  { id: 'care-manager-report', title: 'ケアマネジャーへの情報提供書', description: '訪問結果をケアマネに報告。介護保険の算定要件。', icon: '📨', required: '介護保険: 必須' },
  { id: 'visit-report', title: '訪問薬剤管理指導記録（報告書）', description: '訪問ごとに作成し医師に報告。算定要件。', icon: '📊', required: '必須' },
]

// ========================================
// 日付ユーティリティ
// ========================================

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function yearStr() {
  return `${new Date().getFullYear()}`
}

// ========================================
// 印刷用スタイル
// ========================================

const PRINT_STYLES = `
@media print {
  body * { visibility: hidden; }
  .print-area, .print-area * { visibility: visible; }
  .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20mm; }
  .no-print { display: none !important; }
}
`

// ========================================
// メインコンポーネント
// ========================================

export function DocumentTemplates() {
  const [selectedDoc, setSelectedDoc] = useState<DocType | null>(null)
  const [pharmacy, setPharmacy] = useState<PharmacyInfo>(DEMO_PHARMACY)
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-4">
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      {/* 薬局情報編集 */}
      <section className="rounded-xl border border-gray-200 bg-gray-50 p-4 no-print">
        <h4 className="mb-2 text-sm font-semibold text-gray-700">🏪 薬局情報（テンプレートに自動挿入されます）</h4>
        <div className="grid gap-2 md:grid-cols-3">
          {[
            { key: 'name', label: '薬局名' },
            { key: 'address', label: '住所' },
            { key: 'phone', label: '電話番号' },
            { key: 'fax', label: 'FAX' },
            { key: 'manager', label: '管理薬剤師名' },
            { key: 'openHours', label: '営業時間' },
            { key: 'emergencyPhone', label: '緊急連絡先' },
          ].map(field => (
            <div key={field.key}>
              <label className="text-xs text-gray-500">{field.label}</label>
              <input
                type="text"
                value={pharmacy[field.key as keyof PharmacyInfo]}
                onChange={(e) => setPharmacy({ ...pharmacy, [field.key]: e.target.value })}
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
          ))}
        </div>
      </section>

      {/* テンプレート一覧 */}
      <div className="grid gap-3 md:grid-cols-2 no-print">
        {TEMPLATES.map(tmpl => (
          <button
            key={tmpl.id}
            onClick={() => setSelectedDoc(selectedDoc === tmpl.id ? null : tmpl.id)}
            className={`rounded-xl border p-4 text-left transition ${
              selectedDoc === tmpl.id ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{tmpl.icon}</span>
              <span className="font-semibold text-gray-900">{tmpl.title}</span>
            </div>
            <p className="text-xs text-gray-500">{tmpl.description}</p>
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
              tmpl.required === '必須' ? 'bg-red-100 text-red-700' :
              tmpl.required.includes('必須') ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-600'
            }`}>{tmpl.required}</span>
          </button>
        ))}
      </div>

      {/* テンプレートプレビュー */}
      {selectedDoc && (
        <div>
          <div className="mb-3 flex gap-2 no-print">
            <button onClick={handlePrint} className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              🖨️ 印刷 / PDF保存
            </button>
            <p className="flex items-center text-xs text-gray-500">※ 印刷ダイアログで「PDFとして保存」を選ぶとPDFダウンロードできます</p>
          </div>

          <div ref={printRef} className="print-area rounded-xl border border-gray-200 bg-white p-8 shadow-sm" style={{ fontFamily: 'serif', lineHeight: 1.8 }}>
            {selectedDoc === 'contract' && <ContractTemplate pharmacy={pharmacy} />}
            {selectedDoc === 'important-matter' && <ImportantMatterTemplate pharmacy={pharmacy} />}
            {selectedDoc === 'consent' && <ConsentTemplate pharmacy={pharmacy} />}
            {selectedDoc === 'care-plan' && <CarePlanTemplate pharmacy={pharmacy} />}
            {selectedDoc === 'care-manager-report' && <CareManagerReportTemplate pharmacy={pharmacy} />}
            {selectedDoc === 'visit-report' && <VisitReportTemplate pharmacy={pharmacy} />}
          </div>
        </div>
      )}
    </div>
  )
}

// ========================================
// 各テンプレートコンポーネント
// ========================================

function ContractTemplate({ pharmacy }: { pharmacy: PharmacyInfo }) {
  return (
    <div className="space-y-6 text-sm text-gray-900">
      <h2 className="text-center text-xl font-bold">居宅療養管理指導サービス 利用契約書</h2>

      <p className="text-right">{todayStr()}</p>

      <p>利用者（以下「甲」という。）と{pharmacy.name}（以下「乙」という。）は、居宅療養管理指導サービスの提供に関し、以下のとおり契約を締結する。</p>

      <div className="space-y-4">
        <div>
          <h3 className="font-bold">第1条（契約の目的）</h3>
          <p>乙は、介護保険法に基づき、甲の居宅において薬学的管理指導を行い、甲の療養生活の質の向上を図ることを目的とする。</p>
        </div>

        <div>
          <h3 className="font-bold">第2条（サービスの内容）</h3>
          <p>乙は、甲に対し、以下のサービスを提供する。</p>
          <ol className="ml-6 list-decimal space-y-1">
            <li>薬剤の管理に関する指導</li>
            <li>服薬状況、副作用等の確認</li>
            <li>残薬の確認と管理</li>
            <li>処方医への情報提供</li>
            <li>介護支援専門員（ケアマネジャー）への情報提供</li>
            <li>その他、薬学的管理上必要な事項</li>
          </ol>
        </div>

        <div>
          <h3 className="font-bold">第3条（訪問回数・日時）</h3>
          <p>訪問は原則として月____回、____曜日の____時頃とする。ただし、甲の状態変化等により変更する場合がある。</p>
        </div>

        <div>
          <h3 className="font-bold">第4条（利用料金）</h3>
          <p>甲は、介護保険の自己負担分として、1回あたり下記の金額を乙に支払う。</p>
          <table className="mt-2 w-full border-collapse border border-gray-400">
            <thead><tr className="bg-gray-100"><th className="border border-gray-400 px-3 py-1">区分</th><th className="border border-gray-400 px-3 py-1">単位数</th><th className="border border-gray-400 px-3 py-1">1割負担</th><th className="border border-gray-400 px-3 py-1">2割負担</th><th className="border border-gray-400 px-3 py-1">3割負担</th></tr></thead>
            <tbody>
              <tr><td className="border border-gray-400 px-3 py-1">単一建物1人</td><td className="border border-gray-400 px-3 py-1 text-center">518単位</td><td className="border border-gray-400 px-3 py-1 text-center">約518円</td><td className="border border-gray-400 px-3 py-1 text-center">約1,036円</td><td className="border border-gray-400 px-3 py-1 text-center">約1,554円</td></tr>
              <tr><td className="border border-gray-400 px-3 py-1">単一建物2-9人</td><td className="border border-gray-400 px-3 py-1 text-center">378単位</td><td className="border border-gray-400 px-3 py-1 text-center">約378円</td><td className="border border-gray-400 px-3 py-1 text-center">約756円</td><td className="border border-gray-400 px-3 py-1 text-center">約1,134円</td></tr>
            </tbody>
          </table>
          <p className="mt-1 text-xs">※地域区分により1単位あたりの単価が異なります。上記は1単位=10円で概算。</p>
        </div>

        <div>
          <h3 className="font-bold">第5条（契約の解除）</h3>
          <p>甲または乙は、相手方に書面で通知することにより、本契約をいつでも解除することができる。</p>
        </div>

        <div>
          <h3 className="font-bold">第6条（苦情処理）</h3>
          <p>甲は、サービスに関する苦情を下記に申し出ることができる。</p>
          <p>薬局窓口: {pharmacy.phone} / 管理者: {pharmacy.manager}</p>
          <p>国民健康保険団体連合会 / 都道府県介護保険審査委員会</p>
        </div>

        <div>
          <h3 className="font-bold">第7条（個人情報の取扱い）</h3>
          <p>乙は、甲の個人情報を、サービス提供および関係機関との連携に必要な範囲でのみ使用し、適切に管理する。</p>
        </div>
      </div>

      <p className="mt-8">上記の内容に同意し、本契約を締結する。</p>

      <div className="mt-8 grid grid-cols-2 gap-8">
        <div className="space-y-4">
          <p className="font-bold">【利用者（甲）】</p>
          <p>住所: ________________________________</p>
          <p>氏名: __________________ 印</p>
          <p className="text-xs">（代理人の場合）</p>
          <p>氏名: __________________ 印</p>
          <p>続柄: __________________</p>
        </div>
        <div className="space-y-4">
          <p className="font-bold">【事業者（乙）】</p>
          <p>事業所名: {pharmacy.name}</p>
          <p>所在地: {pharmacy.address}</p>
          <p>電話: {pharmacy.phone}</p>
          <p>管理者: {pharmacy.manager}　　印</p>
        </div>
      </div>
    </div>
  )
}

function ImportantMatterTemplate({ pharmacy }: { pharmacy: PharmacyInfo }) {
  return (
    <div className="space-y-4 text-sm text-gray-900">
      <h2 className="text-center text-xl font-bold">重要事項説明書</h2>
      <h3 className="text-center text-base">居宅療養管理指導（薬局）</h3>
      <p className="text-right">{todayStr()}</p>

      <p>当薬局が提供する居宅療養管理指導サービスについて、以下のとおり説明いたします。</p>

      <table className="w-full border-collapse border border-gray-400 text-sm">
        <tbody>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold w-1/3">事業所名</td><td className="border border-gray-400 px-3 py-2">{pharmacy.name}</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">所在地</td><td className="border border-gray-400 px-3 py-2">{pharmacy.address}</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">電話番号</td><td className="border border-gray-400 px-3 py-2">{pharmacy.phone}</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">FAX</td><td className="border border-gray-400 px-3 py-2">{pharmacy.fax}</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">管理薬剤師</td><td className="border border-gray-400 px-3 py-2">{pharmacy.manager}</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">営業時間</td><td className="border border-gray-400 px-3 py-2">{pharmacy.openHours}</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">緊急連絡先</td><td className="border border-gray-400 px-3 py-2">{pharmacy.emergencyPhone}</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">サービス内容</td><td className="border border-gray-400 px-3 py-2">薬剤の管理指導、服薬状況の確認、残薬管理、副作用モニタリング、処方医・ケアマネジャーへの情報提供</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">訪問回数</td><td className="border border-gray-400 px-3 py-2">月____回（介護保険: 月4回まで、がん末期等: 月8回まで）</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">利用料金</td><td className="border border-gray-400 px-3 py-2">介護保険の自己負担分（1〜3割）。単一建物1人: 518単位/回</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">苦情受付窓口</td><td className="border border-gray-400 px-3 py-2">{pharmacy.manager}（{pharmacy.phone}）</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">外部苦情窓口</td><td className="border border-gray-400 px-3 py-2">国民健康保険団体連合会 / 都道府県介護保険審査委員会</td></tr>
        </tbody>
      </table>

      <p className="mt-6">上記の説明を受け、内容を理解しました。</p>
      <div className="mt-4 space-y-2">
        <p>利用者氏名: __________________ 印　　日付: {todayStr()}</p>
        <p>説明者（薬剤師）: {pharmacy.manager}　　印</p>
      </div>
    </div>
  )
}

function ConsentTemplate({ pharmacy }: { pharmacy: PharmacyInfo }) {
  return (
    <div className="space-y-4 text-sm text-gray-900">
      <h2 className="text-center text-xl font-bold">個人情報の使用に関する同意書</h2>
      <p className="text-right">{todayStr()}</p>

      <p>{pharmacy.name}（以下「当薬局」といいます。）は、以下の目的のために利用者様の個人情報を使用いたします。ご同意いただける場合は、署名・押印をお願いいたします。</p>

      <div className="space-y-3">
        <div>
          <h3 className="font-bold">1. 使用する個人情報</h3>
          <p>氏名、住所、電話番号、生年月日、保険情報、病歴、服用薬剤、アレルギー歴、その他療養上必要な情報</p>
        </div>
        <div>
          <h3 className="font-bold">2. 使用目的</h3>
          <ol className="ml-6 list-decimal">
            <li>当薬局における薬学的管理指導業務</li>
            <li>処方医への訪問結果の報告</li>
            <li>介護支援専門員（ケアマネジャー）への情報提供</li>
            <li>訪問看護師、その他関係する医療・介護従事者との連携</li>
            <li>介護保険・医療保険の請求事務</li>
          </ol>
        </div>
        <div>
          <h3 className="font-bold">3. 第三者への提供</h3>
          <p>上記2の範囲内で関係機関に情報を提供します。上記以外の目的で第三者に提供することはありません。</p>
        </div>
        <div>
          <h3 className="font-bold">4. 同意の撤回</h3>
          <p>同意は、書面により、いつでも撤回することができます。</p>
        </div>
      </div>

      <p className="mt-6">上記の内容に同意します。</p>
      <div className="mt-4 space-y-2">
        <p>利用者氏名: __________________ 印</p>
        <p>住所: ________________________________</p>
        <p>日付: {todayStr()}</p>
      </div>
      <div className="mt-4">
        <p>事業所名: {pharmacy.name}</p>
        <p>管理薬剤師: {pharmacy.manager}</p>
      </div>
    </div>
  )
}

function CarePlanTemplate({ pharmacy }: { pharmacy: PharmacyInfo }) {
  return (
    <div className="space-y-4 text-sm text-gray-900">
      <h2 className="text-center text-xl font-bold">薬学的管理指導計画書</h2>
      <p className="text-right">作成日: {todayStr()}</p>

      <table className="w-full border-collapse border border-gray-400">
        <tbody>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold w-1/4">患者氏名</td><td className="border border-gray-400 px-3 py-2 w-1/4">　</td><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold w-1/4">生年月日</td><td className="border border-gray-400 px-3 py-2 w-1/4">　　年　月　日</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">住所</td><td className="border border-gray-400 px-3 py-2" colSpan={3}>　</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">処方医</td><td className="border border-gray-400 px-3 py-2">　</td><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">医療機関名</td><td className="border border-gray-400 px-3 py-2">　</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">ケアマネジャー</td><td className="border border-gray-400 px-3 py-2">　</td><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">事業所名</td><td className="border border-gray-400 px-3 py-2">　</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">介護度</td><td className="border border-gray-400 px-3 py-2">要介護　/　要支援　</td><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">保険種別</td><td className="border border-gray-400 px-3 py-2">□医療保険　□介護保険</td></tr>
        </tbody>
      </table>

      <table className="w-full border-collapse border border-gray-400 mt-4">
        <tbody>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">主な疾患・病態</td><td className="border border-gray-400 px-3 py-2" colSpan={3} style={{minHeight:'40px'}}>　</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">現在の処方内容</td><td className="border border-gray-400 px-3 py-2" colSpan={3} style={{minHeight:'60px'}}>　</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">アレルギー・副作用歴</td><td className="border border-gray-400 px-3 py-2" colSpan={3}>　</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">管理指導の目標</td><td className="border border-gray-400 px-3 py-2" colSpan={3} style={{minHeight:'40px'}}>　</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">実施する指導内容</td><td className="border border-gray-400 px-3 py-2" colSpan={3} style={{minHeight:'80px'}}>
            <p>□ 服薬状況の確認と指導　□ 副作用モニタリング　□ 残薬管理</p>
            <p>□ 一包化・お薬カレンダー　□ 麻薬管理指導　□ 無菌調製</p>
            <p>□ バイタルチェック　□ 在宅医療材料の管理　□ その他（　　　　　）</p>
          </td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">訪問回数</td><td className="border border-gray-400 px-3 py-2">月　　回</td><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">訪問曜日・時間</td><td className="border border-gray-400 px-3 py-2">　</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">処方医への報告方法</td><td className="border border-gray-400 px-3 py-2" colSpan={3}>□ FAX　□ 手渡し　□ 電子（　　　）　/ 頻度: 毎回 / 変更時</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">特記事項</td><td className="border border-gray-400 px-3 py-2" colSpan={3} style={{minHeight:'40px'}}>　</td></tr>
        </tbody>
      </table>

      <div className="mt-4 text-right">
        <p>{pharmacy.name}　管理薬剤師: {pharmacy.manager}</p>
        <p>TEL: {pharmacy.phone}　FAX: {pharmacy.fax}</p>
      </div>
    </div>
  )
}

function CareManagerReportTemplate({ pharmacy }: { pharmacy: PharmacyInfo }) {
  return (
    <div className="space-y-4 text-sm text-gray-900">
      <h2 className="text-center text-xl font-bold">居宅療養管理指導に係る情報提供書</h2>
      <p className="text-right">{todayStr()}</p>

      <p>____________________　介護支援専門員　様</p>
      <p>下記のとおり、居宅療養管理指導の実施内容をご報告いたします。</p>

      <table className="w-full border-collapse border border-gray-400">
        <tbody>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold w-1/4">利用者氏名</td><td className="border border-gray-400 px-3 py-2 w-1/4">　</td><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold w-1/4">訪問日</td><td className="border border-gray-400 px-3 py-2 w-1/4">{yearStr()}年　　月　　日</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">訪問時間</td><td className="border border-gray-400 px-3 py-2">　　:　　〜　　:　　</td><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">訪問回数</td><td className="border border-gray-400 px-3 py-2">本月　　回目</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">処方内容の変更</td><td className="border border-gray-400 px-3 py-2" colSpan={3}>□なし　□あり（内容:　　　　　　　　　　　　　　　　　　）</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">服薬状況</td><td className="border border-gray-400 px-3 py-2" colSpan={3}>□良好　□一部飲み忘れ　□問題あり（　　　　　　　　　　）</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">残薬</td><td className="border border-gray-400 px-3 py-2" colSpan={3}>□なし　□あり（薬剤名:　　　　　　　　約　　日分）</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">副作用</td><td className="border border-gray-400 px-3 py-2" colSpan={3}>□なし　□あり（内容:　　　　　　　　　　　　　　　　　　）</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">生活上の気づき</td><td className="border border-gray-400 px-3 py-2" colSpan={3} style={{minHeight:'60px'}}>　</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">処方医への報告内容</td><td className="border border-gray-400 px-3 py-2" colSpan={3} style={{minHeight:'40px'}}>　</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">次回訪問予定</td><td className="border border-gray-400 px-3 py-2" colSpan={3}>{yearStr()}年　　月　　日</td></tr>
        </tbody>
      </table>

      <div className="mt-4 text-right">
        <p>{pharmacy.name}</p>
        <p>薬剤師: {pharmacy.manager}</p>
        <p>TEL: {pharmacy.phone}　FAX: {pharmacy.fax}</p>
      </div>
    </div>
  )
}

function VisitReportTemplate({ pharmacy }: { pharmacy: PharmacyInfo }) {
  return (
    <div className="space-y-4 text-sm text-gray-900">
      <h2 className="text-center text-xl font-bold">訪問薬剤管理指導記録</h2>
      <p className="text-right">{todayStr()}</p>

      <p>____________________先生　御侍史</p>

      <table className="w-full border-collapse border border-gray-400">
        <tbody>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold w-1/4">患者氏名</td><td className="border border-gray-400 px-3 py-2 w-1/4">　</td><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold w-1/4">訪問日</td><td className="border border-gray-400 px-3 py-2 w-1/4">{yearStr()}年　月　日</td></tr>
          <tr><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">訪問時間</td><td className="border border-gray-400 px-3 py-2">　:　〜　:　</td><td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold">訪問場所</td><td className="border border-gray-400 px-3 py-2">□自宅　□施設（　　　）</td></tr>
        </tbody>
      </table>

      <table className="w-full border-collapse border border-gray-400 mt-2">
        <tbody>
          <tr><td className="border border-gray-400 bg-blue-50 px-3 py-2 font-bold" colSpan={4}>【S】主観的情報（患者・家族からの訴え）</td></tr>
          <tr><td className="border border-gray-400 px-3 py-2" colSpan={4} style={{minHeight:'50px'}}>　</td></tr>
          <tr><td className="border border-gray-400 bg-green-50 px-3 py-2 font-bold" colSpan={4}>【O】客観的情報（バイタル・残薬・服薬状況等）</td></tr>
          <tr><td className="border border-gray-400 px-3 py-2" colSpan={4}>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <span>BP:　　/　　mmHg</span><span>P:　　/min</span><span>SpO2:　　%</span><span>BT:　　℃</span>
            </div>
            <p className="mt-2">服薬状況: □良好　□一部飲み忘れ　□問題あり</p>
            <p>残薬: □なし　□あり（　　　　　約　日分）</p>
          </td></tr>
          <tr><td className="border border-gray-400 bg-yellow-50 px-3 py-2 font-bold" colSpan={4}>【A】評価（薬学的評価・問題点）</td></tr>
          <tr><td className="border border-gray-400 px-3 py-2" colSpan={4} style={{minHeight:'50px'}}>　</td></tr>
          <tr><td className="border border-gray-400 bg-red-50 px-3 py-2 font-bold" colSpan={4}>【P】計画（今後の対応・処方提案）</td></tr>
          <tr><td className="border border-gray-400 px-3 py-2" colSpan={4} style={{minHeight:'50px'}}>　</td></tr>
        </tbody>
      </table>

      <div className="mt-4 text-right">
        <p>{pharmacy.name}</p>
        <p>薬剤師: {pharmacy.manager}</p>
        <p>TEL: {pharmacy.phone}　FAX: {pharmacy.fax}</p>
      </div>
    </div>
  )
}
