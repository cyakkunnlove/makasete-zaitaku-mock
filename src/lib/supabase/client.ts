import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { assertSupabaseEnv } from '@/lib/supabase/env'

export function createClient() {
  const { url, anonKey } = assertSupabaseEnv()

  return createBrowserClient<Database>(url, anonKey)
}
