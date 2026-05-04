import { getCurrentActorRole, getCurrentScope, type RoleAwareUser } from '@/lib/active-role'
import { writeRequiredAuditLog } from '@/lib/audit-log'
import {
  buildInvitationAcceptUrl,
  getInvitationBaseUrl,
  buildAccountInvitationEmail,
  createInvitationToken,
  hashInvitationToken,
  sendEmail,
} from '@/lib/account-invitations'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import type { AccountInvitationStatus, UserRole } from '@/types/database'
import { disableCognitoUserByEmail, enableCognitoUserByEmail } from '@/lib/cognito-admin'

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

function canManageTargetRole(actorRole: UserRole | null, targetRole: UserRole) {
  return canInvite(actorRole, targetRole)
}

function buildAccountAuditDetails(params: {
  actorRole: UserRole | null
  actorScope: ReturnType<typeof getCurrentScope>
  target?: {
    userId?: string | null
    invitationId?: string | null
    email?: string | null
    role?: UserRole | null
    regionId?: string | null
    pharmacyId?: string | null
  }
  changes?: Record<string, unknown>
  delivery?: Record<string, unknown>
  auth?: Record<string, unknown>
}) {
  return {
    actor_role: params.actorRole,
    actor_region_id: params.actorScope.regionId,
    actor_pharmacy_id: params.actorScope.pharmacyId,
    target_user_id: params.target?.userId ?? null,
    target_invitation_id: params.target?.invitationId ?? null,
    target_email: params.target?.email ?? null,
    target_role: params.target?.role ?? null,
    target_region_id: params.target?.regionId ?? null,
    target_pharmacy_id: params.target?.pharmacyId ?? null,
    changes: params.changes ?? null,
    delivery: params.delivery ?? null,
    auth: params.auth ?? null,
  }
}

export async function listManagedUsers(params: {
  actor: RoleAwareUser & { id: string; organization_id: string; email?: string | null; full_name?: string | null }
}) {
  const actorRole = getCurrentActorRole(params.actor)
  const actorScope = getCurrentScope(params.actor)
  const supabase = createServerSupabaseClient()

  let query = supabase
    .from('users')
    .select('id, full_name, role, phone, email, status, region_id, pharmacy_id, created_at, region:regions(name), pharmacy:pharmacies(name)')
    .eq('organization_id', params.actor.organization_id)
    .order('created_at', { ascending: false })

  if (actorRole === 'system_admin') {
    query = query.in('role', ['system_admin', 'regional_admin'])
  } else if (actorRole === 'regional_admin' && actorScope.regionId) {
    query = query
      .in('role', ['pharmacy_admin', 'night_pharmacist'])
      .eq('region_id', actorScope.regionId)
  } else if (actorRole === 'pharmacy_admin' && actorScope.pharmacyId) {
    query = query
      .in('role', ['pharmacy_staff'])
      .eq('pharmacy_id', actorScope.pharmacyId)
  } else {
    return { ok: false as const, status: 403, error: 'forbidden' }
  }

  const response = await query.limit(100)
  if (response.error) {
    return { ok: false as const, status: 500, error: 'managed_users_list_failed', details: response.error.message }
  }

  const rows = (response.data ?? []).map((user) => ({
    id: String((user as Record<string, unknown>).id ?? ''),
    name: String((user as Record<string, unknown>).full_name ?? ''),
    role: (user as Record<string, unknown>).role as UserRole,
    phone: String((user as Record<string, unknown>).phone ?? ''),
    email: String((user as Record<string, unknown>).email ?? ''),
    status: (((user as Record<string, unknown>).status as string | null) ?? 'invited') as 'invited' | 'active' | 'suspended',
    regionId: ((user as Record<string, unknown>).region_id as string | null) ?? null,
    regionName: typeof ((user as Record<string, unknown>).region as { name?: unknown } | null)?.name === 'string' ? ((user as Record<string, unknown>).region as { name: string }).name : null,
    pharmacyId: ((user as Record<string, unknown>).pharmacy_id as string | null) ?? null,
    pharmacyName: typeof ((user as Record<string, unknown>).pharmacy as { name?: unknown } | null)?.name === 'string' ? ((user as Record<string, unknown>).pharmacy as { name: string }).name : null,
  }))

  if (actorRole === 'system_admin' || actorRole === 'regional_admin' || actorRole === 'pharmacy_admin') {
    const selfExists = rows.some((item) => item.id === params.actor.id)
    if (!selfExists) {
      rows.unshift({
        id: params.actor.id,
        name: params.actor.full_name ?? '',
        role: actorRole,
        phone: '',
        email: params.actor.email ?? '',
        status: 'active',
        regionId: actorScope.regionId,
        regionName: null,
        pharmacyId: actorScope.pharmacyId,
        pharmacyName: null,
      })
    }
  }

  const assignmentsResponse = await supabase
    .from('user_role_assignments')
    .select('user_id, region:regions(name), pharmacy:pharmacies(name)')
    .in('user_id', rows.map((item) => item.id))
    .eq('is_active', true)

  const assignmentMap = new Map<string, { regionNames: string[]; pharmacyNames: string[] }>()
  if (!assignmentsResponse.error) {
    for (const assignment of assignmentsResponse.data ?? []) {
      const row = assignment as Record<string, unknown>
      const userId = String(row.user_id ?? '')
      const current = assignmentMap.get(userId) ?? { regionNames: [], pharmacyNames: [] }
      const regionName = typeof (row.region as { name?: unknown } | null)?.name === 'string' ? (row.region as { name: string }).name : null
      const pharmacyName = typeof (row.pharmacy as { name?: unknown } | null)?.name === 'string' ? (row.pharmacy as { name: string }).name : null
      if (regionName && !current.regionNames.includes(regionName)) current.regionNames.push(regionName)
      if (pharmacyName && !current.pharmacyNames.includes(pharmacyName)) current.pharmacyNames.push(pharmacyName)
      assignmentMap.set(userId, current)
    }
  }

  return {
    ok: true as const,
    status: 200,
    data: {
      users: rows.map((user) => ({
        ...user,
        regionName: assignmentMap.get(user.id)?.regionNames.join(' / ') || user.regionName,
        pharmacyName: assignmentMap.get(user.id)?.pharmacyNames.join(' / ') || user.pharmacyName,
      })),
    },
  }
}

