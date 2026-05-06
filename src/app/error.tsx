'use client'

import { useEffect } from 'react'
import { RouteErrorView } from '@/components/recovery/route-error-view'

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return <RouteErrorView reset={reset} />
}
