import { NextResponse } from 'next/server'

import { hashInvitationToken } from '@/lib/account-invitations'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(_: Request, { params }: { params: { token: string } }) {
  const token = params.token?.trim()
  if (!token) return NextResponse.json({ ok: false, error: 'missing_token' }, { status: 400 })

  const tokenHash = hashInvitationToken(token)
  const supabase = createServerSupabaseClient()
  const response = await supabase
    .from('account_invitations')
    .select('id, email, role, status, expires_at, region_id, invited_user_id')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  const invitation = response.data as {
    id: string
    email: string
    role: string
    status: string
    expires_at: string
    region_id: string | null
    invited_user_id: string
  } | null

  if (response.error) {
    return NextResponse.json({ ok: false, error: 'invitation_lookup_failed', details: response.error.message }, { status: 500 })
  }
  if (!invitation) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  }

  const isExpired = new Date(invitation.expires_at).getTime() < Date.now()
  return NextResponse.json({
    ok: true,
    invitation: {
      email: invitation.email,
      role: invitation.role,
      status: isExpired && invitation.status === 'pending' ? 'expired' : invitation.status,
      expiresAt: invitation.expires_at,
      invitedUserId: invitation.invited_user_id,
    },
  })
}
