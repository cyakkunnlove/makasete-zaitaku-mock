import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getCurrentActorRole, getCurrentScope } from '@/lib/active-role'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(_: Request, { params }: { params: { regionId: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const actorRole = getCurrentActorRole(user)
  const actorScope = getCurrentScope(user)
  const regionId = params.regionId

  if (actorRole === 'regional_admin' && actorScope.regionId !== regionId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }
  if (actorRole === 'pharmacy_admin' && actorScope.regionId !== regionId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }
  if (!['system_admin', 'regional_admin', 'pharmacy_admin'].includes(actorRole ?? '')) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const supabase = createServerSupabaseClient()
  const response = await supabase
    .from('pharmacies')
    .select('id, name, region_id, organization_id')
    .eq('organization_id', user.organization_id)
    .eq('region_id', regionId)
    .order('name', { ascending: true })

  if (response.error) {
    return NextResponse.json({ ok: false, error: 'pharmacies_fetch_failed', details: response.error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, pharmacies: response.data ?? [] })
}
