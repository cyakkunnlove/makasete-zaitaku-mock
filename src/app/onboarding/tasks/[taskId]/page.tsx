'use client'

import { useState, useMemo } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { tasks, learningItems, getTaskTone } from '@/lib/onboarding'
import { Pill, AcceptanceFlow, DocumentTemplates, RoleAssignment, CleanroomGuide } from '@/components/onboarding'

interface Props {
  params: { taskId: string }
}

// 2026年（令和8年）調剤報酬改定 点数表
const POINTS_2026 = {
  // 在宅患者訪問薬剤管理指導料（医療保険）
  home_visit_single: 650,       // 単一建物1人
  home_visit_2_9: 320,          // 単一建物2-9人
  home_visit_10_plus: 290,      // 単一建物10人以上

  // 居宅療養管理指導費（介護保険）※1単位≒10円
  home_visit_single_kaigo: 518,  // 単一建物1人
  home_visit_2_9_kaigo: 378,     // 単一建物2-9人
  home_visit_10_plus_kaigo: 341, // 単一建物10人以上

  // 加算
  narcotic_management: 100,     // 麻薬管理指導加算
  sterile_processing: 69,       // 無菌製剤処理加算（中心静脈栄養法）※令和6年度
  sterile_processing_other: 69, // 無菌製剤処理加算（麻薬）※令和6年度
  terminal_care: 400,           // ターミナルケア薬剤管理指導料
  emergency_visit: 500,         // 緊急訪問薬剤管理指導料（単一建物1人）

  // 在宅薬学総合体制加算
  home_comprehensive_1: 50,     // 在宅薬学総合体制加算1
  home_comprehensive_2_single: 100, // 在宅薬学総合体制加算2（単一建物1人）
  home_comprehensive_2_other: 50,   // 在宅薬学総合体制加算2（その他）

  // 地域支援・医薬品供給対応体制加算（旧 地域支援体制加算 統合後）
  regional_support_2: 17,       // 加算2
  regional_support_3: 10,       // 加算3
  regional_support_4: 80,       // 加算4
  regional_support_5: 115,      // 加算5

  // 調剤基本料
  dispensing_basic_1: 47,       // 調剤基本料1
}

// 1点 = 10円
const POINT_VALUE = 10

