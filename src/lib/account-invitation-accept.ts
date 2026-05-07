import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

import { hashInvitationToken } from '@/lib/account-invitations'

export async function acceptInvitationByToken(params: {
  token: string
  cognitoSub: string
  email?: string | null
}) {
  const supabase = createServerSupabaseClient()
  const tokenHash = hashInvitationToken(params.token)

  const invitationResponse = await supabase
    .from('account_invitations')
    .select('id, invited_user_id, status, expires_at, email')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  const invitation = invitationResponse.data as {
    id: string
    invited_user_id: string
    status: string
    expires_at: string
    email: string
  } | null

  const normalizedEmail = params.email?.trim().toLowerCase() ?? null

  if (invitationResponse.error) throw invitationResponse.error
  if (!invitation) return { ok: false as const, error: 'invitation_not_found' }
  if (normalizedEmail && invitation.email.toLowerCase() !== normalizedEmail) {
    return { ok: false as const, error: 'invitation_email_mismatch' }
  }

  const invitedUserResponse = await supabase
    .from('users')
    .select('id, email, cognito_sub, is_active, status')
    .eq('id', invitation.invited_user_id)
    .maybeSingle()

  const invitedUser = invitedUserResponse.data as {
    id: string
    email: string
    cognito_sub: string | null
    is_active: boolean
    status: string
  } | null

  if (invitedUserResponse.error) throw invitedUserResponse.error
  if (!invitedUser) return { ok: false as const, error: 'invited_user_not_found' }
  if (normalizedEmail && invitedUser.email.toLowerCase() !== normalizedEmail) {
    return { ok: false as const, error: 'invited_user_email_mismatch' }
  }
  if (invitedUser.cognito_sub && invitedUser.cognito_sub !== params.cognitoSub) {
    return { ok: false as const, error: 'invited_user_cognito_mismatch' }
  }

  const now = new Date().toISOString()

  if (invitation.status === 'accepted') {
    if (!invitedUser.is_active || invitedUser.status !== 'active' || !invitedUser.cognito_sub) {
      const repairQuery = supabase
        .from('users')
        .update({
          cognito_sub: params.cognitoSub,
          is_active: true,
          status: 'active',
          last_login_at: now,
          last_reverified_at: now,
          updated_at: now,
        } as never)
        .eq('id', invitation.invited_user_id)

      const repairResponse = await (invitedUser.cognito_sub
        ? repairQuery.eq('cognito_sub', params.cognitoSub)
        : repairQuery.is('cognito_sub', null))
        .select('id')
        .maybeSingle()

      if (repairResponse.error) throw repairResponse.error
      if (!repairResponse.data) {
        return { ok: false as const, error: 'invited_user_link_conflict' }
      }
    }

    return {
      ok: true as const,
      invitationId: invitation.id,
      invitedUserId: invitation.invited_user_id,
      email: invitation.email,
      alreadyAccepted: true,
    }
  }

  if (invitation.status !== 'pending') return { ok: false as const, error: 'invitation_not_pending' }
  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    await supabase
      .from('account_invitations')
      .update({ status: 'expired', updated_at: now } as never)
      .eq('id', invitation.id)
    return { ok: false as const, error: 'invitation_expired' }
  }

  const userUpdateQuery = supabase
    .from('users')
    .update({
      cognito_sub: params.cognitoSub,
      is_active: true,
      status: 'active',
      last_login_at: now,
      last_reverified_at: now,
      updated_at: now,
    } as never)
    .eq('id', invitation.invited_user_id)

  const userUpdate = await (invitedUser.cognito_sub
    ? userUpdateQuery.eq('cognito_sub', params.cognitoSub)
    : userUpdateQuery.is('cognito_sub', null))
    .select('id')
    .maybeSingle()

  if (userUpdate.error) throw userUpdate.error
  if (!userUpdate.data) return { ok: false as const, error: 'invited_user_link_conflict' }

  const invitationUpdate = await supabase
    .from('account_invitations')
    .update({
      status: 'accepted',
      accepted_at: now,
      updated_at: now,
    } as never)
    .eq('id', invitation.id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()

  if (invitationUpdate.error) throw invitationUpdate.error
  if (!invitationUpdate.data) return { ok: false as const, error: 'invitation_accept_conflict' }

  return {
    ok: true as const,
    invitationId: invitation.id,
    invitedUserId: invitation.invited_user_id,
    email: invitation.email,
  }
}
