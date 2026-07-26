import { createHash, randomInt, randomBytes, timingSafeEqual } from 'node:crypto'
import type { Payload } from 'payload'

import type { LoginOtp } from '@/payload-types'

export const OTP_LENGTH = 6
export const OTP_TTL_MS = 10 * 60 * 1000
export const OTP_MAX_ATTEMPTS = 5
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000

export const OTP_REQUEST_SUCCESS_MESSAGE =
  'If that email can receive mail, a code was sent. Check your inbox.'

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function generateOtpCode(): string {
  const max = 10 ** OTP_LENGTH
  return String(randomInt(0, max)).padStart(OTP_LENGTH, '0')
}

function otpPepper(): string {
  return process.env.PAYLOAD_SECRET || 'otp-dev-pepper'
}

export function hashOtpCode(code: string): string {
  return createHash('sha256').update(`${otpPepper()}:${code}`).digest('hex')
}

export function verifyOtpCode(code: string, codeHash: string): boolean {
  const computed = Buffer.from(hashOtpCode(code), 'utf8')
  const expected = Buffer.from(codeHash, 'utf8')
  if (computed.length !== expected.length) return false
  return timingSafeEqual(computed, expected)
}

export function generateRandomPassword(): string {
  return randomBytes(32).toString('base64url')
}

async function findOtpByEmail(payload: Payload, email: string): Promise<LoginOtp | null> {
  const result = await payload.find({
    collection: 'login-otps',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })
  return result.docs[0] ?? null
}

export type RequestOtpResult =
  | { ok: true; code: string }
  | { ok: false; reason: 'cooldown'; retryAfterSeconds: number }

/**
 * Store a new hashed OTP for the email (replacing any previous one).
 * Returns the plaintext code for sending, or a cooldown error.
 */
export async function requestOtp(
  payload: Payload,
  rawEmail: string,
): Promise<RequestOtpResult> {
  const email = normalizeEmail(rawEmail)
  const existing = await findOtpByEmail(payload, email)

  if (existing) {
    const updatedAt = new Date(existing.updatedAt).getTime()
    const elapsed = Date.now() - updatedAt
    if (elapsed < OTP_RESEND_COOLDOWN_MS) {
      return {
        ok: false,
        reason: 'cooldown',
        retryAfterSeconds: Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000),
      }
    }
  }

  const code = generateOtpCode()
  const codeHash = hashOtpCode(code)
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString()

  if (existing) {
    await payload.update({
      collection: 'login-otps',
      id: existing.id,
      data: {
        codeHash,
        expiresAt,
        attempts: 0,
      },
      overrideAccess: true,
    })
  } else {
    await payload.create({
      collection: 'login-otps',
      data: {
        email,
        codeHash,
        expiresAt,
        attempts: 0,
      },
      overrideAccess: true,
    })
  }

  return { ok: true, code }
}

export type VerifyOtpResult =
  | { ok: true }
  | {
      ok: false
      reason: 'invalid' | 'expired' | 'too_many_attempts' | 'not_found'
    }

/**
 * Validate a submitted OTP. On success the stored record is deleted.
 * On failure, attempt count is incremented (when a record exists).
 */
export async function verifyOtp(
  payload: Payload,
  rawEmail: string,
  code: string,
): Promise<VerifyOtpResult> {
  const email = normalizeEmail(rawEmail)
  const existing = await findOtpByEmail(payload, email)

  if (!existing) {
    return { ok: false, reason: 'not_found' }
  }

  if (existing.attempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false, reason: 'too_many_attempts' }
  }

  if (new Date(existing.expiresAt).getTime() <= Date.now()) {
    await payload.delete({
      collection: 'login-otps',
      id: existing.id,
      overrideAccess: true,
    })
    return { ok: false, reason: 'expired' }
  }

  if (!verifyOtpCode(code.trim(), existing.codeHash)) {
    const nextAttempts = existing.attempts + 1
    if (nextAttempts >= OTP_MAX_ATTEMPTS) {
      await payload.delete({
        collection: 'login-otps',
        id: existing.id,
        overrideAccess: true,
      })
      return { ok: false, reason: 'too_many_attempts' }
    }
    await payload.update({
      collection: 'login-otps',
      id: existing.id,
      data: { attempts: nextAttempts },
      overrideAccess: true,
    })
    return { ok: false, reason: 'invalid' }
  }

  await payload.delete({
    collection: 'login-otps',
    id: existing.id,
    overrideAccess: true,
  })

  return { ok: true }
}

export function buildOtpEmail(code: string): { subject: string; text: string; html: string } {
  const subject = 'Your HHT AI Chat sign-in code'
  const text = `Your one-time sign-in code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`
  const html = `
    <p>Your one-time sign-in code is:</p>
    <p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p>
    <p>It expires in 10 minutes. If you did not request this, you can ignore this email.</p>
  `.trim()
  return { subject, text, html }
}
