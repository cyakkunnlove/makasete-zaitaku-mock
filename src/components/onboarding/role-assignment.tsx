'use client'

import { useState } from 'react'

// ========================================
// 在宅における役割定義
// ========================================

interface RoleDefinition {
  id: string
  role: string
  icon: string
  description: string
  responsibilities: string[]
  requiredSkills: string[]
  frequency: string
}

const ROLES: RoleDefinition[] = [
  {
    id: 'r1', role: '在宅責任者（管理薬剤師）', icon: '👑',
    description: '在宅業務全体の統括。体制の構築・維持、スタッフ育成、医師・ケアマネとの窓口。',
    responsibilities: [
      '在宅訪問薬剤管理指導の届出・施設基準の管理',
      '薬学的管理指導計画書の作成・見直し',
      '処方医・ケアマネとの連絡調整（主たる窓口）',
      '新規患者の受入判断',
      '在宅スタッフの教育・シフト管理',
      '麻薬管理（金庫管理、廃棄立会い等）',
      '加算の算定管理・レセプト確認',
    ],
    requiredSkills: ['在宅の算定要件・保険制度の理解', '多職種連携のコミュニケーション', 'スタッフマネジメント'],
    frequency: '常時（在宅の中心的存在）',
  },
  {
    id: 'r2', role: '訪問担当薬剤師（メイン）', icon: '🏠',
    description: '実際に患者宅を訪問し、薬学的管理指導を実施する。在宅業務の最前線。',
    responsibilities: [
      '患者宅への訪問・薬学的管理指導の実施',
      '服薬状況・副作用・残薬の確認',
      'バイタルチェック（血圧、SpO2等）',
      '処方医への報告書（トレーシングレポート）の作成',
      'ケアマネへの情報提供',
      '薬歴（SOAP）の記載',
      '患者・家族への説明と相談対応',
    ],
    requiredSkills: ['フィジカルアセスメントの基礎', 'コミュニケーション力', 'SOAP記録'],
    frequency: '週2〜5日（訪問日）',
  },
  {
    id: 'r3', role: '訪問担当薬剤師（サブ）', icon: '🔄',
    description: 'メイン担当の休暇・不在時に訪問を代行。メインと情報共有を密に行う。',
    responsibilities: [
      'メイン担当不在時の訪問代行',
      '患者情報の共有・引き継ぎの受け取り',
      '緊急訪問時の対応（当番制）',
      'メイン担当と定期的な情報共有（週1回程度）',
    ],
    requiredSkills: ['メイン担当と同等の訪問スキル', '柔軟なスケジュール対応'],
    frequency: 'メイン不在時＋緊急時',
  },
  {
    id: 'r4', role: '調剤・無菌調製担当', icon: '🧪',
    description: '在宅患者の処方調剤、特にTPN・麻薬注射剤の無菌調製を担当。',
    responsibilities: [
      '在宅患者の処方調剤（一包化、粉砕、簡易懸濁法対応等）',
      '無菌製剤処理（クリーンベンチでのTPN調製、麻薬注射剤の充填）',
      'PCAポンプのカセット・シリンジへの薬液充填',
      '医療材料・衛生材料の在庫管理と発注',
      '配合変化のチェック',
    ],
    requiredSkills: ['無菌操作技術', '注射薬の配合変化の知識', '医療材料の知識'],
    frequency: '訪問日の前日〜当日（調剤タイミング）',
  },
  {
    id: 'r5', role: '事務担当', icon: '📋',
    description: '契約書類の管理、レセプト請求、スケジュール管理を担当。',
    responsibilities: [
      '居宅療養管理指導の契約書・重要事項説明書の準備',
      '介護保険のレセプト（介護給付費明細書）の作成・国保連への請求',
      '医療保険のレセプト（在宅部分）の確認',
      '訪問スケジュールの管理・調整',
      '処方箋のFAX受信・原本管理',
      '医療材料の発注・在庫管理（薬剤師と連携）',
    ],
    requiredSkills: ['介護保険の請求事務', 'スケジュール管理', '書類管理'],
    frequency: '毎日（事務作業は日常的）',
  },
  {
    id: 'r6', role: '緊急対応担当（当番制）', icon: '🚨',
    description: '24時間対応体制の当番。夜間・休日の電話対応、必要に応じて緊急訪問。',
    responsibilities: [
      '携帯電話での夜間・休日の電話対応',
      '緊急性の判断（電話で対応可 or 訪問必要 or 119番）',
      '必要に応じた緊急訪問',
      '対応内容の記録・翌営業日の引き継ぎ',
    ],
    requiredSkills: ['緊急度の判断力', '冷静な対応', '処方医・訪看との連絡体制の把握'],
    frequency: '当番日（週1〜2回程度、ローテーション）',
  },
]

// ========================================
// スタッフ入力＆割り当てビルダー
// ========================================

interface StaffMember {
  id: string
  name: string
  position: string
  assignedRoles: string[]
}

let staffCounter = 0

