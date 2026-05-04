import crypto from 'node:crypto'

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

export function createInvitationToken() {
  return crypto.randomBytes(24).toString('base64url')
}

export function hashInvitationToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function getInvitationBaseUrl(request: Request) {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, '')

  const vercelUrl = process.env.VERCEL_URL?.trim()
  if (vercelUrl) {
    return vercelUrl.startsWith('http') ? vercelUrl.replace(/\/$/, '') : `https://${vercelUrl.replace(/\/$/, '')}`
  }

  return new URL(request.url).origin.replace(/\/$/, '')
}

export function buildInvitationAcceptUrl(baseUrl: string, token: string) {
  return `${baseUrl}/invitations/accept?token=${encodeURIComponent(token)}`
}

const invitationRoleLabel: Record<string, string> = {
  system_admin: 'システム管理者',
  regional_admin: 'リージョン管理者',
  pharmacy_admin: '薬局管理者',
  night_pharmacist: '夜間薬剤師',
  pharmacy_staff: '薬局スタッフ',
}

export function buildAccountInvitationEmail(input: {
  to: string
  fullName: string
  regionName?: string | null
  pharmacyName?: string | null
  role?: string | null
  acceptUrl: string
  expiresAt: string
}) {
  const roleLabel = invitationRoleLabel[input.role ?? 'regional_admin'] ?? '利用者'
  const scopeLines = [
    input.regionName ? `対象リージョン: ${input.regionName}` : null,
    input.pharmacyName ? `対象薬局: ${input.pharmacyName}` : null,
  ].filter((line): line is string => line !== null)
  const subject = `【マカセテ在宅】${roleLabel}アカウント招待`
  const text = [
    `${input.fullName} 様`,
    '',
    'マカセテ在宅への招待をお送りします。',
    `付与予定の立場: ${roleLabel}`,
    ...scopeLines,
    '',
    '以下のURLから招待内容をご確認ください。',
    input.acceptUrl,
    '',
    `有効期限: ${input.expiresAt}`,
    '',
    'このメールに心当たりがない場合は、開かずに管理者へ確認してください。',
  ].filter((line): line is string => line !== null).join('\n')

  const scopeHtml = [
    input.regionName ? `<br /><strong>対象リージョン:</strong> ${input.regionName}` : '',
    input.pharmacyName ? `<br /><strong>対象薬局:</strong> ${input.pharmacyName}` : '',
  ].join('')
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;color:#111;background:#f7f7f8;padding:24px;">
      <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
        <div style="background:#111827;color:#fff;padding:20px 24px;font-size:20px;font-weight:700;">マカセテ在宅 アカウント招待</div>
        <div style="padding:24px;">
          <p style="margin-top:0;">${input.fullName} 様</p>
          <p>マカセテ在宅への招待をお送りします。</p>
          <p><strong>付与予定の立場:</strong> ${roleLabel}${scopeHtml}</p>
          <div style="margin:24px 0;">
            <a href="${input.acceptUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;">招待内容を確認する</a>
          </div>
          <p style="word-break:break-all;font-size:14px;color:#4b5563;">ボタンが開けない場合は、以下のURLをブラウザに貼り付けてください。<br />${input.acceptUrl}</p>
          <div style="margin-top:20px;padding:14px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;font-size:14px;">
            <div><strong>有効期限:</strong> ${input.expiresAt}</div>
          </div>
          <p style="margin-top:24px;font-size:14px;color:#4b5563;">このメールに心当たりがない場合は、開かずに管理者へ確認してください。</p>
        </div>
      </div>
    </div>
  `

  return { subject, text, html }
}

export async function sendEmail(input: {
  to: string
  subject: string
  text: string
  html: string
}) {
  const region = process.env.AWS_REGION
  const from = process.env.SES_FROM_EMAIL
  if (!region) throw new Error('missing_env_AWS_REGION')
  if (!from) throw new Error('missing_env_SES_FROM_EMAIL')

  const client = new SESClient({
    region,
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  })

  const response = await client.send(
    new SendEmailCommand({
      Source: from,
      Destination: { ToAddresses: [input.to] },
      Message: {
        Subject: { Data: input.subject, Charset: 'UTF-8' },
        Body: {
          Text: { Data: input.text, Charset: 'UTF-8' },
          Html: { Data: input.html, Charset: 'UTF-8' },
        },
      },
    }),
  )

  return response
}
