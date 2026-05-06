import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getCurrentActorRole, getCurrentScope } from '@/lib/active-role'
import { ensureRecentReverification } from '@/lib/api-reauth'
import { writeAuditLog } from '@/lib/audit-log'
import { createAccountInvitation } from '@/lib/account-invitation-service'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

const UNSET_TEXT = '未設定'
const UNSET_PHONE = '-'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const actorRole = getCurrentActorRole(user)
  const actorScope = getCurrentScope(user)
  if (actorRole !== 'regional_admin' || !actorScope.regionId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const reauthResponse = await ensureRecentReverification(user, {
    reason: 'new_pharmacy_invitation_create',
    nextPath: '/dashboard/staff',
  })
  if (reauthResponse) return reauthResponse

  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })

  const pharmacyName = typeof body.pharmacyName === 'string' ? body.pharmacyName.trim() : ''
  const adminEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const adminPhone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const adminFullName = typeof body.fullName === 'string' && body.fullName.trim()
    ? body.fullName.trim()
    : `${pharmacyName} 管理者`

  if (!pharmacyName || !adminEmail) {
    return NextResponse.json({ ok: false, error: 'missing_required_fields' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const now = new Date().toISOString()
  const code = `pharmacy-${Date.now()}`

  const insertResponse = await supabase
    .from('pharmacies')
    .insert({
      organization_id: user.organization_id,
      region_id: actorScope.regionId,
      code,
      name: pharmacyName,
      area: null,
      address: UNSET_TEXT,
      phone: UNSET_PHONE,
      fax: null,
      forwarding_phone: null,
      patient_count: 0,
      status: 'pending',
      forwarding_status: 'off',
      forwarding_mode: 'manual_off',
      forwarding_auto_start: '22:00',
      forwarding_auto_end: '06:00',
      forwarding_updated_by_name: user.full_name,
      forwarding_updated_at: now,
      contract_date: null,
      night_delegation_enabled: false,
      saas_monthly_fee: 0,
      night_monthly_fee: 0,
      created_at: now,
      updated_at: now,
    } as never)
    .select('id, name, region_id')
    .single()

  const pharmacy = insertResponse.data as { id: string; name: string; region_id: string | null } | null
  if (insertResponse.error || !pharmacy) {
    return NextResponse.json({ ok: false, error: 'pharmacy_create_failed', details: insertResponse.error?.message ?? null }, { status: 500 })
  }

  const invitationResult = await createAccountInvitation({
    actor: user,
    request,
    input: {
      fullName: adminFullName,
      email: adminEmail,
      phone: adminPhone || null,
      targetRole: 'pharmacy_admin',
      regionId: actorScope.regionId,
      pharmacyId: pharmacy.id,
      operationUnitId: null,
    },
  })

  if (!invitationResult.ok) {
    await supabase.from('pharmacies').delete().eq('id', pharmacy.id)
    return NextResponse.json({ ok: false, error: invitationResult.error, details: 'details' in invitationResult ? invitationResult.details : null }, { status: invitationResult.status })
  }

  await writeAuditLog({
    user,
    action: 'new_pharmacy_invited',
    targetType: 'pharmacy',
    targetId: pharmacy.id,
    details: {
      actor_role: actorRole,
      pharmacy_name: pharmacyName,
      pharmacy_admin_user_id: invitationResult.data.user.id,
      pharmacy_admin_email: invitationResult.data.user.email,
      invitation_id: invitationResult.data.invitation.id,
      target_region_id: actorScope.regionId,
    },
  })

  return NextResponse.json({
    ok: true,
    pharmacy: {
      id: pharmacy.id,
      name: pharmacy.name,
      region_id: pharmacy.region_id,
    },
    ...invitationResult.data,
  })
}