function newStaff(): StaffMember {
  staffCounter++
  return { id: `staff-${staffCounter}`, name: '', position: '薬剤師', assignedRoles: [] }
}

// ========================================
// メインコンポーネント
// ========================================

export function RoleAssignment() {
  const [activeTab, setActiveTab] = useState<'roles' | 'builder' | 'tips'>('roles')
  const [staff, setStaff] = useState<StaffMember[]>([
    { id: 'staff-0', name: '', position: '管理薬剤師', assignedRoles: ['r1'] },
  ])
  const [expandedRole, setExpandedRole] = useState<string | null>('r1')

  const addStaff = () => setStaff([...staff, newStaff()])
  const removeStaff = (id: string) => setStaff(staff.filter(s => s.id !== id))
  const updateStaff = (id: string, patch: Partial<StaffMember>) => {
    setStaff(staff.map(s => s.id === id ? { ...s, ...patch } : s))
  }
  const toggleRole = (staffId: string, roleId: string) => {
    setStaff(staff.map(s => {
      if (s.id !== staffId) return s
      const roles = s.assignedRoles.includes(roleId)
        ? s.assignedRoles.filter(r => r !== roleId)
        : [...s.assignedRoles, roleId]
      return { ...s, assignedRoles: roles }
    }))
  }

  // 未割当の役割チェック
  const allAssignedRoles = new Set(staff.flatMap(s => s.assignedRoles))
  const unassignedRoles = ROLES.filter(r => !allAssignedRoles.has(r.id))

  return (
    <div className="space-y-6">
      {/* タブ */}
      <div className="flex gap-2">
        {[
          { key: 'roles', label: '📋 役割の解説' },
          { key: 'builder', label: '🛠️ 役割分担表を作る' },
          { key: 'tips', label: '💡 運用のコツ' },
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

      {/* 役割の解説 */}
      {activeTab === 'roles' && (
        <div className="space-y-3">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-lg font-bold text-gray-900">在宅業務に必要な6つの役割</h3>
            <p className="mb-4 text-sm text-gray-500">全てを別々の人が担当する必要はありません。薬剤師2〜3人＋事務1人で回せます。</p>
          </section>

          {ROLES.map(role => {
            const isExpanded = expandedRole === role.id
            return (
              <div key={role.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <button onClick={() => setExpandedRole(isExpanded ? null : role.id)} className="w-full p-4 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{role.icon}</span>
                      <div>
                        <p className="font-semibold text-gray-900">{role.role}</p>
                        <p className="text-xs text-gray-500">{role.frequency}</p>
                      </div>
                    </div>
                    <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
                    <p className="text-sm text-gray-700">{role.description}</p>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">✅ 主な業務</p>
                      <ul className="space-y-1">
                        {role.responsibilities.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-blue-400 shrink-0">•</span>{r}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">🎓 必要なスキル</p>
                      <div className="flex flex-wrap gap-1">
                        {role.requiredSkills.map(s => (
                          <span key={s} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 役割分担表ビルダー */}
      {activeTab === 'builder' && (
        <div className="space-y-4">
          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
            <h3 className="mb-1 text-lg font-bold text-gray-900">🛠️ うちの薬局の役割分担表</h3>
            <p className="mb-4 text-sm text-gray-500">スタッフを追加し、各役割を割り当ててください。印刷してそのまま使えます。</p>

            {/* スタッフ入力 */}
            {staff.map(s => (
              <div key={s.id} className="mb-3 rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="氏名"
                    value={s.name}
                    onChange={(e) => updateStaff(s.id, { name: e.target.value })}
                    className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm"
                  />
                  <select
                    value={s.position}
                    onChange={(e) => updateStaff(s.id, { position: e.target.value })}
                    className="rounded border border-gray-300 px-2 py-1.5 text-sm"
                  >
                    <option>管理薬剤師</option>
                    <option>薬剤師</option>
                    <option>事務</option>
                    <option>パート薬剤師</option>
                  </select>
                  {staff.length > 1 && (
                    <button onClick={() => removeStaff(s.id)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map(role => (
                    <button
                      key={role.id}
                      onClick={() => toggleRole(s.id, role.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        s.assignedRoles.includes(role.id)
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {role.icon} {role.role.replace(/（.*）/, '')}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button onClick={addStaff} className="rounded-full bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300">
              ＋ スタッフを追加
            </button>
          </section>

          {/* 未割当チェック */}
          {unassignedRoles.length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-800">⚠️ まだ割り当てられていない役割があります:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {unassignedRoles.map(r => (
                  <span key={r.id} className="rounded-full bg-amber-200 px-3 py-1 text-xs font-medium text-amber-800">{r.icon} {r.role}</span>
                ))}
              </div>
            </div>
          )}

          {unassignedRoles.length === 0 && (
            <div className="rounded-xl border border-green-300 bg-green-50 p-4">
              <p className="text-sm font-semibold text-green-800">✅ 全ての役割が割り当てられています！</p>
            </div>
          )}

          {/* プレビュー（印刷用） */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm print-area">
            <h3 className="mb-4 font-bold text-gray-900">📊 役割分担表（プレビュー）</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-400">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 px-3 py-2 text-left">スタッフ</th>
                    <th className="border border-gray-400 px-3 py-2 text-left">職種</th>
                    <th className="border border-gray-400 px-3 py-2 text-left">担当役割</th>
                    <th className="border border-gray-400 px-3 py-2 text-left">主な業務</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map(s => {
                    const assignedRoleData = ROLES.filter(r => s.assignedRoles.includes(r.id))
                    return (
                      <tr key={s.id} className="border-b border-gray-300">
                        <td className="border border-gray-400 px-3 py-2 font-medium">{s.name || '（未入力）'}</td>
                        <td className="border border-gray-400 px-3 py-2">{s.position}</td>
                        <td className="border border-gray-400 px-3 py-2">
                          {assignedRoleData.map(r => (
                            <span key={r.id} className="mr-1 inline-block">{r.icon} {r.role.replace(/（.*）/, '')}</span>
                          ))}
                        </td>
                        <td className="border border-gray-400 px-3 py-2 text-xs text-gray-600">
                          {assignedRoleData.flatMap(r => r.responsibilities.slice(0, 2)).join(' / ')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-2 no-print">
              <button onClick={() => window.print()} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                🖨️ 印刷 / PDF保存
              </button>
            </div>
          </section>
        </div>
      )}

      {/* 運用のコツ */}
      {activeTab === 'tips' && (
        <div className="space-y-6">
          {/* 薬局規模別モデル */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-gray-900">🏪 薬局規模別の体制モデル</h3>
            <div className="space-y-4">
              {[
                {
                  size: '薬剤師1〜2人の薬局', color: 'border-blue-300 bg-blue-50',
                  model: '管理薬剤師が在宅責任者＋訪問担当＋調剤を兼任。事務は既存スタッフが兼務。',
                  staff: [
                    '管理薬剤師: 在宅責任者＋訪問メイン＋無菌調製＋緊急対応',
                    '薬剤師/パート: 訪問サブ＋外来調剤（在宅訪問中の店番）',
                    '事務: 契約書類＋レセプト＋スケジュール管理',
                  ],
                  note: '在宅患者5人以下なら十分回せる。パート薬剤師に外来を任せて訪問に出る形。',
                },
                {
                  size: '薬剤師3〜4人の薬局', color: 'border-green-300 bg-green-50',
                  model: '訪問メイン＋サブを分けられる。無菌調製担当も別にできる。',
                  staff: [
                    '管理薬剤師: 在宅責任者＋医師/ケアマネ窓口',
                    '薬剤師A: 訪問メイン＋報告書作成',
                    '薬剤師B: 訪問サブ＋無菌調製',
                    '事務: 書類＋レセプト＋スケジュール',
                  ],
                  note: '在宅患者10〜20人に対応可能。緊急対応は薬剤師のローテーション。',
                },
                {
                  size: '薬剤師5人以上の薬局', color: 'border-purple-300 bg-purple-50',
                  model: '在宅専任チームが組める。複数エリアの訪問も可能。',
                  staff: [
                    '管理薬剤師: 在宅責任者＋統括',
                    '薬剤師A/B: 訪問メイン（エリア分担）',
                    '薬剤師C: 訪問サブ＋緊急対応',
                    '薬剤師D: 無菌調製専任',
                    '事務: 専任事務',
                  ],
                  note: '在宅患者30人以上に対応可能。在宅薬学総合体制加算2の取得も視野に。',
                },
              ].map((model, i) => (
                <div key={i} className={`rounded-xl border p-4 ${model.color}`}>
                  <h4 className="font-bold text-gray-900">{model.size}</h4>
                  <p className="mt-1 text-sm text-gray-600">{model.model}</p>
                  <ul className="mt-2 space-y-1">
                    {model.staff.map((s, j) => (
                      <li key={j} className="text-sm text-gray-700">• {s}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-gray-500">💡 {model.note}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 不在時の対応 */}
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <h3 className="mb-3 font-bold text-amber-800">🔄 「誰が休みでも止まらない」ための3原則</h3>
            <div className="space-y-3">
              {[
                { title: '患者情報は共有フォルダ/薬歴で共有', detail: '訪問担当しか知らない情報があると、不在時に対応できない。薬歴（SOAP）に全て記録し、誰でも見られる状態に。' },
                { title: 'メイン＋サブの2人体制', detail: '各患者に「メイン担当」と「サブ担当」を決める。メインが不在ならサブが訪問。月1回はサブも訪問しておくと引き継ぎがスムーズ。' },
                { title: '緊急連絡先リストを全員が持つ', detail: '処方医の連絡先、訪問看護ステーション、ケアマネの連絡先をリスト化。当番でなくても見られるように。' },
              ].map((item, i) => (
                <div key={i} className="rounded-lg border border-amber-200 bg-white p-4">
                  <p className="font-semibold text-gray-900">{i + 1}. {item.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
