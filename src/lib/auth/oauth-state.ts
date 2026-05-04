export const OAUTH_STATE_COOKIE = 'oauth_state_nonce'

export type OAuthStateKind = 'login' | 'passkey_setup'

export type OAuthStatePayload = {
  kind: OAuthStateKind
  nextPath: string
  invitationToken?: string | null
  nonce: string
}

export function sanitizeInternalPath(value: string | null | undefined, fallback = '/dashboard') {
  if (!value) return fallback

  const candidate = value.trim()
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) {
    return fallback
  }

  return candidate
}

export function createOAuthState(payload: OAuthStatePayload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
}

export function parseOAuthState(value: string | null): Partial<OAuthStatePayload> | null {
  if (!value) return null

  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
    if (!parsed || typeof parsed !== 'object') return null

    return {
      kind: parsed.kind === 'passkey_setup' ? 'passkey_setup' : parsed.kind === 'login' ? 'login' : undefined,
      nextPath: typeof parsed.nextPath === 'string' ? sanitizeInternalPath(parsed.nextPath) : undefined,
      invitationToken: typeof parsed.invitationToken === 'string' && parsed.invitationToken ? parsed.invitationToken : null,
      nonce: typeof parsed.nonce === 'string' ? parsed.nonce : undefined,
    }
  } catch {
    return null
  }
}