function RevenueSimulator() {
  const [patients, setPatients] = useState(10)
  const [visitPerMonth, setVisitPerMonth] = useState(4)
  const [singleRatio, setSingleRatio] = useState(60) // 単一建物1人の割合(%)
  const [medicalRatio, setMedicalRatio] = useState(20) // 医療保険の割合(%)（残りが介護保険）※在宅は介護保険が大半
  const [narcoticRatio, setNarcoticRatio] = useState(20) // 麻薬管理指導の割合(%)
  const [sterileRatio, setSterileRatio] = useState(10) // 無菌製剤の割合(%)
  const [hasRegionalSupport, setHasRegionalSupport] = useState(false)
  const [regionalLevel, setRegionalLevel] = useState(2)
  const [outpatientRx, setOutpatientRx] = useState(800) // 月間外来処方箋枚数（在宅除く）

  const sim = useMemo(() => {
    const totalVisits = patients * visitPerMonth
    const singleVisits = Math.round(totalVisits * singleRatio / 100)
    const facilityVisits = totalVisits - singleVisits

    // 医療保険・介護保険の按分
    const medicalSingleVisits = Math.round(singleVisits * medicalRatio / 100)
    const kaigoSingleVisits = singleVisits - medicalSingleVisits
    const medicalFacilityVisits = Math.round(facilityVisits * medicalRatio / 100)
    const kaigoFacilityVisits = facilityVisits - medicalFacilityVisits

    // 訪問薬剤管理指導料（医療保険）
    const medicalVisitRevenue =
      medicalSingleVisits * POINTS_2026.home_visit_single +
      medicalFacilityVisits * POINTS_2026.home_visit_2_9

    // 居宅療養管理指導費（介護保険）
    const kaigoVisitRevenue =
      kaigoSingleVisits * POINTS_2026.home_visit_single_kaigo +
      kaigoFacilityVisits * POINTS_2026.home_visit_2_9_kaigo

    const visitRevenue = medicalVisitRevenue + kaigoVisitRevenue

    // 麻薬管理指導加算（医療保険のみ）
    const medicalVisits = medicalSingleVisits + medicalFacilityVisits
    const narcoticVisits = Math.round(medicalVisits * narcoticRatio / 100)
    const narcoticRevenue = narcoticVisits * POINTS_2026.narcotic_management

    // 無菌製剤処理加算（医療保険のみ）
    const sterileVisits = Math.round(medicalVisits * sterileRatio / 100)
    const sterileRevenue = sterileVisits * POINTS_2026.sterile_processing_other

    // 在宅薬学総合体制加算（医療保険のみ）
    const comprehensiveRevenue =
      medicalSingleVisits * POINTS_2026.home_comprehensive_2_single +
      medicalFacilityVisits * POINTS_2026.home_comprehensive_2_other

    // 地域支援・医薬品供給対応体制加算（医療保険のみ）
    const regionalPoints = hasRegionalSupport
      ? regionalLevel === 5 ? POINTS_2026.regional_support_5
        : regionalLevel === 4 ? POINTS_2026.regional_support_4
        : regionalLevel === 3 ? POINTS_2026.regional_support_3
        : POINTS_2026.regional_support_2
      : 0
    // 地域体制加算は全処方箋受付ごと（在宅＋外来）
    const totalRxCount = outpatientRx + medicalVisits // 在宅の医療保険分も処方箋受付
    const regionalRevenue = hasRegionalSupport ? totalRxCount * regionalPoints : 0
    const regionalRevenueZaitakuOnly = hasRegionalSupport ? medicalVisits * regionalPoints : 0
    const regionalRevenueOutpatient = hasRegionalSupport ? outpatientRx * regionalPoints : 0

    const totalPoints = medicalVisitRevenue + narcoticRevenue + sterileRevenue + comprehensiveRevenue + regionalRevenue
    const kaigoYen = kaigoVisitRevenue * POINT_VALUE // 介護保険分（単位→円概算）
    const totalYen = totalPoints * POINT_VALUE + kaigoYen
    const annualYen = totalYen * 12

    return {
      totalVisits,
      singleVisits,
      facilityVisits,
      medicalVisitRevenue,
      kaigoVisitRevenue,
      visitRevenue,
      narcoticRevenue,
      sterileRevenue,
      comprehensiveRevenue,
      regionalRevenue,
      regionalRevenueZaitakuOnly,
      regionalRevenueOutpatient,
      totalRxCount,
      totalPoints,
      kaigoYen,
      totalYen,
      annualYen,
    }
  }, [patients, visitPerMonth, singleRatio, medicalRatio, narcoticRatio, sterileRatio, hasRegionalSupport, regionalLevel, outpatientRx])

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-4 font-bold text-gray-900">📊 在宅収益シミュレーション</h3>
        <p className="mb-4 text-sm text-gray-600">
          2026年（令和8年）調剤報酬改定に基づく概算です。スライダーで条件を変えてみてください。
        </p>

        <div className="space-y-4">
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-gray-700">在宅患者数</span>
              <span className="font-bold text-blue-600">{patients}人</span>
            </div>
            <input type="range" min={1} max={100} value={patients} onChange={(e) => setPatients(Number(e.target.value))}
              className="w-full accent-blue-600" />
            <div className="text-xs text-gray-500">
              {patients >= 50 ? '💡 大規模な在宅体制。複数薬剤師での分担が必要です' :
               patients >= 20 ? '中規模。専任薬剤師1名＋サポート体制が理想的です' :
               patients >= 10 ? '立ち上げ〜安定期。まずはここを目指しましょう' :
               '立ち上げ初期。1人からでも始められます'}
            </div>
          </div>

          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-gray-700">月間訪問回数（1人あたり）</span>
              <span className="font-bold text-blue-600">{visitPerMonth}回</span>
            </div>
            <input type="range" min={1} max={8} value={visitPerMonth} onChange={(e) => setVisitPerMonth(Number(e.target.value))}
              className="w-full accent-blue-600" />
            <div className="text-xs text-gray-500">
              {visitPerMonth >= 6 ? '💡 高頻度訪問。末期がんや高カロリー輸液の患者が中心の構成です' :
               visitPerMonth >= 4 ? '標準的な訪問頻度。月4回（週1回）が最も一般的です' :
               visitPerMonth >= 2 ? '月2回訪問。安定した患者が中心の構成です' :
               '月1回訪問。服薬管理がメインの軽度な患者向けです'}
            </div>
          </div>

          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-gray-700">個人宅の割合</span>
              <span className="font-bold text-blue-600">{singleRatio}%</span>
            </div>
            <input type="range" min={0} max={100} step={10} value={singleRatio} onChange={(e) => setSingleRatio(Number(e.target.value))}
              className="w-full accent-blue-600" />
            <div className="text-xs text-gray-500">
              {singleRatio >= 80 ? '💡 個人宅メインの構成です。訪問薬剤管理指導料が高い反面、移動時間が増えます' :
               singleRatio >= 50 ? '個人宅と施設のバランス型。加算の両取りが狙えます' :
               singleRatio >= 20 ? '施設寄りの構成。効率は良いですが単価は低めです' :
               '施設特化型。移動効率は最高ですが、1件あたりの単価は最も低くなります'}
            </div>
          </div>

          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-gray-700">医療保険の割合</span>
              <span className="font-bold text-blue-600">{medicalRatio}%<span className="ml-1 font-normal text-gray-400">（介護{100 - medicalRatio}%）</span></span>
            </div>
            <input type="range" min={0} max={100} step={10} value={medicalRatio} onChange={(e) => setMedicalRatio(Number(e.target.value))}
              className="w-full accent-blue-600" />
            <div className="text-xs text-gray-500">
              {medicalRatio >= 70 ? '💡 医療保険中心。麻薬・無菌の加算が取れる反面、重症患者が多い傾向です' :
               medicalRatio >= 40 ? '医療・介護のバランス型。一般的な在宅薬局の構成です' :
               medicalRatio >= 20 ? '介護保険中心。高齢者の服薬管理がメインの構成です' :
               '介護保険がほぼ全て。居宅療養管理指導費ベースの安定収益型です'}
            </div>
          </div>

          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-gray-700">麻薬管理指導の割合</span>
              <span className="font-bold text-blue-600">{narcoticRatio}%</span>
            </div>
            <input type="range" min={0} max={50} step={5} value={narcoticRatio} onChange={(e) => setNarcoticRatio(Number(e.target.value))}
              className="w-full accent-blue-600" />
            <div className="text-xs text-gray-500">
              {narcoticRatio >= 30 ? '💡 がん患者が多い構成。麻薬管理指導加算100点/回は大きな収益源です' :
               narcoticRatio >= 15 ? '麻薬ありの患者が一定数。加算100点が着実に積み上がります' :
               narcoticRatio >= 5 ? '麻薬患者は少なめ。将来的に受入を増やすと収益向上が見込めます' :
               '麻薬管理なし。がん末期等の受入開始で加算が上乗せされます'}
            </div>
          </div>

          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-gray-700">無菌製剤処理の割合</span>
              <span className="font-bold text-blue-600">{sterileRatio}%</span>
            </div>
            <input type="range" min={0} max={30} step={5} value={sterileRatio} onChange={(e) => setSterileRatio(Number(e.target.value))}
              className="w-full accent-blue-600" />
            <div className="text-xs text-gray-500">
              {sterileRatio >= 20 ? '💡 無菌調剤が多い構成。クリーンベンチ必須。加算69〜75点/回' :
               sterileRatio >= 10 ? 'TPNや抗がん剤の混注あり。設備投資に見合う加算が取れます' :
               sterileRatio >= 5 ? '少数の無菌調剤対応。クリーンベンチの稼働率を意識しましょう' :
               '無菌調剤なし。クリーンベンチ導入で高単価の患者を受け入れられます'}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="regional" checked={hasRegionalSupport}
              onChange={(e) => setHasRegionalSupport(e.target.checked)}
              className="h-4 w-4 accent-blue-600" />
            <label htmlFor="regional" className="text-sm text-gray-700">地域支援・医薬品供給対応体制加算</label>
            {hasRegionalSupport && (
              <select value={regionalLevel} onChange={(e) => setRegionalLevel(Number(e.target.value))}
                className="rounded border border-gray-300 px-2 py-1 text-sm">
                <option value={2}>加算2（17点）</option>
                <option value={3}>加算3（10点）</option>
                <option value={4}>加算4（80点）</option>
                <option value={5}>加算5（115点）</option>
              </select>
            )}
          </div>

          {hasRegionalSupport && (
            <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-700">月間 外来処方箋枚数（在宅除く）</span>
                <span className="font-bold text-green-700">{outpatientRx}枚</span>
              </div>
              <input type="range" min={100} max={3000} step={50} value={outpatientRx} onChange={(e) => setOutpatientRx(Number(e.target.value))}
                className="w-full accent-green-600" />
              <div className="text-xs text-gray-500">
                {outpatientRx >= 2000 ? '💡 大規模薬局。地域体制加算の効果が非常に大きくなります' :
                 outpatientRx >= 1000 ? '中規模薬局。加算の積み上げが月数十万円単位になります' :
                 outpatientRx >= 500 ? '小〜中規模薬局。地域体制加算は安定した上乗せ収入になります' :
                 '小規模薬局。在宅を始めることで加算の取得要件を満たしやすくなります'}
              </div>
              <p className="mt-2 text-xs text-green-700">
                ※ 地域体制加算は<b>全処方箋受付ごと</b>に加算されます。在宅を始めることで加算の施設基準を満たし、外来分にも効果が波及します。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 結果 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-bold text-gray-900">💰 月間売上見込み</h3>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-4 text-center text-white">
            <p className="text-xs text-blue-200">月間売上</p>
            <p className="text-2xl font-bold">¥{sim.totalYen.toLocaleString()}</p>
            <p className="text-xs text-blue-200">医療{sim.totalPoints.toLocaleString()}点 + 介護¥{sim.kaigoYen.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 p-4 text-center text-white">
            <p className="text-xs text-emerald-200">年間売上</p>
            <p className="text-2xl font-bold">¥{sim.annualYen.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-gray-100 p-4 text-center">
            <p className="text-xs text-gray-500">月間訪問数</p>
            <p className="text-2xl font-bold text-gray-900">{sim.totalVisits}回</p>
            <p className="text-xs text-gray-500">個人宅{sim.singleVisits} / 施設{sim.facilityVisits}</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">内訳</h4>
          {[
            { label: '医療保険（訪問薬剤管理指導料）', points: sim.medicalVisitRevenue, desc: `650点×個人宅 + 320点×施設` },
            { label: '介護保険（居宅療養管理指導費）', points: sim.kaigoVisitRevenue, desc: `518単位×個人宅 + 378単位×施設 ※1単位≒10円` },
            { label: '在宅薬学総合体制加算', points: sim.comprehensiveRevenue, desc: `個人宅${POINTS_2026.home_comprehensive_2_single}点 + 施設${POINTS_2026.home_comprehensive_2_other}点` },
            { label: '麻薬管理指導加算', points: sim.narcoticRevenue, desc: `${POINTS_2026.narcotic_management}点 × ${Math.round(sim.totalVisits * narcoticRatio / 100)}回` },
            { label: '無菌製剤処理加算', points: sim.sterileRevenue, desc: `${POINTS_2026.sterile_processing_other}点 × ${Math.round(sim.totalVisits * sterileRatio / 100)}回` },
            ...(hasRegionalSupport ? [
              { label: '地域体制加算（在宅分）', points: sim.regionalRevenueZaitakuOnly, desc: `加算${regionalLevel}（${regionalLevel === 5 ? '115' : regionalLevel === 4 ? '80' : regionalLevel === 3 ? '10' : '17'}点）× 在宅${Math.round(sim.totalVisits * medicalRatio / 100)}回` },
              { label: '地域体制加算（外来分）💡', points: sim.regionalRevenueOutpatient, desc: `加算${regionalLevel}（${regionalLevel === 5 ? '115' : regionalLevel === 4 ? '80' : regionalLevel === 3 ? '10' : '17'}点）× 外来${outpatientRx}枚 — 在宅開始で取得した加算が外来にも波及` },
            ] : []),
          ].filter(r => r.points > 0).map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
              <div>
                <span className="font-medium text-gray-900">{row.label}</span>
                <p className="text-xs text-gray-500">{row.desc}</p>
              </div>
              <span className="font-bold text-gray-900">¥{(row.points * POINT_VALUE).toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          <p className="font-medium">💡 ポイント</p>
          <ul className="mt-1 space-y-1 text-xs">
            <li>• 在宅患者10人（個人宅中心）でも月10万円以上の技術料収入が見込めます</li>
            <li>• 無菌調剤・麻薬管理ができると加算で大幅アップ</li>
            <li>• 地域支援体制加算は在宅以外の処方箋にも適用されるため、薬局全体の収益に影響</li>
            <li>• このアプリのタスクを順に進めれば、通常業務の中で準備が完了します</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function TaskDetailPage({ params }: Props) {
  const { taskId } = params
  const task = tasks.find((t) => t.id === taskId)

  if (!task) {
    notFound()
  }

  const learning = learningItems.find((item) => item.id === task.relatedContentId)
  const isOwnerDecision = task.id === 'task-owner-decision'

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <header className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">{task.title}</h1>
          <Pill tone={getTaskTone(task.status)}>{task.status}</Pill>
        </div>
        <p className="text-sm text-gray-600">{task.note}</p>
      </header>

      {/* タスク情報 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">担当</p>
            <p className="font-medium text-gray-900">{task.owner}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">時期</p>
            <p className="font-medium text-gray-900">{task.due}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">成果物</p>
            <p className="font-medium text-gray-900">{task.deliverable}</p>
          </div>
        </div>
      </section>

      {/* 収益シミュレーション（オーナー方針決定タスクのみ） */}
      {isOwnerDecision && <RevenueSimulator />}

      {/* 初回受入フロー（task-flowのみ） */}
      {taskId === 'task-flow' && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">🗺️ 初回患者受入フロー</h2>
          <p className="mb-4 text-sm text-gray-600">依頼受付から初回訪問・報告までの全ステップをインタラクティブに確認できます。</p>
          <AcceptanceFlow />
        </section>
      )}

      {/* 役割分担（task-role-assignmentのみ） */}
      {taskId === 'task-role-assignment' && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-bold text-gray-900">👥 役割分担ツール</h2>
          <p className="mb-4 text-sm text-gray-600">在宅に必要な6つの役割を理解し、スタッフに割り当てましょう。</p>
          <RoleAssignment />
        </section>
      )}

      {/* クリーンベンチ操作ガイド（task-skill-cleanroomのみ） */}
      {taskId === 'task-skill-cleanroom' && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-bold text-gray-900">🧪 クリーンベンチ操作ガイド</h2>
          <p className="mb-4 text-sm text-gray-600">無菌調剤の手順、設備の種類、よくあるミスを網羅。動画の代わりにまず読んで理解しましょう。</p>
          <CleanroomGuide />
        </section>
      )}

      {/* 書類テンプレート（task-flowのみ） */}
      {taskId === 'task-flow' && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-bold text-gray-900">📄 書類テンプレート</h2>
          <p className="mb-4 text-sm text-gray-600">薬局情報が自動挿入済み。患者名・住所・印鑑のみで使えます。印刷またはPDF保存でダウンロード。</p>
          <DocumentTemplates />
        </section>
      )}

      {/* 初回受入フロー（task-flowのみ） */}
      {taskId === 'task-flow' && <AcceptanceFlow />}

      {/* アドバイス */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 font-bold text-gray-900">アドバイス</h2>
        <p className="text-sm text-gray-600">{task.review}</p>
      </section>

      {/* 次のアクション */}
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <h2 className="mb-2 font-bold text-gray-900">次のアクション</h2>
        <p className="text-sm text-gray-700">{task.nextAction}</p>
        <p className="mt-2 text-xs text-gray-500">完了の目安: {task.successMetric}</p>
      </section>

      {/* 関連教材 */}
      {learning && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 font-bold text-gray-900">関連教材</h2>
          <Link
            href={`/onboarding/learning/${learning.id}`}
            className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:border-blue-300"
          >
            <div className="flex items-center gap-3">
              <Pill tone="info">{learning.type}</Pill>
              <div>
                <p className="font-medium text-gray-900">{learning.title}</p>
                <p className="text-sm text-gray-500">{learning.duration}</p>
              </div>
            </div>
            <span className="text-sm text-blue-600">→</span>
          </Link>
        </section>
      )}

      {/* ナビゲーション */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/onboarding/tasks"
          className="rounded-full border border-gray-300 bg-white px-6 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          ← タスク一覧
        </Link>
        {learning?.downloadUrl && (
          <a
            href={learning.downloadUrl}
            download
            className="rounded-full bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700"
          >
            📥 テンプレートをダウンロード
          </a>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg justify-around py-2">
          <Link href="/onboarding" className="flex flex-col items-center px-3 py-1 text-gray-500">
            <span className="text-lg">🏠</span>
            <span className="text-xs font-medium">ホーム</span>
          </Link>
          <Link href="/onboarding/tasks" className="flex flex-col items-center px-3 py-1 text-blue-600">
            <span className="text-lg">✅</span>
            <span className="text-xs font-medium">タスク</span>
          </Link>
          <Link href="/onboarding/learning" className="flex flex-col items-center px-3 py-1 text-gray-500">
            <span className="text-lg">📚</span>
            <span className="text-xs font-medium">教材</span>
          </Link>
          <Link href="/onboarding/support" className="flex flex-col items-center px-3 py-1 text-gray-500">
            <span className="text-lg">💬</span>
            <span className="text-xs font-medium">相談</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
