import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getCurrentActorRole, getCurrentScope } from '@/lib/active-role'
import { ensureRecentReverification } from '@/lib/api-reauth'
import { writeAuditLog } from '@/lib/audit-log'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

function toPharmacyView(row: Record<string, unknown>, extras?: { patientCount?: number; pharmacyAdminStatus?: string }) {
  return {
    id: String(row.id),
    name: typeof row.name === 'string' ? row.name : '',
    area: typeof row.area === 'string' ? row.area : '',
    address: typeof row.address === 'string' ? row.address : '',
    phone: typeof row.phone === 'string' ? row.phone : '',
    fax: typeof row.fax === 'string' ? row.fax : '',
    forwardingPhone: typeof row.forwarding_phone === 'string' ? row.forwarding_phone : '',
    patientCount: extras?.patientCount ?? (typeof row.patient_count === 'number' ? row.patient_count : 0),
    status: typeof row.status === 'string' ? row.status : 'pending',
    contractDate: typeof row.contract_date === 'string' ? row.contract_date : '',
    saasFee: typeof row.saas_monthly_fee === 'number' ? row.saas_monthly_fee : Number(row.saas_monthly_fee ?? 0),
    nightFee: typeof row.night_monthly_fee === 'number' ? row.night_monthly_fee : Number(row.night_monthly_fee ?? 0),
    forwarding: row.forwarding_status === 'on',
    forwardingStatus: row.forwarding_status === 'on' ? 'on' : 'off',
    regionId: typeof row.region_id === 'string' ? row.region_id : null,
    regionName: typeof (row.region as { name?: unknown } | null)?.name === 'string' ? (row.region as { name: string }).name : null,
    pharmacyAdminStatus: extras?.pharmacyAdminStatus ?? 'uninvited',
  }
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const actorRole = getCurrentActorRole(user)
  const actorScope = getCurrentScope(user)
  if (!['regional_admin', 'pharmacy_admin', 'system_admin'].includes(actorRole ?? '')) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const supabase = createServerSupabaseClient()
  const response = await supabase
    .from('pharmacies')
    .select('id, name, area, address, phone, fax, forwarding_phone, patient_count, status, contract_date, saas_monthly_fee, night_monthly_fee, forwarding_status, region_id, region:regions(name)')
    .eq('organization_id', user.organization_id)
    .eq('id', params.id)
    .maybeSingle()

  if (response.error) {
    return NextResponse.json({ ok: false, error: 'pharmacy_fetch_failed', details: response.error.message }, { status: 500 })
  }
  const pharmacy = response.data as Record<string, unknown> | null
  if (!pharmacy) {
    return NextResponse.json({ ok: false, error: 'pharmacy_not_found' }, { status: 404 })
  }
  if (actorRole === 'regional_admin' && actorScope.regionId && pharmacy.region_id !== actorScope.regionId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }
  if (actorRole === 'pharmacy_admin' && actorScope.pharmacyId && String(pharmacy.id) !== actorScope.pharmacyId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const patientResponse = await supabase
    .from('patients')
    .select('id')
    .eq('pharmacy_id', params.id)
    .eq('status', 'active')

  const invitationResponse = await supabase
    .from('account_invitations')
    .select('status, created_at')
    .eq('pharmacy_id', params.id)
    .eq('role', 'pharmacy_admin')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const userResponse = await supabase
    .from('users')
    .select('status')
    .eq('pharmacy_id', params.id)
    .eq('role', 'pharmacy_admin')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const patientCount = patientResponse.error ? 0 : (patientResponse.data ?? []).length
  let pharmacyAdminStatus = 'uninvited'
  if (invitationResponse.data && (invitationResponse.data as Record<string, unknown>).status === 'pending') pharmacyAdminStatus = 'invited'
  if (userResponse.data && (userResponse.data as Record<string, unknown>).status === 'active') pharmacyAdminStatus = 'active'
  else if (userResponse.data && (userResponse.data as Record<string, unknown>).status === 'invited') pharmacyAdminStatus = 'invited'

  return NextResponse.json({ ok: true, pharmacy: toPharmacyView(pharmacy, { patientCount, pharmacyAdminStatus }) })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const actorRole = getCurrentActorRole(user)
  const actorScope = getCurrentScope(user)
  if (actorRole !== 'regional_admin' || !actorScope.regionId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const reauthResponse = await ensureRecentReverification(user, {
    reason: 'pharmacy_update',
    nextPath: `/dashboard/pharmacies/${params.id}`,
  })
  if (reauthResponse) return reauthResponse

  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })

  const supabase = createServerSupabaseClient()
  const currentResponse = await supabase
    .from('pharmacies')
    .select('id, region_id, name, address, phone, fax, forwarding_phone')
    .eq('organization_id', user.organization_id)
    .eq('id', params.id)
    .maybeSingle()

  if (currentResponse.error) {
    return NextResponse.json({ ok: false, error: 'pharmacy_fetch_failed', details: currentResponse.error.message }, { status: 500 })
  }
  const current = currentResponse.data as Record<string, unknown> | null
  if (!current) return NextResponse.json({ ok: false, error: 'pharmacy_not_found' }, { status: 404 })
  if (current.region_id !== actorScope.regionId) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })

  const name = typeof body.name === 'string' ? body.name.trim() : String(current.name ?? '')
  const address = typeof body.address === 'string' ? body.address.trim() : String(current.address ?? '')
  const phone = typeof body.phone === 'string' ? body.phone.trim() : String(current.phone ?? '')
  const fax = typeof body.fax === 'string' ? body.fax.trim() : ((current.fax as string | null) ?? '')
  const forwardingPhone = typeof body.forwardingPhone === 'string' ? body.forwardingPhone.trim() : ((current.forwarding_phone as string | null) ?? '')

  if (!name || !address || !phone) {
    return NextResponse.json({ ok: false, error: 'required_fields_missing' }, { status: 400 })
  }

  const updateResponse = await supabase
    .from('pharmacies')
    .update({ name, address, phone, fax: fax || null, forwarding_phone: forwardingPhone || null, updated_at: new Date().toISOString() } as never)
    .eq('id', params.id)
    .select('id, name, area, address, phone, fax, forwarding_phone, patient_count, status, contract_date, saas_monthly_fee, night_monthly_fee, forwarding_status, region_id, region:regions(name)')
    .single()

  const updated = updateResponse.data as Record<string, unknown> | null
  if (updateResponse.error || !updated) {
    return NextResponse.json({ ok: false, error: 'pharmacy_update_failed', details: updateResponse.error?.message ?? null }, { status: 500 })
  }

  await writeAuditLog({
    user,
    action: 'pharmacy_updated',
    targetType: 'pharmacy',
    targetId: params.id,
    details: { actor_role: actorRole, target_name: name },
  })

  return NextResponse.json({ ok: true, pharmacy: toPharmacyView(updated) })
}
