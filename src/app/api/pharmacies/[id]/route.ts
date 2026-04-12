import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getCurrentActorRole, getCurrentScope } from '@/lib/active-role'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

function toPharmacyView(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: typeof row.name === 'string' ? row.name : '',
    area: typeof row.area === 'string' ? row.area : '',
    address: typeof row.address === 'string' ? row.address : '',
    phone: typeof row.phone === 'string' ? row.phone : '',
    fax: typeof row.fax === 'string' ? row.fax : '',
    forwardingPhone: typeof row.forwarding_phone === 'string' ? row.forwarding_phone : '',
    patientCount: typeof row.patient_count === 'number' ? row.patient_count : 0,
    status: typeof row.status === 'string' ? row.status : 'pending',
    contractDate: typeof row.contract_date === 'string' ? row.contract_date : '',
    saasFee: typeof row.saas_monthly_fee === 'number' ? row.saas_monthly_fee : Number(row.saas_monthly_fee ?? 0),
    nightFee: typeof row.night_monthly_fee === 'number' ? row.night_monthly_fee : Number(row.night_monthly_fee ?? 0),
    forwarding: row.forwarding_status === 'on',
    forwardingStatus: row.forwarding_status === 'on' ? 'on' : 'off',
    regionId: typeof row.region_id === 'string' ? row.region_id : null,
    regionName: typeof (row.region as { name?: unknown } | null)?.name === 'string' ? (row.region as { name: string }).name : null,
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

  return NextResponse.json({ ok: true, pharmacy: toPharmacyView(pharmacy) })
}