export async function updateManagedUser(params: {
  actor: RoleAwareUser & { id: string; organization_id: string; email: string; full_name: string }
  userId: string
  fullName: string
  phone?: string | null
  regionId?: string | null
  pharmacyId?: string | null
}) {
  const actorRole = getCurrentActorRole(params.actor)
  const actorScope = getCurrentScope(params.actor)
  const supabase = createServerSupabaseClient()

  const userResponse = await supabase
    .from('users')
    .select('id, email, role, status, region_id, pharmacy_id')
    .eq('id', params.userId)
    .eq('organization_id', params.actor.organization_id)
    .maybeSingle()

  const targetUser = userResponse.data as {
    id: string
    email: string
    role: UserRole
    status: string
    region_id: string | null
    pharmacy_id: string | null
  } | null

  if (userResponse.error) {
    return { ok: false as const, status: 500, error: 'user_lookup_failed', details: userResponse.error.message }
  }
  if (!targetUser) {
    return { ok: false as const, status: 404, error: 'user_not_found' }
  }
  const isSelfEdit = params.actor.id === targetUser.id
  const canSelfEdit = isSelfEdit && (actorRole === 'system_admin' || actorRole === 'regional_admin' || actorRole === 'pharmacy_admin')

  if (!canManageTargetRole(actorRole, targetUser.role) && !canSelfEdit) {
    return { ok: false as const, status: 403, error: 'forbidden_target_role' }
  }
  if (!isSelfEdit && actorRole === 'regional_admin' && actorScope.regionId !== targetUser.region_id) {
    return { ok: false as const, status: 403, error: 'forbidden_scope' }
  }
  if (!isSelfEdit && actorRole === 'pharmacy_admin' && actorScope.pharmacyId !== targetUser.pharmacy_id) {
    return { ok: false as const, status: 403, error: 'forbidden_scope' }
  }

  const normalizedName = params.fullName.trim()
  const normalizedPhone = params.phone?.trim() || null
  let nextRegionId = params.regionId ?? targetUser.region_id
  let nextPharmacyId = params.pharmacyId ?? targetUser.pharmacy_id

  if (!normalizedName) {
    return { ok: false as const, status: 400, error: 'full_name_required' }
  }

  if (isSelfEdit) {
    nextRegionId = targetUser.region_id
    nextPharmacyId = targetUser.pharmacy_id
  } else if (actorRole === 'regional_admin') {
    nextRegionId = actorScope.regionId
    if ((targetUser.role === 'pharmacy_admin' || targetUser.role === 'night_pharmacist') && !nextPharmacyId) {
      return { ok: false as const, status: 400, error: 'pharmacy_required' }
    }
  }
  if (!isSelfEdit && actorRole === 'pharmacy_admin') {
    nextRegionId = actorScope.regionId
    nextPharmacyId = actorScope.pharmacyId
  }

  const now = new Date().toISOString()
  const updateResponse = await supabase
    .from('users')
    .update({
      full_name: normalizedName,
      phone: normalizedPhone,
      region_id: nextRegionId,
      pharmacy_id: nextPharmacyId,
      updated_at: now,
    } as never)
    .eq('id', targetUser.id)

  if (updateResponse.error) {
    return { ok: false as const, status: 500, error: 'user_update_failed', details: updateResponse.error.message }
  }

  if (!isSelfEdit) {
    const assignmentUpdate = await supabase
      .from('user_role_assignments')
      .update({
        region_id: nextRegionId,
        pharmacy_id: nextPharmacyId,
        updated_at: now,
      } as never)
      .eq('user_id', targetUser.id)
      .eq('role', targetUser.role)

    if (assignmentUpdate.error) {
      return { ok: false as const, status: 500, error: 'role_assignment_update_failed', details: assignmentUpdate.error.message }
    }
  }

  await writeRequiredAuditLog({
    user: params.actor as never,
    action: 'account_user_updated',
    targetType: 'user',
    targetId: targetUser.id,
    details: buildAccountAuditDetails({
      actorRole,
      actorScope,
      target: {
        userId: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
        regionId: nextRegionId,
        pharmacyId: nextPharmacyId,
      },
      changes: {
        full_name: normalizedName,
        phone: normalizedPhone,
        region_id: nextRegionId,
        pharmacy_id: nextPharmacyId,
      },
    }),
  })

  return {
    ok: true as const,
    status: 200,
    data: {
      userId: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      fullName: normalizedName,
      phone: normalizedPhone,
      regionId: nextRegionId,
      pharmacyId: nextPharmacyId,
    },
  }
}

