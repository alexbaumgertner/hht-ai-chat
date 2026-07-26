import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { resendAdapter } from '@payloadcms/email-resend'
import type { PayloadEmailAdapter } from 'payload'

const defaultFromAddress = process.env.EMAIL_FROM_ADDRESS || 'noreply@localhost'
const defaultFromName = process.env.EMAIL_FROM_NAME || 'HHT AI Chat'

/**
 * Pick an email adapter from env:
 * - RESEND_API_KEY → Resend (preferred on Vercel)
 * - SMTP_HOST → Nodemailer SMTP (SendGrid, Mailgun, Gmail, etc.)
 * - otherwise → Ethereal catch-all for local development
 */
export function getEmailAdapter(): PayloadEmailAdapter | Promise<PayloadEmailAdapter> {
  if (process.env.RESEND_API_KEY) {
    return resendAdapter({
      apiKey: process.env.RESEND_API_KEY,
      defaultFromAddress,
      defaultFromName,
    })
  }

  if (process.env.SMTP_HOST) {
    return nodemailerAdapter({
      defaultFromAddress,
      defaultFromName,
      transportOptions: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
    })
  }

  // Ethereal.email — login URL is printed to the console on startup.
  return nodemailerAdapter({
    defaultFromAddress,
    defaultFromName,
  })
}
