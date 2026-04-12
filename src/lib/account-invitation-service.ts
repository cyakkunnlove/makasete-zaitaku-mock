import { getCurrentActorRole, getCurrentScope, type RoleAwareUser } from '@/lib/active-role'
import { writeAuditLog } from '@/lib/audit-log'
import {
  buildInvitationAcceptUrl,
  getInvitationBaseUrl,
  buildRegionalAdminInvitationEmail,
  createInvitationToken,
  hashInvitationToken,
  sendEmail,
} from '@/lib/account-invitations'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/database'

export type InvitationCreateInput = {
  fullName: string
  email: string
  phone?: string | null
  targetRole: UserRole
  regionId?: string | null
  pharmacyId?: string | null
  operationUnitId?: string | null
}

function canInvite(actorRole: UserRole | null, targetRole: UserRole) {
  if (actorRole === 'system_admin') {
    return targetRole === 'regional_admin' || targetRole === 'system_admin'
  }
  if (actorRole === 'regional_admin') {
    return targetRole === 'pharmacy_admin' || targetRole === 'night_pharmacist'
  }
  if (actorRole === 'pharmacy_admin') {
    return targetRole === 'pharmacy_staff'
  }
  return false
}

export async function createAccountInvitation(params: {
  actor: RoleAwareUser & {
    id: string
    organization_id: string
    email: string
    full_name: string
  }
  request: Request
  input: InvitationCreateInput
}) {
  const actorRole = getCurrentActorRole(params.actor)
  if (!canInvite(actorRole, params.input.targetRole)) {
    return { ok: false as const, status: 403, error: 'forbidden_target_role' }
  }

  const normalized = {
    fullName: params.input.fullName.trim(),
    email: params.input.email.trim().toLowerCase(),
    phone: params.input.phone?.trim() || null,
    targetRole: params.input.targetRole,
    regionId: params.input.regionId ?? null,
    pharmacyId: params.input.pharmacyId ?? null,
    operationUnitId: params.input.operationUnitId ?? null,
  }

  if (!normalized.fullName || !normalized.email) {
    return { ok: false as const, status: 400, error: 'missing_required_fields' }
  }

  const actorScope = getCurrentScope(params.actor)
  if (actorRole === 'system_admin') {
    if (normalized.targetRole === 'regional_admin' && !normalized.regionId) {
      return { ok: false as const, status: 400, error: 'region_required' }
    }
  }
  if (actorRole === 'regional_admin') {
    if (!actorScope.regionId) {
      return { ok: false as const, status: 400, error: 'actor_region_missing' }
    }
    normalized.regionId = actorScope.regionId
    if (normalized.targetRole === 'pharmacy_admin' || normalized.targetRole === 'night_pharmacist') {
      if (!normalized.pharmacyId) {
        return { ok: false as const, status: 400, error: 'pharmacy_required' }
      }
    }
  }
  if (actorRole === 'pharmacy_admin') {
    if (!actorScope.regionId || !actorScope.pharmacyId) {
      return { ok: false as const, status: 400, error: 'actor_scope_missing' }
    }
    normalized.regionId = actorScope.regionId
    normalized.pharmacyId = actorScope.pharmacyId
  }

  const supabase = createServerSupabaseClient()

  const existingUserResponse = await supabase
    .from('users')
    .select('id, email')
    .eq('email', normalized.email)
    .maybeSingle()

  if (existingUserResponse.error) {
    return { ok: false as const, status: 500, error: 'user_lookup_failed', details: existingUserResponse.error.message }
  }
  if (existingUserResponse.data) {
    return { ok: false as const, status: 409, error: 'email_already_exists' }
  }

  let regionName: string | null = null
  if (normalized.regionId) {
    const regionResponse = await supabase
      .from('regions')
      .select('id, name, organization_id')
      .eq('id', normalized.regionId)
      .eq('organization_id', params.actor.organization_id)
      .maybeSingle()
    if (regionResponse.error) {
      return { ok: false as const, status: 500, error: 'region_lookup_failed', details: regionResponse.error.message }
    }
    if (!regionResponse.data) {
      return { ok: false as const, status: 404, error: 'region_not_found' }
    }
    regionName = (regionResponse.data as { name: string }).name
  }

  if (normalized.pharmacyId) {
    const pharmacyResponse = await supabase
      .from('pharmacies')
      .select('id, region_id, organization_id')
      .eq('id', normalized.pharmacyId)
      .eq('organization_id', params.actor.organization_id)
      .maybeSingle()
    if (pharmacyResponse.error) {
      return { ok: false as const, status: 500, error: 'pharmacy_lookup_failed', details: pharmacyResponse.error.message }
    }
    const pharmacy = pharmacyResponse.data as { id: string; region_id: string | null; organization_id: string } | null
    if (!pharmacy) {
      return { ok: false as const, status: 404, error: 'pharmacy_not_found' }
    }
    if (normalized.regionId && pharmacy.region_id !== normalized.regionId) {
      return { ok: false as const, status: 400, error: 'pharmacy_region_mismatch' }
    }
  }

  const now = new Date().toISOString()
  const createUserResponse = await supabase
    .from('users')
    .insert({
      organization_id: params.actor.organization_id,
      role: normalized.targetRole,
      region_id: normalized.regionId,
      pharmacy_id: normalized.pharmacyId,
      operation_unit_id: normalized.operationUnitId,
      full_name: normalized.fullName,
      phone: normalized.phone,
      email: normalized.email,
      is_active: true,
      status: 'invited',
      created_at: now,
      updated_at: now,
    } as never)
    .select('id, full_name, email, role, status, region_id, pharmacy_id')
    .single()

  const createdUser = createUserResponse.data as {
    id: string
    full_name: string
    email: string
    role: UserRole
    status: string
    region_id: string | null
    pharmacy_id: string | null
  } | null

  if (createUserResponse.error || !createdUser) {
    return { ok: false as const, status: 500, error: 'user_create_failed', details: createUserResponse.error?.message ?? null }
  }

  const assignmentResponse = await supabase.from('user_role_assignments').insert({
    user_id: createdUser.id,
    organization_id: params.actor.organization_id,
    role: normalized.targetRole,
    region_id: normalized.regionId,
    pharmacy_id: normalized.pharmacyId,
    operation_unit_id: normalized.operationUnitId,
    is_default: true,
    is_active: true,
    granted_by: params.actor.id,
    granted_at: now,
    created_at: now,
    updated_at: now,
  } as never)

  if (assignmentResponse.error) {
    await supabase.from('users').delete().eq('id', createdUser.id)
    return { ok: false as const, status: 500, error: 'role_assignment_create_failed', details: assignmentResponse.error.message }
  }

  const rawToken = createInvitationToken()
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()
  const invitationResponse = await supabase
    .from('account_invitations')
    .insert({
      organization_id: params.actor.organization_id,
      invited_user_id: createdUser.id,
      role: normalized.targetRole,
      email: createdUser.email,
      region_id: normalized.regionId,
      pharmacy_id: normalized.pharmacyId,
      operation_unit_id: normalized.operationUnitId,
      token_hash: hashInvitationToken(rawToken),
      status: 'pending',
      expires_at: expiresAt,
      created_by: params.actor.id,
      created_at: now,
      updated_at: now,
    } as never)
    .select('id')
    .single()

  const createdInvitation = invitationResponse.data as { id: string } | null
  if (invitationResponse.error || !createdInvitation) {
    await supabase.from('user_role_assignments').delete().eq('user_id', createdUser.id)
    await supabase.from('users').delete().eq('id', createdUser.id)
    return { ok: false as const, status: 500, error: 'invitation_create_failed', details: invitationResponse.error?.message ?? null }
  }

  const acceptUrl = buildInvitationAcceptUrl(getInvitationBaseUrl(params.request), rawToken)
  let emailSent = false
  let emailError: string | null = null
  let messageId: string | null = null

  try {
    const emailPayload = buildRegionalAdminInvitationEmail({
      to: createdUser.email,
      fullName: createdUser.full_name,
      regionName: regionName ?? '未設定',
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
    user: params.actor as never,
    action: 'account_invitation_created',
    targetType: 'user',
    targetId: createdUser.id,
    details: {
      created_email: createdUser.email,
      created_role: createdUser.role,
      region_id: normalized.regionId,
      pharmacy_id: normalized.pharmacyId,
      invitation_id: createdInvitation.id,
      invitation_email_sent: emailSent,
      invitation_message_id: messageId,
      invitation_email_error: emailError,
      auth_setup: 'cognito_signup_pending',
    },
  })

  return {
    ok: true as const,
    status: 200,
    data: {
      user: createdUser,
      invitation: {
        id: createdInvitation.id,
        expiresAt,
        emailSent,
        messageId,
        emailError,
        acceptUrl,
      },
    },
  }
}