export async function addRoleAssignmentsToExistingUser(params: {
  actor: RoleAwareUser & { id: string; organization_id: string; email: string; full_name: string }
  userId: string
  targetRole: UserRole
  regionIds: string[]
}) {
  const actorRole = getCurrentActorRole(params.actor)
  if (actorRole !== 'system_admin') {
    return { ok: false as const, status: 403, error: 'forbidden' }
  }
  if (params.targetRole !== 'regional_admin') {
    return { ok: false as const, status: 400, error: 'unsupported_target_role' }
  }

  const regionIds = Array.from(new Set(params.regionIds.filter(Boolean)))
  if (regionIds.length === 0) {
    return { ok: false as const, status: 400, error: 'region_required' }
  }

  const actorScope = getCurrentScope(params.actor)
  const supabase = createServerSupabaseClient()
  const userResponse = await supabase
    .from('users')
    .select('id, email, role, organization_id')
    .eq('id', params.userId)
    .eq('organization_id', params.actor.organization_id)
    .maybeSingle()

  const targetUser = userResponse.data as { id: string; email: string; role: UserRole; organization_id: string } | null
  if (userResponse.error) {
    return { ok: false as const, status: 500, error: 'user_lookup_failed', details: userResponse.error.message }
  }
  if (!targetUser) {
    return { ok: false as const, status: 404, error: 'user_not_found' }
  }

  const regionResponse = await supabase
    .from('regions')
    .select('id, name')
    .in('id', regionIds)
    .eq('organization_id', params.actor.organization_id)

  if (regionResponse.error) {
    return { ok: false as const, status: 500, error: 'region_lookup_failed', details: regionResponse.error.message }
  }
  const regions = (regionResponse.data ?? []) as Array<{ id: string; name: string }>
  if (regions.length !== regionIds.length) {
    return { ok: false as const, status: 404, error: 'region_not_found' }
  }

  const existingAssignmentsResponse = await supabase
    .from('user_role_assignments')
    .select('region_id')
    .eq('user_id', targetUser.id)
    .eq('role', 'regional_admin')
    .eq('is_active', true)
    .is('revoked_at', null)

  if (existingAssignmentsResponse.error) {
    return { ok: false as const, status: 500, error: 'role_assignment_lookup_failed', details: existingAssignmentsResponse.error.message }
  }

  const existingRegionIds = new Set(((existingAssignmentsResponse.data ?? []) as Array<{ region_id: string | null }>).map((row) => row.region_id).filter((value): value is string => Boolean(value)))
  const regionIdsToAdd = regionIds.filter((regionId) => !existingRegionIds.has(regionId))
  if (regionIdsToAdd.length === 0) {
    return { ok: true as const, status: 200, data: { userId: targetUser.id, email: targetUser.email, alreadyApplied: true, regionIds } }
  }

  const defaultAssignmentResponse = await supabase
    .from('user_role_assignments')
    .select('id')
    .eq('user_id', targetUser.id)
    .eq('is_default', true)
    .maybeSingle()

  const hasDefaultAssignment = Boolean(defaultAssignmentResponse.data)
  const now = new Date().toISOString()
  const payload = regionIdsToAdd.map((regionId, index) => ({
    user_id: targetUser.id,
    organization_id: params.actor.organization_id,
    role: 'regional_admin',
    region_id: regionId,
    pharmacy_id: null,
    operation_unit_id: null,
    is_default: !hasDefaultAssignment && index === 0,
    is_active: true,
    granted_by: params.actor.id,
    granted_at: now,
    created_at: now,
    updated_at: now,
  }))

  const insertResponse = await supabase.from('user_role_assignments').insert(payload as never)
  if (insertResponse.error) {
    return { ok: false as const, status: 500, error: 'role_assignment_create_failed', details: insertResponse.error.message }
  }

  await writeRequiredAuditLog({
    user: params.actor as never,
    action: 'account_role_assignment_added',
    targetType: 'user',
    targetId: targetUser.id,
    details: buildAccountAuditDetails({
      actorRole,
      actorScope,
      target: {
        userId: targetUser.id,
        email: targetUser.email,
        role: params.targetRole,
      },
      changes: {
        added_region_ids: regionIdsToAdd,
        added_region_names: regions.filter((region) => regionIdsToAdd.includes(region.id)).map((region) => region.name),
      },
    }),
  })

  return {
    ok: true as const,
    status: 200,
    data: {
      userId: targetUser.id,
      email: targetUser.email,
      addedRegionIds: regionIdsToAdd,
    },
  }
}

