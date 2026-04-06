'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, UserRole } from '@/types/database'
import type { AuthMode } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  role: UserRole | null
  loading: boolean
  isDemo: boolean
  authMode: AuthMode | null
  signOut: () => Promise<void>
  switchRole: (role: string) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  isDemo: true,
  authMode: null,
  signOut: async () => {},
  switchRole: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
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
        signOut,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
