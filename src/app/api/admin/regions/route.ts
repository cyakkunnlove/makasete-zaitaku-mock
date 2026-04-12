import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getCurrentActorRole } from '@/lib/active-role'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  if (getCurrentActorRole(user) !== 'system_admin') {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('regions')
    .select('id, name, organization_id')
    .eq('organization_id', user.organization_id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ ok: false, error: 'regions_fetch_failed', details: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, regions: data ?? [] })
}