export async function setManagedUserStatus(params: {
  actor: RoleAwareUser & { id: string; organization_id: string; email: string; full_name: string }
  userId: string
  nextStatus: 'active' | 'suspended'
}) {
  const actorRole = getCurrentActorRole(params.actor)
  const actorScope = getCurrentScope(params.actor)
  const supabase = createServerSupabaseClient()

  const userResponse = await supabase
    .from('users')
    .select('id, email, role, status, region_id, pharmacy_id')
    .eq('id', params.userId)
    .eq('organization_id', params.actor.organization_id)
    .maybeSingle()

  const targetUser = userResponse.data as {
    id: string
    email: string
    role: UserRole
    status: string
    region_id: string | null
    pharmacy_id: string | null
  } | null

  if (userResponse.error) {
    return { ok: false as const, status: 500, error: 'user_lookup_failed', details: userResponse.error.message }
  }
  if (!targetUser) {
    return { ok: false as const, status: 404, error: 'user_not_found' }
  }
  if (!canManageTargetRole(actorRole, targetUser.role)) {
    return { ok: false as const, status: 403, error: 'forbidden_target_role' }
  }
  if (actorRole === 'regional_admin' && actorScope.regionId !== targetUser.region_id) {
    return { ok: false as const, status: 403, error: 'forbidden_scope' }
  }
  if (actorRole === 'pharmacy_admin' && actorScope.pharmacyId !== targetUser.pharmacy_id) {
    return { ok: false as const, status: 403, error: 'forbidden_scope' }
  }
  if (targetUser.status === params.nextStatus) {
    return { ok: true as const, status: 200, data: { userId: targetUser.id, email: targetUser.email, status: targetUser.status, alreadyApplied: true } }
  }

  const now = new Date().toISOString()
  const updateResponse = await supabase
    .from('users')
    .update({
      status: params.nextStatus,
      is_active: params.nextStatus === 'active',
      updated_at: now,
    } as never)
    .eq('id', targetUser.id)

  if (updateResponse.error) {
    return { ok: false as const, status: 500, error: 'user_status_update_failed', details: updateResponse.error.message }
  }

  const cognitoResult = params.nextStatus === 'active'
    ? await enableCognitoUserByEmail(targetUser.email)
    : await disableCognitoUserByEmail(targetUser.email)

  await writeRequiredAuditLog({
    user: params.actor as never,
    action: 'account_user_status_changed',
    targetType: 'user',
    targetId: targetUser.id,
    details: buildAccountAuditDetails({
      actorRole,
      actorScope,
      target: {
        userId: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
        regionId: targetUser.region_id,
        pharmacyId: targetUser.pharmacy_id,
      },
      changes: {
        status: params.nextStatus,
      },
      auth: {
        cognito_sync: cognitoResult.ok ? 'ok' : 'failed_or_skipped',
        cognito_error: cognitoResult.ok ? null : cognitoResult.error,
      },
    }),
  })

  return {
    ok: true as const,
    status: 200,
    data: {
      userId: targetUser.id,
      email: targetUser.email,
      status: params.nextStatus,
      cognitoSync: cognitoResult.ok ? 'ok' : 'failed_or_skipped',
      cognitoError: cognitoResult.ok ? null : cognitoResult.error,
    },
  }
}

