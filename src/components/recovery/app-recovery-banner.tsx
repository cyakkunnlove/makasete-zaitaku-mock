'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type RecoveryState = 'offline' | 'update-needed' | null

function isAssetLoadError(reason: unknown) {
  const message = reason instanceof Error ? reason.message : String(reason ?? '')
  return /ChunkLoadError|Loading chunk|dynamically imported module|module script|failed to fetch/i.test(message)
}

export function AppRecoveryBanner() {
  const [state, setState] = useState<RecoveryState>(null)

  useEffect(() => {
    const syncOnlineState = () => setState(navigator.onLine ? null : 'offline')
    const handleWindowError = (event: ErrorEvent) => {
      if (isAssetLoadError(event.error) || isAssetLoadError(event.message)) {
        setState('update-needed')
      }
    }
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isAssetLoadError(event.reason)) setState('update-needed')
    }

    syncOnlineState()
    window.addEventListener('online', syncOnlineState)
    window.addEventListener('offline', syncOnlineState)
    window.addEventListener('error', handleWindowError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('online', syncOnlineState)
      window.removeEventListener('offline', syncOnlineState)
      window.removeEventListener('error', handleWindowError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  if (!state) return null

  const isOffline = state === 'offline'

  return (
    <div
      className={cn(
        'fixed inset-x-3 bottom-3 z-[80] mx-auto flex max-w-xl items-center gap-3 rounded-lg border px-3 py-2 text-sm shadow-lg',
        isOffline
          ? 'border-amber-200 bg-amber-50 text-amber-900'
          : 'border-sky-200 bg-sky-50 text-sky-900',
      )}
      role="status"
      aria-live="polite"
    >
      {isOffline ? <WifiOff className="h-4 w-4 shrink-0" /> : <RefreshCw className="h-4 w-4 shrink-0" />}
      <p className="min-w-0 flex-1">
        {isOffline
          ? '通信が切れています。接続が戻ったら自動で再取得できます。'
          : 'アプリ更新が必要です。再読み込みすると最新状態で復旧します。'}
      </p>
      <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
        再読み込み
      </Button>
    </div>
  )
}
