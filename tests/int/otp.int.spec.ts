import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  OTP_MAX_ATTEMPTS,
  OTP_REQUEST_SUCCESS_MESSAGE,
  generateOtpCode,
  hashOtpCode,
  normalizeEmail,
  requestOtp,
  verifyOtp,
  verifyOtpCode,
} from '@/lib/otp'
import { findOrCreatePatientByEmail } from '@/lib/otp-session'
import config from '@/payload.config'

let payload: Payload

describe('OTP helpers', () => {
  it('generates a 6-digit numeric code', () => {
    const code = generateOtpCode()
    expect(code).toMatch(/^\d{6}$/)
  })

  it('hashes and verifies codes with timing-safe compare', () => {
    const code = '123456'
    const hash = hashOtpCode(code)
    expect(verifyOtpCode(code, hash)).toBe(true)
    expect(verifyOtpCode('000000', hash)).toBe(false)
  })

  it('normalizes email', () => {
    expect(normalizeEmail('  Pat@Example.COM ')).toBe('pat@example.com')
  })
})

describe('OTP request and verify', () => {
  const email = `otp-${Date.now()}@example.com`
  const patientEmail = `otp-patient-${Date.now()}@example.com`

  beforeAll(async () => {
    payload = await getPayload({ config })
  })

  afterAll(async () => {
    for (const address of [email, patientEmail]) {
      const leftover = await payload.find({
        collection: 'login-otps',
        where: { email: { equals: address } },
        limit: 10,
        overrideAccess: true,
      })
      for (const doc of leftover.docs) {
        await payload.delete({
          collection: 'login-otps',
          id: doc.id,
          overrideAccess: true,
        })
      }

      const users = await payload.find({
        collection: 'users',
        where: { email: { equals: address } },
        limit: 1,
        overrideAccess: true,
      })
      for (const doc of users.docs) {
        await payload.delete({
          collection: 'users',
          id: doc.id,
          overrideAccess: true,
        })
      }
    }
  })

  it('stores a hashed OTP and verifies a correct code', async () => {
    const requested = await requestOtp(payload, email)
    expect(requested.ok).toBe(true)
    if (!requested.ok) return

    const stored = await payload.find({
      collection: 'login-otps',
      where: { email: { equals: email } },
      limit: 1,
      overrideAccess: true,
    })
    expect(stored.docs).toHaveLength(1)
    expect(stored.docs[0]?.codeHash).toBe(hashOtpCode(requested.code))
    expect(stored.docs[0]?.codeHash).not.toBe(requested.code)

    const verified = await verifyOtp(payload, email, requested.code)
    expect(verified).toEqual({ ok: true })

    const after = await payload.find({
      collection: 'login-otps',
      where: { email: { equals: email } },
      limit: 1,
      overrideAccess: true,
    })
    expect(after.docs).toHaveLength(0)
  })

  it('rejects wrong codes and expires after max attempts', async () => {
    const requested = await requestOtp(payload, email)
    expect(requested.ok).toBe(true)

    for (let i = 0; i < OTP_MAX_ATTEMPTS - 1; i++) {
      const result = await verifyOtp(payload, email, '000000')
      expect(result).toEqual({ ok: false, reason: 'invalid' })
    }

    const last = await verifyOtp(payload, email, '000000')
    expect(last).toEqual({ ok: false, reason: 'too_many_attempts' })

    const after = await payload.find({
      collection: 'login-otps',
      where: { email: { equals: email } },
      limit: 1,
      overrideAccess: true,
    })
    expect(after.docs).toHaveLength(0)
  })

  it('rejects expired codes', async () => {
    await payload.create({
      collection: 'login-otps',
      data: {
        email,
        codeHash: hashOtpCode('654321'),
        expiresAt: new Date(Date.now() - 1000).toISOString(),
        attempts: 0,
      },
      overrideAccess: true,
    })

    const result = await verifyOtp(payload, email, '654321')
    expect(result).toEqual({ ok: false, reason: 'expired' })
  })

  it('enforces resend cooldown', async () => {
    const first = await requestOtp(payload, email)
    expect(first.ok).toBe(true)

    const second = await requestOtp(payload, email)
    expect(second.ok).toBe(false)
    if (second.ok) return
    expect(second.reason).toBe('cooldown')
    expect(second.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('auto-creates a patient user on first OTP login', async () => {
    const before = await payload.find({
      collection: 'users',
      where: { email: { equals: patientEmail } },
      limit: 1,
      overrideAccess: true,
    })
    expect(before.docs).toHaveLength(0)

    const created = await findOrCreatePatientByEmail(payload, patientEmail)
    expect(created.email).toBe(patientEmail)
    expect(created.role).toBe('patient')

    const again = await findOrCreatePatientByEmail(payload, patientEmail)
    expect(again.id).toBe(created.id)
  })

  it('exposes a generic request success message constant', () => {
    expect(OTP_REQUEST_SUCCESS_MESSAGE.toLowerCase()).toContain('code was sent')
  })
})