export async function listAccountInvitations(params: {
  actor: RoleAwareUser & { organization_id: string }
}) {
  const actorRole = getCurrentActorRole(params.actor)
  const actorScope = getCurrentScope(params.actor)
  const supabase = createServerSupabaseClient()

  let query = supabase
    .from('account_invitations')
    .select('id, email, role, status, region_id, pharmacy_id, expires_at, last_sent_at, created_at, region:regions(name), pharmacy:pharmacies(name)')
    .eq('organization_id', params.actor.organization_id)
    .order('created_at', { ascending: false })

  if (actorRole === 'system_admin') {
    query = query.in('role', ['system_admin', 'regional_admin'])
  } else if (actorRole === 'regional_admin' && actorScope.regionId) {
    query = query
      .in('role', ['pharmacy_admin', 'night_pharmacist'])
      .eq('region_id', actorScope.regionId)
  } else if (actorRole === 'pharmacy_admin' && actorScope.pharmacyId) {
    query = query
      .in('role', ['pharmacy_staff'])
      .eq('pharmacy_id', actorScope.pharmacyId)
  } else {
    return { ok: false as const, status: 403, error: 'forbidden' }
  }

  const response = await query.limit(50)
  if (response.error) {
    return { ok: false as const, status: 500, error: 'invitation_list_failed', details: response.error.message }
  }

  return {
    ok: true as const,
    status: 200,
    data: {
      invitations: (response.data ?? []).map((item) => {
        const row = item as Record<string, unknown>
        return {
          id: String(row.id ?? ''),
          email: String(row.email ?? ''),
          role: row.role as UserRole,
          status: row.status as AccountInvitationStatus,
          region_id: (row.region_id as string | null) ?? null,
          pharmacy_id: (row.pharmacy_id as string | null) ?? null,
          expires_at: String(row.expires_at ?? ''),
          last_sent_at: (row.last_sent_at as string | null) ?? null,
          created_at: String(row.created_at ?? ''),
          region_name: typeof (row.region as { name?: unknown } | null)?.name === 'string' ? (row.region as { name: string }).name : null,
          pharmacy_name: typeof (row.pharmacy as { name?: unknown } | null)?.name === 'string' ? (row.pharmacy as { name: string }).name : null,
        }
      }),
    },
  }
}

