import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  if (user.role !== 'system_admin') {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const supabase = createServerSupabaseClient()
  const auditResponse = await supabase
    .from('audit_logs')
    .select('id, user_id, action, target_type, target_id, details, region_id, pharmacy_id, created_at')
    .eq('organization_id', user.organization_id)
    .order('created_at', { ascending: false })
    .limit(200)

  if (auditResponse.error) {
    return NextResponse.json({ ok: false, error: 'audit_logs_fetch_failed', details: auditResponse.error.message }, { status: 500 })
  }

  const logs = (auditResponse.data ?? []) as Array<{
    id: string
    user_id: string | null
    action: string
    target_type: string | null
    target_id: string | null
    details: Record<string, unknown> | null
    region_id: string | null
    pharmacy_id: string | null
    created_at: string
  }>
  const userIds = Array.from(new Set(logs.map((item) => item.user_id).filter((value): value is string => Boolean(value))))
  const regionIds = Array.from(new Set(logs.map((item) => item.region_id).filter((value): value is string => Boolean(value))))
  const pharmacyIds = Array.from(new Set(logs.map((item) => item.pharmacy_id).filter((value): value is string => Boolean(value))))

  const [usersResponse, regionsResponse, pharmaciesResponse] = await Promise.all([
    userIds.length
      ? supabase.from('users').select('id, full_name, role').in('id', userIds)
      : Promise.resolve({ data: [], error: null }),
    regionIds.length
      ? supabase.from('regions').select('id, name').in('id', regionIds)
      : Promise.resolve({ data: [], error: null }),
    pharmacyIds.length
      ? supabase.from('pharmacies').select('id, name').in('id', pharmacyIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (usersResponse.error || regionsResponse.error || pharmaciesResponse.error) {
    return NextResponse.json({ ok: false, error: 'audit_related_fetch_failed' }, { status: 500 })
  }

  const userRows = (usersResponse.data ?? []) as Array<{ id: string; full_name: string; role: string }>
  const regionRows = (regionsResponse.data ?? []) as Array<{ id: string; name: string }>
  const pharmacyRows = (pharmaciesResponse.data ?? []) as Array<{ id: string; name: string }>

  const userMap = new Map(userRows.map((item) => [item.id, item]))
  const regionMap = new Map(regionRows.map((item) => [item.id, item.name]))
  const pharmacyMap = new Map(pharmacyRows.map((item) => [item.id, item.name]))

  return NextResponse.json({
    ok: true,
    logs: logs.map((item) => {
      const actor = item.user_id ? userMap.get(item.user_id) : null
      return {
        id: item.id,
        timestamp: item.created_at,
        user: actor?.full_name ?? '不明',
        role: actor?.role ?? 'system_admin',
        action: item.action,
        target: item.target_id ?? item.target_type ?? '対象なし',
        targetType: item.target_type ?? null,
        result: item.action === 'account_invitation_revoked' ? 'warning' : 'success',
        scopeType: item.pharmacy_id ? 'pharmacy' : item.region_id ? 'region' : 'system',
        scopeLabel: item.pharmacy_id
          ? `薬局 / ${pharmacyMap.get(item.pharmacy_id) ?? item.pharmacy_id}`
          : item.region_id
            ? `リージョン / ${regionMap.get(item.region_id) ?? item.region_id}`
            : 'platform',
        details: item.details ?? null,
      }
    }),
  })
}
