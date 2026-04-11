import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { assertSupabaseEnv } from '@/lib/supabase/env'

export function createAdminClient() {
  const { url } = assertSupabaseEnv()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing.')
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
