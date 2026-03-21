'use client'

import Link from 'next/link'
import { learningItems } from '@/lib/onboarding'
import { Button } from '@/components/ui/button'
import { LearningCard, StepDigest } from '@/components/onboarding'

export default function LearningPage() {
  return (
    <div className="space-y-6">
      {/* ステップガイド */}
      <StepDigest
        currentStep={5}
        totalSteps={6}
        activeLabel="教材"
        activeLead="まず見る / まず作る / 次の会議まで"
        nextLabel="相談"
        nextLead="伴走依頼と困りごとの共有"
      />

      {/* メイン */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">いま必要な教材</h1>
        <p className="text-sm text-gray-600">
          一覧棚ではなく、使う順番が伝わるように並べています。
        </p>

        {/* フォーカス教材 */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-xs text-gray-500">まず見る教材</p>
            <p className="font-semibold text-gray-900">{learningItems[0].title}</p>
            <p className="mt-1 text-xs text-gray-600">
              {learningItems[0].description}
            </p>
            <Link href={`/onboarding/learning/${learningItems[0].id}`}>
              <Button className="mt-3" size="sm">
                動画を見る
              </Button>
            </Link>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">まず作る資料</p>
            <p className="font-semibold text-gray-900">{learningItems[1].title}</p>
            <p className="mt-1 text-xs text-gray-600">
              {learningItems[1].description}
            </p>
            <Link href={`/onboarding/learning/${learningItems[1].id}`}>
              <Button variant="outline" className="mt-3" size="sm">
                テンプレを見る
              </Button>
            </Link>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">次の会議までに使うもの</p>
            <p className="font-semibold text-gray-900">{learningItems[2].title}</p>
            <p className="mt-1 text-xs text-gray-600">
              {learningItems[2].description}
            </p>
            <Link href={`/onboarding/learning/${learningItems[2].id}`}>
              <Button variant="outline" className="mt-3" size="sm">
                資料を見る
              </Button>
            </Link>
          </div>
        </div>

        {/* 教材一覧 */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {learningItems.map((item) => (
            <LearningCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  )
}
