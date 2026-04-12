import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { ensureRecentReverification } from '@/lib/api-reauth'
import { getCurrentActorRole } from '@/lib/active-role'
import { writeAuditLog } from '@/lib/audit-log'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { buildInvitationAcceptUrl, buildRegionalAdminInvitationEmail, createInvitationToken, getInvitationBaseUrl, hashInvitationToken, sendEmail } from '@/lib/account-invitations'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const reauthResponse = await ensureRecentReverification(user, {
    reason: 'regional_admin_create',
    nextPath: '/dashboard/staff',
  })
  if (reauthResponse) return reauthResponse

  if (getCurrentActorRole(user) !== 'system_admin') {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })
  }

  const fullName = typeof (body as Record<string, unknown>).fullName === 'string' ? (body as Record<string, string>).fullName.trim() : ''
  const email = typeof (body as Record<string, unknown>).email === 'string' ? (body as Record<string, string>).email.trim().toLowerCase() : ''
  const phone = typeof (body as Record<string, unknown>).phone === 'string' ? (body as Record<string, string>).phone.trim() : null
  const regionIds = Array.isArray((body as Record<string, unknown>).regionIds)
    ? Array.from(new Set(((body as Record<string, unknown>).regionIds as unknown[]).filter((value): value is string => typeof value === 'string' && value.length > 0)))
    : []

  if (!fullName || !email) {
    return NextResponse.json({ ok: false, error: 'missing_required_fields' }, { status: 400 })
  }
  if (regionIds.length === 0) {
    return NextResponse.json({ ok: false, error: 'region_required' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  const existingUserResponse = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  if (existingUserResponse.error) {
    return NextResponse.json({ ok: false, error: 'user_lookup_failed', details: existingUserResponse.error.message }, { status: 500 })
  }
  if (existingUserResponse.data) {
    return NextResponse.json({ ok: false, error: 'email_already_exists' }, { status: 409 })
  }

  const regionsResponse = await supabase
    .from('regions')
    .select('id, name, organization_id')
    .in('id', regionIds)
    .eq('organization_id', user.organization_id)

  if (regionsResponse.error) {
    return NextResponse.json({ ok: false, error: 'region_lookup_failed', details: regionsResponse.error.message }, { status: 500 })
  }

  const regions = (regionsResponse.data ?? []) as Array<{ id: string; name: string; organization_id: string }>
  if (regions.length !== regionIds.length) {
    return NextResponse.json({ ok: false, error: 'region_not_found' }, { status: 404 })
  }

  const primaryRegionId = regionIds[0]
  const primaryRegionName = regions.find((region) => region.id === primaryRegionId)?.name ?? regions[0]?.name ?? '未設定'
  const regionNames = regionIds.map((id) => regions.find((region) => region.id === id)?.name).filter((value): value is string => Boolean(value))

  const now = new Date().toISOString()
  const createUserResponse = await supabase
    .from('users')
    .insert({
      organization_id: user.organization_id,
      role: 'regional_admin',
      region_id: primaryRegionId,
      pharmacy_id: null,
      operation_unit_id: null,
      full_name: fullName,
      phone: phone || null,
      email,
      is_active: true,
      status: 'invited',
      created_at: now,
      updated_at: now,
    } as never)
    .select('id, full_name, email, role, status, region_id, pharmacy_id')
    .single()

  const createdUser = createUserResponse.data as { id: string; full_name: string; email: string; role: 'regional_admin'; status: string; region_id: string | null; pharmacy_id: string | null } | null
  if (createUserResponse.error || !createdUser) {
    return NextResponse.json({ ok: false, error: 'user_create_failed', details: createUserResponse.error?.message ?? null }, { status: 500 })
  }

  const assignmentPayload = regionIds.map((regionId, index) => ({
    user_id: createdUser.id,
    organization_id: user.organization_id,
    role: 'regional_admin',
    region_id: regionId,
    pharmacy_id: null,
    operation_unit_id: null,
    is_default: index === 0,
    is_active: true,
    granted_by: user.id,
    granted_at: now,
    created_at: now,
    updated_at: now,
  }))

  const assignmentResponse = await supabase.from('user_role_assignments').insert(assignmentPayload as never)
  if (assignmentResponse.error) {
    await supabase.from('users').delete().eq('id', createdUser.id)
    return NextResponse.json({ ok: false, error: 'role_assignment_create_failed', details: assignmentResponse.error.message }, { status: 500 })
  }

  const rawToken = createInvitationToken()
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()
  const invitationResponse = await supabase
    .from('account_invitations')
    .insert({
      organization_id: user.organization_id,
      invited_user_id: createdUser.id,
      role: 'regional_admin',
      email: createdUser.email,
      region_id: primaryRegionId,
      pharmacy_id: null,
      operation_unit_id: null,
      token_hash: hashInvitationToken(rawToken),
      status: 'pending',
      expires_at: expiresAt,
      created_by: user.id,
      created_at: now,
      updated_at: now,
    } as never)
    .select('id')
    .single()

  const createdInvitation = invitationResponse.data as { id: string } | null
  if (invitationResponse.error || !createdInvitation) {
    await supabase.from('user_role_assignments').delete().eq('user_id', createdUser.id)
    await supabase.from('users').delete().eq('id', createdUser.id)
    return NextResponse.json({ ok: false, error: 'invitation_create_failed', details: invitationResponse.error?.message ?? null }, { status: 500 })
  }

  const acceptUrl = buildInvitationAcceptUrl(getInvitationBaseUrl(request), rawToken)
  let emailSent = false
  let emailError: string | null = null
  let messageId: string | null = null

  try {
    const emailPayload = buildRegionalAdminInvitationEmail({
      to: createdUser.email,
      fullName: createdUser.full_name,
      regionName: regionNames.join(' / ') || primaryRegionName,
      acceptUrl,
      expiresAt,
    })
    const emailResponse = await sendEmail({
      to: createdUser.email,
      subject: emailPayload.subject,
      text: emailPayload.text,
      html: emailPayload.html,
    })
    emailSent = true
    messageId = emailResponse.MessageId ?? null

    await supabase
      .from('account_invitations')
      .update({ sent_at: now, last_sent_at: now, message_id: messageId, updated_at: now } as never)
      .eq('id', createdInvitation.id)
  } catch (error) {
    emailError = error instanceof Error ? error.message : 'email_send_failed'
  }

  await writeAuditLog({
    user: user as never,
    action: 'account_invitation_created',
    targetType: 'user',
    targetId: createdUser.id,
    details: {
      actor_role: 'system_admin',
      actor_region_id: null,
      actor_pharmacy_id: null,
      target_user_id: createdUser.id,
      target_invitation_id: createdInvitation.id,
      target_email: createdUser.email,
      target_role: createdUser.role,
      target_region_id: primaryRegionId,
      target_pharmacy_id: null,
      changes: {
        full_name: createdUser.full_name,
        status: createdUser.status,
        region_ids: regionIds,
      },
      delivery: {
        email_sent: emailSent,
        message_id: messageId,
        email_error: emailError,
      },
      auth: {
        setup: 'cognito_signup_pending',
      },
    },
  })

  return NextResponse.json({
    ok: true,
    user: createdUser,
    invitation: {
      id: createdInvitation.id,
      expiresAt,
      emailSent,
      messageId,
      emailError,
      regionIds,
      regionNames,
    },
    nextStep: emailSent
      ? '招待メールを送信しました。次は受諾後の Cognito 初回登録連携です。'
      : 'invitation は作成済みですが、メール送信は失敗しました。SES 設定確認後に再送導線をつなぐ必要があります。',
  })
}
