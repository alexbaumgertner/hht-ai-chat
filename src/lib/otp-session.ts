import {
  getFieldsToSign,
  jwtSign,
  type Payload,
  type PayloadRequest,
} from 'payload'
import { addSessionToUser, generatePayloadCookie } from 'payload/shared'

import { generateRandomPassword, normalizeEmail } from '@/lib/otp'
import type { User } from '@/payload-types'

/**
 * Find an existing user by email or create a patient with a random password
 * (password is unused for OTP login; admins still use /admin password).
 */
export async function findOrCreatePatientByEmail(
  payload: Payload,
  rawEmail: string,
): Promise<User> {
  const email = normalizeEmail(rawEmail)
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.docs[0]) {
    return existing.docs[0] as User
  }

  const created = (await payload.create({
    collection: 'users',
    data: {
      email,
      password: generateRandomPassword(),
      role: 'patient',
      messagesUsed: 0,
      limitPeriodStart: new Date().toISOString(),
    },
    overrideAccess: true,
    // Prevent the Users beforeChange hook from promoting the first OTP user to admin.
    context: { otpPatientSignup: true },
  })) as User

  if (created.role === 'patient') {
    return created
  }

  return (await payload.update({
    collection: 'users',
    id: created.id,
    data: { role: 'patient' },
    overrideAccess: true,
  })) as User
}

/**
 * Mint a Payload local-JWT session cookie for the given user.
 */
export async function createUserSessionCookie(
  payload: Payload,
  user: User,
): Promise<string> {
  const collectionConfig = payload.collections.users.config
  const req = { payload, context: {} } as PayloadRequest

  const session = await addSessionToUser({
    collectionConfig,
    payload,
    req,
    user,
  })

  const fieldsToSign = getFieldsToSign({
    collectionConfig,
    email: user.email,
    user,
    sid: session.sid,
  })

  const { token } = await jwtSign({
    fieldsToSign,
    secret: payload.secret,
    tokenExpiration: collectionConfig.auth.tokenExpiration,
  })

  const cookie = generatePayloadCookie({
    collectionAuthConfig: collectionConfig.auth,
    cookiePrefix: payload.config.cookiePrefix,
    token,
  })

  return typeof cookie === 'string' ? cookie : ''
}
