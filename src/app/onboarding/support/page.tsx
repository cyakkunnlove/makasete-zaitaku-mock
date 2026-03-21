'use client'

import Link from 'next/link'
import { supportItems } from '@/lib/onboarding'
import { Button } from '@/components/ui/button'
import { SupportCard, StepDigest } from '@/components/onboarding'

export default function SupportPage() {
  return (
    <div className="space-y-6">
      {/* ステップガイド */}
      <StepDigest
        currentStep={6}
        totalSteps={6}
        activeLabel="相談"
        activeLead="伴走依頼と困りごとの共有"
        nextLabel="完了"
        nextLead="必要なタイミングで次に進む"
      />

      {/* メイン */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">相談・伴走</h1>
        <p className="text-sm text-gray-600">
          この薬局の作業を進める中で、そのまま相談できる導線です。
        </p>

        {/* サポートカード */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {supportItems.map((item) => (
            <SupportCard key={item.id} item={item} />
          ))}
        </div>

        {/* 相談時のヒント */}
        <div className="mt-6 rounded-lg border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900">
            相談時に送ると進みやすい内容
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            <li>• 今つくっている資料名</li>
            <li>• どこで迷っているか 1〜2点</li>
            <li>• 次回会議までに決めたいこと</li>
          </ul>
        </div>

        {/* CTA */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/onboarding/tasks/task-comment">
            <Button>コメント依頼タスクを見る</Button>
          </Link>
          <Link href="/onboarding/learning/learning-template">
            <Button variant="outline">添削前のテンプレを見る</Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
