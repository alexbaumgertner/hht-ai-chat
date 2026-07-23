import type { Payload } from 'payload'

import type { User } from '@/payload-types'

import { getEffectiveLimit, type ResolvedAiSettings } from './settings'

const MS_PER_MONTH = 30 * 24 * 60 * 60 * 1000

function periodElapsed(limitPeriodStart: string | null | undefined, now: Date): boolean {
  if (!limitPeriodStart) return true
  const start = new Date(limitPeriodStart).getTime()
  if (Number.isNaN(start)) return true
  return now.getTime() >= start + MS_PER_MONTH
}

/**
 * Lazy monthly reset: if the usage period has elapsed, zero messagesUsed and bump period start.
 */
export async function ensureUsagePeriod(
  payload: Payload,
  user: User,
): Promise<User> {
  const now = new Date()
  if (!periodElapsed(user.limitPeriodStart, now)) {
    return user
  }

  const updated = await payload.update({
    collection: 'users',
    id: user.id,
    data: {
      messagesUsed: 0,
      limitPeriodStart: now.toISOString(),
    },
    overrideAccess: true,
  })

  return updated
}

export type LimitCheckResult =
  | { allowed: true; used: number; limit: number; remaining: number }
  | { allowed: false; used: number; limit: number; remaining: 0; reason: string }

export async function checkMessageLimit(
  payload: Payload,
  user: User,
  settings: ResolvedAiSettings,
): Promise<LimitCheckResult> {
  const refreshed = await ensureUsagePeriod(payload, user)
  const limit = getEffectiveLimit(refreshed, settings.defaultMessageLimit)
  const used = refreshed.messagesUsed ?? 0

  if (used >= limit) {
    return {
      allowed: false,
      used,
      limit,
      remaining: 0,
      reason: `Monthly message limit reached (${used}/${limit}).`,
    }
  }

  return {
    allowed: true,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  }
}

export async function incrementMessagesUsed(payload: Payload, userId: User['id']): Promise<void> {
  const user = await payload.findByID({
    collection: 'users',
    id: userId,
    overrideAccess: true,
  })

  await payload.update({
    collection: 'users',
    id: userId,
    data: {
      messagesUsed: (user.messagesUsed ?? 0) + 1,
    },
    overrideAccess: true,
  })
}

/** Batch reset for cron: users whose period has elapsed. */
export async function resetElapsedUsagePeriods(payload: Payload): Promise<number> {
  const now = new Date()
  const cutoff = new Date(now.getTime() - MS_PER_MONTH).toISOString()

  const { docs } = await payload.find({
    collection: 'users',
    where: {
      or: [
        { limitPeriodStart: { less_than_equal: cutoff } },
        { limitPeriodStart: { exists: false } },
      ],
    },
    limit: 500,
    overrideAccess: true,
  })

  let resetCount = 0
  for (const user of docs) {
    if (!periodElapsed(user.limitPeriodStart, now)) continue
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        messagesUsed: 0,
        limitPeriodStart: now.toISOString(),
      },
      overrideAccess: true,
    })
    resetCount += 1
  }

  return resetCount
}
