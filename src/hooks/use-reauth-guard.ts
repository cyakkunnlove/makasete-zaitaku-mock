'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

export function useReauthGuard() {
  const router = useRouter()
  const pathname = usePathname()
  const { authMode, requiresReverification } = useAuth()

  const guard = (options?: { nextPath?: string }) => {
    if (authMode !== 'cognito' || !requiresReverification) {
      return false
    }

    const nextPath = options?.nextPath ?? pathname
    router.push(`/dashboard/account-security?reauth=required&next=${encodeURIComponent(nextPath)}`)
    return true
  }

  return {
    requiresReverification: authMode === 'cognito' && requiresReverification,
    guard,
  }
}
