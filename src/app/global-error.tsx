'use client'

import { useEffect } from 'react'
import { RouteErrorView } from '@/components/recovery/route-error-view'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="ja">
      <body>
        <RouteErrorView reset={reset} title="アプリの復旧が必要です" />
      </body>
    </html>
  )
}
