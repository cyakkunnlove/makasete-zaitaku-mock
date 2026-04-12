import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getCurrentActorRole } from '@/lib/active-role'
import { ensureRecentReverification } from '@/lib/api-reauth'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit-log'
import {
  buildInvitationAcceptUrl,
  getInvitationBaseUrl,
  buildRegionalAdminInvitationEmail,
  createInvitationToken,
  hashInvitationToken,
  sendEmail,
} from '@/lib/account-invitations'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  if (getCurrentActorRole(user) !== 'system_admin') {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const reauthResponse = await ensureRecentReverification(user, {
    reason: 'regional_admin_create',
    nextPath: '/dashboard/staff',
  })
  if (reauthResponse) return reauthResponse

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })
  }

  const fullName = typeof (body as Record<string, unknown>).fullName === 'string' ? (body as Record<string, string>).fullName.trim() : ''
  const email = typeof (body as Record<string, unknown>).email === 'string' ? (body as Record<string, string>).email.trim().toLowerCase() : ''
  const phone = typeof (body as Record<string, unknown>).phone === 'string' ? (body as Record<string, string>).phone.trim() : null
  const regionId = typeof (body as Record<string, unknown>).regionId === 'string' ? (body as Record<string, string>).regionId : ''

  if (!fullName || !email || !regionId) {
    return NextResponse.json({ ok: false, error: 'missing_required_fields' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  const regionResponse = await supabase
    .from('regions')
    .select('id, name, organization_id')
    .eq('id', regionId)
    .eq('organization_id', user.organization_id)
    .maybeSingle()

  const regionError = regionResponse.error
  const region = regionResponse.data as { id: string; name: string; organization_id: string } | null

  if (regionError) {
    return NextResponse.json({ ok: false, error: 'region_lookup_failed', details: regionError.message }, { status: 500 })
  }
  if (!region) {
    return NextResponse.json({ ok: false, error: 'region_not_found' }, { status: 404 })
  }

  const { data: existingUser, error: existingUserError } = await supabase
    .from('users')
    .select('id, email, role, status')
    .eq('email', email)
    .maybeSingle()

  if (existingUserError) {
    return NextResponse.json({ ok: false, error: 'user_lookup_failed', details: existingUserError.message }, { status: 500 })
  }

  if (existingUser) {
    return NextResponse.json({ ok: false, error: 'email_already_exists' }, { status: 409 })
  }

  const now = new Date().toISOString()
  const createUserResponse = await supabase
    .from('users')
    .insert({
      organization_id: user.organization_id,
      role: 'regional_admin',
      region_id: region.id,
      pharmacy_id: null,
      operation_unit_id: null,
      full_name: fullName,
      phone,
      email,
      is_active: true,
      status: 'invited',
      created_at: now,
      updated_at: now,
    } as never)
    .select('id, full_name, email, role, status, region_id')
    .single()

  const createUserError = createUserResponse.error
  const createdUser = createUserResponse.data as {
    id: string
    full_name: string
    email: string
    role: 'regional_admin'
    status: string
    region_id: string | null
  } | null

  if (createUserError || !createdUser) {
    return NextResponse.json({ ok: false, error: 'user_create_failed', details: createUserError?.message ?? null }, { status: 500 })
  }

  const { error: assignmentError } = await supabase
    .from('user_role_assignments')
    .insert({
      user_id: createdUser.id,
      organization_id: user.organization_id,
      role: 'regional_admin',
      region_id: region.id,
      pharmacy_id: null,
      operation_unit_id: null,
      is_default: true,
      is_active: true,
      granted_by: user.id,
      granted_at: now,
      created_at: now,
      updated_at: now,
    } as never)

  if (assignmentError) {
    await supabase.from('users').delete().eq('id', createdUser.id)
    return NextResponse.json({ ok: false, error: 'role_assignment_create_failed', details: assignmentError.message }, { status: 500 })
  }

  const rawToken = createInvitationToken()
  const tokenHash = hashInvitationToken(rawToken)
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()

  const invitationInsert = await supabase
    .from('account_invitations')
    .insert({
      organization_id: user.organization_id,
      invited_user_id: createdUser.id,
      role: 'regional_admin',
      email: createdUser.email,
      region_id: region.id,
      pharmacy_id: null,
      operation_unit_id: null,
      token_hash: tokenHash,
      status: 'pending',
      expires_at: expiresAt,
      created_by: user.id,
      created_at: now,
      updated_at: now,
    } as never)
    .select('id')
    .single()

  const createdInvitation = invitationInsert.data as { id: string } | null

  if (invitationInsert.error || !createdInvitation) {
    await supabase.from('user_role_assignments').delete().eq('user_id', createdUser.id)
    await supabase.from('users').delete().eq('id', createdUser.id)
    return NextResponse.json({ ok: false, error: 'invitation_create_failed', details: invitationInsert.error?.message ?? null }, { status: 500 })
  }

  const acceptUrl = buildInvitationAcceptUrl(getInvitationBaseUrl(request), rawToken)
  let emailSent = false
  let emailError: string | null = null
  let messageId: string | null = null

  try {
    const emailPayload = buildRegionalAdminInvitationEmail({
      to: createdUser.email,
      fullName: createdUser.full_name,
      regionName: region.name,
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
      .update({ sent_at: new Date().toISOString(), last_sent_at: new Date().toISOString(), message_id: messageId, updated_at: new Date().toISOString() } as never)
      .eq('id', createdInvitation.id)
  } catch (error) {
    emailError = error instanceof Error ? error.message : 'email_send_failed'
  }

  await writeAuditLog({
    user,
    action: 'regional_admin_created',
    targetType: 'user',
    targetId: createdUser.id,
    details: {
      created_email: createdUser.email,
      created_role: createdUser.role,
      region_id: region.id,
      region_name: region.name,
      invitation_status: 'pending',
      invitation_id: createdInvitation.id,
      invitation_email_sent: emailSent,
      invitation_message_id: messageId,
      invitation_email_error: emailError,
      auth_setup: 'cognito_signup_pending',
    },
  })

  return NextResponse.json({
    ok: true,
    user: createdUser,
    region: { id: region.id, name: region.name },
    invitation: {
      id: createdInvitation.id,
      expiresAt,
      emailSent,
      messageId,
      emailError,
      acceptUrl,
    },
    nextStep: emailSent
      ? '招待メールを送信しました。次は受諾後の Cognito 初回登録連携です。'
      : 'invitation は作成済みですが、メール送信は失敗しました。SES 設定確認後に再送導線をつなぐ必要があります。',
  })
}
