import config from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

import {
  OTP_REQUEST_SUCCESS_MESSAGE,
  buildOtpEmail,
  isValidEmail,
  normalizeEmail,
  requestOtp,
} from '@/lib/otp'

export async function POST(request: Request) {
  let body: { email?: unknown }
  try {
    body = (await request.json()) as { email?: unknown }
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
  }

  const rawEmail = typeof body.email === 'string' ? body.email : ''
  if (!rawEmail || !isValidEmail(normalizeEmail(rawEmail))) {
    return NextResponse.json({ message: 'A valid email is required' }, { status: 400 })
  }

  const payload = await getPayload({ config })
  const result = await requestOtp(payload, rawEmail)

  if (!result.ok) {
    return NextResponse.json(
      {
        message: `Please wait ${result.retryAfterSeconds}s before requesting another code.`,
        retryAfterSeconds: result.retryAfterSeconds,
      },
      { status: 429 },
    )
  }

  const email = normalizeEmail(rawEmail)
  const { subject, text, html } = buildOtpEmail(result.code)

  try {
    await payload.sendEmail({
      to: email,
      subject,
      text,
      html,
    })
  } catch (err) {
    payload.logger.error({ err, email }, 'Failed to send OTP email')
    // Still return a generic success message to avoid leaking delivery failures
    // that could enumerate addresses; log for operators.
    return NextResponse.json({ message: OTP_REQUEST_SUCCESS_MESSAGE })
  }

  return NextResponse.json({ message: OTP_REQUEST_SUCCESS_MESSAGE })
}
