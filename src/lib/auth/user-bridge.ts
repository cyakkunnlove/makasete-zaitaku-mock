import type { User } from '@/types/database'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { hasSupabaseEnv } from '@/lib/supabase/env'

type BridgeLookupInput = {
  cognitoSub?: string | null
  email?: string | null
}

export type BridgeLookupResult = {
  user: User | null
  matchedBy: 'cognito_sub' | 'email' | null
}

export async function findAppUserByIdentity(input: BridgeLookupInput): Promise<BridgeLookupResult> {
  if (!hasSupabaseEnv()) {
    return { user: null, matchedBy: null }
  }

  const supabase = createServerSupabaseClient()

  if (input.cognitoSub) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('cognito_sub', input.cognitoSub)
      .maybeSingle()

    if (error) throw error
    if (data) return { user: data, matchedBy: 'cognito_sub' }
  }

  if (input.email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', input.email)
      .maybeSingle()

    if (error) throw error
    if (data) return { user: data, matchedBy: 'email' }
  }

  return { user: null, matchedBy: null }
}

export async function attachCognitoSubToUser(userId: string, cognitoSub: string) {
  if (!hasSupabaseEnv()) return

  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('users')
    .update({ cognito_sub: cognitoSub, last_login_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw error
}

export async function touchLastLogin(userId: string) {
  if (!hasSupabaseEnv()) return

  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw error
}
