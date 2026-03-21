'use client'

export default function NightSupportPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">
          夜間接続の前提整理
        </h1>
        <p className="text-sm text-gray-600">
          夜間本体ではなく、必要になった時点で判断材料を確認するための画面です。
        </p>

        <div className="mt-6 space-y-4">
          <article className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900">
              この画面で確認すること
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li>• 夜間方針があるか</li>
              <li>• 昼間の受入体制が安定しているか</li>
              <li>• 接続判断に必要な責任者・連絡先がそろっているか</li>
            </ul>
          </article>

          <article className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h3 className="font-medium text-gray-900">
              この画面では扱わないこと
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li>• 夜間依頼受付</li>
              <li>• 患者照合・アサイン</li>
              <li>• シフト / 申し送り運用</li>
            </ul>
          </article>

          <article className="rounded-lg bg-blue-50 p-4">
            <p className="text-xs text-gray-500">次の案内</p>
            <h3 className="mt-1 font-semibold text-gray-900">
              昼間運用の整備が終わったら確認
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              夜間接続前チェックガイド / 責任者向け確認シート /
              接続判定ミーティングへ進みます。
            </p>
          </article>
        </div>
      </section>
    </div>
  )
}
