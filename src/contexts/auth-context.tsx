'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { UserRole } from '@/types/database'
import type { AuthMode, CurrentUser } from '@/lib/auth'
import type { MockRoleContextView } from '@/lib/mock-role-contexts'

interface AuthContextType {
  user: CurrentUser | null
  role: UserRole | null
  loading: boolean
  isDemo: boolean
  authMode: AuthMode | null
  requiresReverification: boolean
  activeRoleContext: MockRoleContextView | null
  signOut: () => Promise<void>
  switchRole: (role: string) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  isDemo: true,
  authMode: null,
  requiresReverification: false,
  activeRoleContext: null,
  signOut: async () => {},
  switchRole: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)

  useEffect(() => {
    async function getUser() {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' })
        const data = await response.json()
        setUser(data.user ?? null)
        setAuthMode(data.authMode ?? null)
      } catch (error) {
        console.error('Error fetching user:', error)
        setUser(null)
        setAuthMode(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [])

  const signOut = async () => {
    window.location.href = '/api/auth/logout'
    setUser(null)
    setAuthMode(null)
  }

  const switchRole = (roleKey: string) => {
    if (authMode !== 'mock') return
    window.location.href = `/api/demo-login?role=${roleKey}`
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        loading,
        isDemo: authMode === 'mock',
        authMode,
        requiresReverification: Boolean(user?.requiresReverification),
        activeRoleContext: user?.activeRoleContext ?? null,
        signOut,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