export async function resendAccountInvitation(params: {
  actor: RoleAwareUser & { id: string; organization_id: string; email: string; full_name: string }
  request: Request
  invitationId: string
}) {
  const actorRole = getCurrentActorRole(params.actor)
  const actorScope = getCurrentScope(params.actor)
  const supabase = createServerSupabaseClient()

  const invitationResponse = await supabase
    .from('account_invitations')
    .select('id, invited_user_id, email, role, status, region_id, pharmacy_id, region:regions(name), pharmacy:pharmacies(name)')
    .eq('id', params.invitationId)
    .eq('organization_id', params.actor.organization_id)
    .maybeSingle()

  const invitation = invitationResponse.data as {
    id: string
    invited_user_id: string
    email: string
    role: UserRole
    status: AccountInvitationStatus
    region_id: string | null
    pharmacy_id: string | null
    region?: { name?: string | null } | null
    pharmacy?: { name?: string | null } | null
  } | null

  if (invitationResponse.error) {
    return { ok: false as const, status: 500, error: 'invitation_lookup_failed', details: invitationResponse.error.message }
  }
  if (!invitation) {
    return { ok: false as const, status: 404, error: 'invitation_not_found' }
  }
  if (!canManageTargetRole(actorRole, invitation.role)) {
    return { ok: false as const, status: 403, error: 'forbidden_target_role' }
  }
  if (actorRole === 'regional_admin' && actorScope.regionId !== invitation.region_id) {
    return { ok: false as const, status: 403, error: 'forbidden_scope' }
  }
  if (actorRole === 'pharmacy_admin' && actorScope.pharmacyId !== invitation.pharmacy_id) {
    return { ok: false as const, status: 403, error: 'forbidden_scope' }
  }
  if (!['pending', 'expired'].includes(invitation.status)) {
    return { ok: false as const, status: 400, error: 'invitation_not_resendable' }
  }

  const rawToken = createInvitationToken()
  const now = new Date().toISOString()
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()

  const updateResponse = await supabase
    .from('account_invitations')
    .update({
      token_hash: hashInvitationToken(rawToken),
      status: 'pending',
      expires_at: expiresAt,
      last_sent_at: now,
      updated_at: now,
      revoked_at: null,
    } as never)
    .eq('id', invitation.id)

  if (updateResponse.error) {
    return { ok: false as const, status: 500, error: 'invitation_resend_prepare_failed', details: updateResponse.error.message }
  }

  const acceptUrl = buildInvitationAcceptUrl(getInvitationBaseUrl(params.request), rawToken)
  let emailError: string | null = null
  let messageId: string | null = null

  try {
    const emailPayload = buildAccountInvitationEmail({
      to: invitation.email,
      fullName: invitation.email,
      role: invitation.role,
      regionName: invitation.region?.name ?? null,
      pharmacyName: invitation.pharmacy?.name ?? null,
      acceptUrl,
      expiresAt,
    })
    const emailResponse = await sendEmail({
      to: invitation.email,
      subject: emailPayload.subject,
      text: emailPayload.text,
      html: emailPayload.html,
    })
    messageId = emailResponse.MessageId ?? null

    await supabase
      .from('account_invitations')
      .update({ sent_at: now, last_sent_at: now, message_id: messageId, updated_at: now } as never)
      .eq('id', invitation.id)
  } catch (error) {
    emailError = error instanceof Error ? error.message : 'email_send_failed'
  }

  await writeRequiredAuditLog({
    user: params.actor as never,
    action: 'account_invitation_resent',
    targetType: 'invitation',
    targetId: invitation.id,
    details: buildAccountAuditDetails({
      actorRole,
      actorScope,
      target: {
        invitationId: invitation.id,
        userId: invitation.invited_user_id,
        email: invitation.email,
        role: invitation.role,
        regionId: invitation.region_id,
        pharmacyId: invitation.pharmacy_id,
      },
      delivery: {
        email_sent: emailError === null,
        message_id: messageId,
        email_error: emailError,
      },
    }),
  })

  return {
    ok: true as const,
    status: 200,
    data: { invitationId: invitation.id, email: invitation.email, messageId, emailError, acceptUrl },
  }
}

