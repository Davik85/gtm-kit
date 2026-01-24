import 'server-only'
import nodemailer from 'nodemailer'

const EMAIL_SUBJECT = 'Your GTM plan is ready'

const parseBoolean = (value: string | undefined) => {
  if (!value) {
    return false
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

const getRequiredEnv = (key: string) => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`${key} is not set`)
  }
  return value
}

const buildResultUrl = ({
  baseUrl,
  orderId,
  accessToken,
}: {
  baseUrl: string
  orderId: string
  accessToken: string
}) => {
  const trimmed = baseUrl.replace(/\/+$/, '')
  return `${trimmed}/order/${orderId}/result?token=${encodeURIComponent(accessToken)}`
}

const buildEmailHtml = ({
  resultUrl,
}: {
  resultUrl: string
}) => {
  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${EMAIL_SUBJECT}</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
    <h1 style="font-size: 20px; margin-bottom: 16px;">Your GTM plan is ready</h1>
    <p>Thanks for your patience. Your GTM plan is ready to view.</p>
    <p style="margin: 24px 0;">
      <a
        href="${resultUrl}"
        style="background: #111; color: #fff; padding: 12px 20px; text-decoration: none; border-radius: 6px; display: inline-block;"
      >
        View your GTM plan
      </a>
    </p>
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p><a href="${resultUrl}">${resultUrl}</a></p>
  </body>
</html>`
}

const buildEmailText = ({
  resultUrl,
}: {
  resultUrl: string
}) => {
  return `Your GTM plan is ready.\n\nView your GTM plan: ${resultUrl}`
}

export type SendResultEmailInput = {
  to: string
  orderId: string
  accessToken: string
  replyTo?: string
}

export const sendResultEmail = async ({
  to,
  orderId,
  accessToken,
  replyTo,
}: SendResultEmailInput) => {
  const smtpHost = getRequiredEnv('SMTP_HOST')
  const smtpPort = Number(getRequiredEnv('SMTP_PORT'))
  const smtpSecure = parseBoolean(process.env.SMTP_SECURE)
  const smtpUser = getRequiredEnv('SMTP_USER')
  const smtpPass = getRequiredEnv('SMTP_PASS')
  const from = getRequiredEnv('EMAIL_FROM')
  const replyToAddress = replyTo ?? process.env.EMAIL_REPLY_TO
  const baseUrl = getRequiredEnv('APP_BASE_URL')

  if (!replyToAddress) {
    throw new Error('EMAIL_REPLY_TO is not set')
  }

  const resultUrl = buildResultUrl({ baseUrl, orderId, accessToken })

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  })

  await transporter.sendMail({
    from,
    to,
    replyTo: replyToAddress,
    subject: EMAIL_SUBJECT,
    html: buildEmailHtml({ resultUrl }),
    text: buildEmailText({ resultUrl }),
  })
}
