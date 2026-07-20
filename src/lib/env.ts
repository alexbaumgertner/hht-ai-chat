import { z } from 'zod'

/**
 * Environment configuration, validated once at module load.
 * Keeping this in one place (with Zod) means misconfiguration fails fast and
 * every consumer gets a fully-typed, trustworthy config object.
 */
const envSchema = z.object({
  PAYLOAD_SECRET: z.string().min(1, 'PAYLOAD_SECRET is required'),
  DATABASE_URI: z.string().optional(),
  NEXT_PUBLIC_SERVER_URL: z.string().url().default('http://localhost:3000'),

  // AI provider (optional — falls back to the offline EchoProvider when absent).
  AI_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().url().default('https://api.openai.com/v1'),
  AI_MODEL: z.string().default('gpt-4o-mini'),

  // Optional dev/e2e seeding.
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(6).optional(),
})

const parsed = envSchema.safeParse({
  PAYLOAD_SECRET: process.env.PAYLOAD_SECRET ?? 'dev-secret-change-me',
  DATABASE_URI: process.env.DATABASE_URI,
  NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
  AI_API_KEY: process.env.AI_API_KEY,
  AI_BASE_URL: process.env.AI_BASE_URL,
  AI_MODEL: process.env.AI_MODEL,
  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL,
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD,
})

if (!parsed.success) {
  // Surface a readable error early rather than failing deep inside Payload.
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n')
  throw new Error(`Invalid environment configuration:\n${issues}`)
}

export const env = parsed.data

/** True when a real AI provider is configured; otherwise the app uses EchoProvider. */
export const hasAIProvider = Boolean(env.AI_API_KEY)

/** True when a Postgres/Neon connection string is provided (else local SQLite dev). */
export const usesPostgres = Boolean(env.DATABASE_URI && env.DATABASE_URI.startsWith('postgres'))
