import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { assertSupabaseEnv } from '@/lib/supabase/env'

export function createClient() {
  const cookieStore = cookies()
  const { url, anonKey } = assertSupabaseEnv()

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server Component — ignore
        }
      },
    },
  })
}
