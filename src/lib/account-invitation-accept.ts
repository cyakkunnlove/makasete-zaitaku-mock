import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

import { hashInvitationToken } from '@/lib/account-invitations'

export async function acceptInvitationByToken(params: {
  token: string
  cognitoSub: string
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

  if (invitationResponse.error) throw invitationResponse.error
  if (!invitation) return { ok: false as const, error: 'invitation_not_found' }
  if (invitation.status !== 'pending') return { ok: false as const, error: 'invitation_not_pending' }
  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    await supabase
      .from('account_invitations')
      .update({ status: 'expired', updated_at: new Date().toISOString() } as never)
      .eq('id', invitation.id)
    return { ok: false as const, error: 'invitation_expired' }
  }

  const now = new Date().toISOString()

  const userUpdate = await supabase
    .from('users')
    .update({
      cognito_sub: params.cognitoSub,
      status: 'active',
      last_login_at: now,
      last_reverified_at: now,
      updated_at: now,
    } as never)
    .eq('id', invitation.invited_user_id)

  if (userUpdate.error) throw userUpdate.error

  const invitationUpdate = await supabase
    .from('account_invitations')
    .update({
      status: 'accepted',
      accepted_at: now,
      updated_at: now,
    } as never)
    .eq('id', invitation.id)

  if (invitationUpdate.error) throw invitationUpdate.error

  return {
    ok: true as const,
    invitationId: invitation.id,
    invitedUserId: invitation.invited_user_id,
    email: invitation.email,
  }
}
