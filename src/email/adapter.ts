import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { resendAdapter } from '@payloadcms/email-resend'
import type { PayloadEmailAdapter } from 'payload'

const defaultFromName = process.env.EMAIL_FROM_NAME || 'HHT AI Chat'

/**
 * Pick an email adapter from env:
 * - RESEND_API_KEY → Resend (preferred on Vercel)
 * - SMTP_HOST → Nodemailer SMTP (SendGrid, Mailgun, Gmail, etc.)
 * - otherwise → Ethereal catch-all for local development
 */
export function getEmailAdapter(): PayloadEmailAdapter | Promise<PayloadEmailAdapter> {
  if (process.env.RESEND_API_KEY) {
    const fromAddress = process.env.EMAIL_FROM_ADDRESS?.trim()
    if (!fromAddress) {
      throw new Error(
        'EMAIL_FROM_ADDRESS is required when RESEND_API_KEY is set. Use a verified domain address or onboarding@resend.dev for local testing.',
      )
    }

    return resendAdapter({
      apiKey: process.env.RESEND_API_KEY,
      defaultFromAddress: fromAddress,
      defaultFromName,
    })
  }

  const defaultFromAddress = process.env.EMAIL_FROM_ADDRESS || 'noreply@localhost'

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
