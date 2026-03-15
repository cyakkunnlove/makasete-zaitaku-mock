'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, UserRole } from '@/types/database'
import { MOCK_USERS, DEMO_ROLE } from '@/lib/mock-data'

interface AuthContextType {
  user: User | null
  role: UserRole | null
  loading: boolean
  isDemo: boolean
  signOut: () => Promise<void>
  switchRole: (role: string) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  isDemo: true,
  signOut: async () => {},
  switchRole: () => {},
})

const IS_DEMO = true

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (IS_DEMO) {
      // Demo mode: use mock user
      setUser(MOCK_USERS[DEMO_ROLE] ?? MOCK_USERS.admin)
      setLoading(false)
      return
    }

    // Production: use Supabase auth
    async function getUser() {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single()
          setUser(data)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [])

  const signOut = async () => {
    if (!IS_DEMO) {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.auth.signOut()
    }
    setUser(null)
  }

  const switchRole = (roleKey: string) => {
    if (IS_DEMO && MOCK_USERS[roleKey]) {
      setUser(MOCK_USERS[roleKey])
    }
  }

  return (
    <AuthContext.Provider value={{ user, role: user?.role ?? null, loading, isDemo: IS_DEMO, signOut, switchRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
