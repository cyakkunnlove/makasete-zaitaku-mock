import {
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider'

function getClient() {
  const region = process.env.AWS_REGION
  if (!region) {
    return { ok: false as const, error: 'missing_aws_region' }
  }

  return {
    ok: true as const,
    client: new CognitoIdentityProviderClient({
      region,
      credentials:
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    }),
  }
}

function getUserPoolId() {
  return process.env.COGNITO_USER_POOL_ID?.trim() || null
}

export async function disableCognitoUserByEmail(email: string) {
  const userPoolId = getUserPoolId()
  if (!userPoolId) {
    return { ok: false as const, error: 'missing_cognito_user_pool_id' }
  }

  const clientResult = getClient()
  if (!clientResult.ok) return clientResult

  try {
    await clientResult.client.send(
      new AdminDisableUserCommand({
        UserPoolId: userPoolId,
        Username: email,
      }),
    )
    return { ok: true as const }
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : 'cognito_disable_failed',
    }
  }
}

export async function enableCognitoUserByEmail(email: string) {
  const userPoolId = getUserPoolId()
  if (!userPoolId) {
    return { ok: false as const, error: 'missing_cognito_user_pool_id' }
  }

  const clientResult = getClient()
  if (!clientResult.ok) return clientResult

  try {
    await clientResult.client.send(
      new AdminEnableUserCommand({
        UserPoolId: userPoolId,
        Username: email,
      }),
    )
    return { ok: true as const }
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : 'cognito_enable_failed',
    }
  }
}
