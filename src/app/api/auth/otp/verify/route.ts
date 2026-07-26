import config from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

import { createUserSessionCookie, findOrCreatePatientByEmail } from '@/lib/otp-session'
import { isValidEmail, normalizeEmail, verifyOtp } from '@/lib/otp'

export async function POST(request: Request) {
  let body: { email?: unknown; code?: unknown }
  try {
    body = (await request.json()) as { email?: unknown; code?: unknown }
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
  }

  const rawEmail = typeof body.email === 'string' ? body.email : ''
  const code = typeof body.code === 'string' ? body.code : ''
  const email = normalizeEmail(rawEmail)

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ message: 'A valid email is required' }, { status: 400 })
  }
  if (!/^\d{6}$/.test(code.trim())) {
    return NextResponse.json({ message: 'Enter the 6-digit code from your email' }, { status: 400 })
  }

  const payload = await getPayload({ config })
  const otpResult = await verifyOtp(payload, email, code)

  if (!otpResult.ok) {
    const messages: Record<typeof otpResult.reason, string> = {
      invalid: 'That code is incorrect. Please try again.',
      expired: 'That code has expired. Request a new one.',
      too_many_attempts: 'Too many incorrect attempts. Request a new code.',
      not_found: 'No active code for that email. Request a new one.',
    }
    return NextResponse.json({ message: messages[otpResult.reason] }, { status: 401 })
  }

  const user = await findOrCreatePatientByEmail(payload, email)

  if (user.role === 'admin') {
    return NextResponse.json(
      { message: 'Admins sign in at /admin with email and password.' },
      { status: 403 },
    )
  }

  const cookie = await createUserSessionCookie(payload, user)

  return NextResponse.json(
    {
      message: 'Signed in',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        image: user.image,
      },
    },
    {
      status: 200,
      headers: {
        'Set-Cookie': cookie,
      },
    },
  )
}
