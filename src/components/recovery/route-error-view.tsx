'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type RouteErrorViewProps = {
  reset?: () => void
  title?: string
  description?: string
}

export function RouteErrorView({
  reset,
  title = '画面の表示に失敗しました',
  description = '一時的な通信エラー、またはアプリ更新の影響で表示できない可能性があります。',
}: RouteErrorViewProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-rose-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="text-base font-semibold text-slate-950">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {reset ? (
            <Button onClick={reset} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              もう一度表示
            </Button>
          ) : null}
          <Button variant={reset ? 'outline' : 'default'} onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            再読み込み
          </Button>
        </div>
      </section>
    </main>
  )
}