export async function revokeAccountInvitation(params: {
  actor: RoleAwareUser & { id: string; organization_id: string; email: string; full_name: string }
  invitationId: string
}) {
  const actorRole = getCurrentActorRole(params.actor)
  const actorScope = getCurrentScope(params.actor)
  const supabase = createServerSupabaseClient()

  const invitationResponse = await supabase
    .from('account_invitations')
    .select('id, invited_user_id, email, role, status, region_id, pharmacy_id')
    .eq('id', params.invitationId)
    .eq('organization_id', params.actor.organization_id)
    .maybeSingle()

  const invitation = invitationResponse.data as {
    id: string
    invited_user_id: string
    email: string
    role: UserRole
    status: AccountInvitationStatus
    region_id: string | null
    pharmacy_id: string | null
  } | null

  if (invitationResponse.error) {
    return { ok: false as const, status: 500, error: 'invitation_lookup_failed', details: invitationResponse.error.message }
  }
  if (!invitation) {
    return { ok: false as const, status: 404, error: 'invitation_not_found' }
  }
  if (!canManageTargetRole(actorRole, invitation.role)) {
    return { ok: false as const, status: 403, error: 'forbidden_target_role' }
  }
  if (actorRole === 'regional_admin' && actorScope.regionId !== invitation.region_id) {
    return { ok: false as const, status: 403, error: 'forbidden_scope' }
  }
  if (actorRole === 'pharmacy_admin' && actorScope.pharmacyId !== invitation.pharmacy_id) {
    return { ok: false as const, status: 403, error: 'forbidden_scope' }
  }
  if (invitation.status !== 'pending') {
    return { ok: false as const, status: 400, error: 'invitation_not_revokable' }
  }

  const now = new Date().toISOString()
  const revokeResponse = await supabase
    .from('account_invitations')
    .update({ status: 'revoked', revoked_at: now, updated_at: now } as never)
    .eq('id', invitation.id)

  if (revokeResponse.error) {
    return { ok: false as const, status: 500, error: 'invitation_revoke_failed', details: revokeResponse.error.message }
  }

  await writeRequiredAuditLog({
    user: params.actor as never,
    action: 'account_invitation_revoked',
    targetType: 'invitation',
    targetId: invitation.id,
    details: buildAccountAuditDetails({
      actorRole,
      actorScope,
      target: {
        invitationId: invitation.id,
        userId: invitation.invited_user_id,
        email: invitation.email,
        role: invitation.role,
        regionId: invitation.region_id,
        pharmacyId: invitation.pharmacy_id,
      },
    }),
  })

  return { ok: true as const, status: 200, data: { invitationId: invitation.id } }
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

  let pharmacyName: string | null = null
  if (normalized.pharmacyId) {
    const pharmacyResponse = await supabase
      .from('pharmacies')
      .select('id, name, region_id, organization_id')
      .eq('id', normalized.pharmacyId)
      .eq('organization_id', params.actor.organization_id)
      .maybeSingle()
    if (pharmacyResponse.error) {
      return { ok: false as const, status: 500, error: 'pharmacy_lookup_failed', details: pharmacyResponse.error.message }
    }
    const pharmacy = pharmacyResponse.data as { id: string; name: string | null; region_id: string | null; organization_id: string } | null
    if (!pharmacy) {
      return { ok: false as const, status: 404, error: 'pharmacy_not_found' }
    }
    if (normalized.regionId && pharmacy.region_id !== normalized.regionId) {
      return { ok: false as const, status: 400, error: 'pharmacy_region_mismatch' }
    }
    pharmacyName = pharmacy.name
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
    const emailPayload = buildAccountInvitationEmail({
      to: createdUser.email,
      fullName: createdUser.full_name,
      role: createdUser.role,
      regionName,
      pharmacyName,
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

  await writeRequiredAuditLog({
    user: params.actor as never,
    action: 'account_invitation_created',
    targetType: 'user',
    targetId: createdUser.id,
    details: buildAccountAuditDetails({
      actorRole,
      actorScope,
      target: {
        userId: createdUser.id,
        invitationId: createdInvitation.id,
        email: createdUser.email,
        role: createdUser.role,
        regionId: normalized.regionId,
        pharmacyId: normalized.pharmacyId,
      },
      changes: {
        full_name: createdUser.full_name,
        status: createdUser.status,
      },
      delivery: {
        email_sent: emailSent,
        message_id: messageId,
        email_error: emailError,
      },
      auth: {
        setup: 'cognito_signup_pending',
      },
    }),
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
