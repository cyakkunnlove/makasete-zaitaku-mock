import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getCurrentActorRole } from '@/lib/active-role'
import { ensureRecentReverification } from '@/lib/api-reauth'
import { writeAuditLog } from '@/lib/audit-log'
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

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  if (getCurrentActorRole(user) !== 'system_admin') {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const reauthResponse = await ensureRecentReverification(user, {
    reason: 'region_create',
    nextPath: '/dashboard/staff',
  })
  if (reauthResponse) return reauthResponse

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })
  }

  const name = typeof (body as Record<string, unknown>).name === 'string' ? (body as Record<string, string>).name.trim() : ''
  if (!name) {
    return NextResponse.json({ ok: false, error: 'name_required' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const existing = await supabase
    .from('regions')
    .select('id')
    .eq('organization_id', user.organization_id)
    .eq('name', name)
    .maybeSingle()

  if (existing.error) {
    return NextResponse.json({ ok: false, error: 'region_lookup_failed', details: existing.error.message }, { status: 500 })
  }
  if (existing.data) {
    return NextResponse.json({ ok: false, error: 'region_name_already_exists' }, { status: 409 })
  }

  const now = new Date().toISOString()
  const code = `region-${Date.now()}`
  const createdResponse = await supabase
    .from('regions')
    .insert({
      organization_id: user.organization_id,
      code,
      name,
      status: 'active',
      created_at: now,
      updated_at: now,
    } as never)
    .select('id, name, organization_id')
    .single()

  const createdRegion = createdResponse.data as { id: string; name: string; organization_id: string } | null
  if (createdResponse.error || !createdRegion) {
    return NextResponse.json({ ok: false, error: 'region_create_failed', details: createdResponse.error?.message ?? null }, { status: 500 })
  }

  await writeAuditLog({
    user,
    action: 'region_created',
    targetType: 'region',
    targetId: createdRegion.id,
    details: {
      actor_role: 'system_admin',
      region_name: createdRegion.name,
    },
  })

  return NextResponse.json({ ok: true, region: createdRegion })
}
