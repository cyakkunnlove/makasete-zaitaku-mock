import { hasSupabaseEnv } from '@/lib/supabase/env'

export function getRepositoryMode() {
  return {
    provider: hasSupabaseEnv() ? 'supabase' : 'mock',
  } as const
}
