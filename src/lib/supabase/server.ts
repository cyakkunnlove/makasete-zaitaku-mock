import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { assertSupabaseEnv } from '@/lib/supabase/env'

export function createClient() {
  const { url, anonKey } = assertSupabaseEnv()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  return createSupabaseClient<Database>(url, serviceRoleKey || anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'X-Client-Info': serviceRoleKey ? 'makasete-server-service-role' : 'makasete-server-anon',
      },
    },
  })
}
