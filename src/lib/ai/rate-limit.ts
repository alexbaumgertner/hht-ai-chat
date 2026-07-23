/**
 * Simple per-user in-memory rate limit for /api/chat (defense in depth).
 * Resets on process restart — acceptable for v1 single-instance / Fluid Compute.
 */

type Bucket = { count: number; windowStart: number }

const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 20

const buckets = new Map<string, Bucket>()

export function checkRateLimit(userId: string | number): {
  allowed: boolean
  retryAfterSec?: number
} {
  const key = String(userId)
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now })
    return { allowed: true }
  }

  if (bucket.count >= MAX_PER_WINDOW) {
    const retryAfterSec = Math.ceil((WINDOW_MS - (now - bucket.windowStart)) / 1000)
    return { allowed: false, retryAfterSec }
  }

  bucket.count += 1
  return { allowed: true }
}
