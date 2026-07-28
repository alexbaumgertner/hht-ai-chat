import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

import { isAdmin, isPatient } from '@/access'
import config from '@/payload.config'
import type { User } from '@/payload-types'

export async function getAuthenticatedUser(): Promise<{
  payload: Awaited<ReturnType<typeof getPayload>>
  user: User | null
}> {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })
  return { payload, user: (user as User | null) ?? null }
}

export function requirePatient(user: User | null): user is User {
  return Boolean(user && isPatient(user))
}

export function requireAdmin(user: User | null): user is User {
  return Boolean(user && isAdmin(user))
}
