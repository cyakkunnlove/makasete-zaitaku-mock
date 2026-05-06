'use client'

import { useEffect } from 'react'
import { RouteErrorView } from '@/components/recovery/route-error-view'

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <RouteErrorView
      reset={reset}
      title="業務画面の表示に失敗しました"
      description="保存済みデータは保持されています。もう一度表示するか、再読み込みして最新状態を取得してください。"
    />
  )
}
