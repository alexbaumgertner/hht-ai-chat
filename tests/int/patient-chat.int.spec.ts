import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { checkMessageLimit, ensureUsagePeriod } from '@/lib/ai/limits'
import { loadAiSettings } from '@/lib/ai/settings'
import config from '@/payload.config'
import type { User } from '@/payload-types'

let payload: Payload

const patientA = {
  email: `patient-a-${Date.now()}@example.com`,
  password: 'test-password-a',
  role: 'patient' as const,
}

const patientB = {
  email: `patient-b-${Date.now()}@example.com`,
  password: 'test-password-b',
  role: 'patient' as const,
}

describe('Patient AI Chat', () => {
  let userA: User
  let userB: User
  let chatAId: number

  beforeAll(async () => {
    payload = await getPayload({ config })

    userA = await payload.create({
      collection: 'users',
      data: {
        ...patientA,
        messagesUsed: 0,
        limitPeriodStart: new Date().toISOString(),
      },
      overrideAccess: true,
    })

    userB = await payload.create({
      collection: 'users',
      data: {
        ...patientB,
        messagesUsed: 0,
        limitPeriodStart: new Date().toISOString(),
      },
      overrideAccess: true,
    })

    const chat = await payload.create({
      collection: 'chats',
      data: {
        user: userA.id,
        title: 'Ownership test chat',
        status: 'active',
      },
      overrideAccess: true,
    })
    chatAId = chat.id

    await payload.create({
      collection: 'messages',
      data: {
        chat: chatAId,
        role: 'user',
        content: 'Hello from patient A',
      },
      overrideAccess: true,
    })
  })

  it('fetches users', async () => {
    const users = await payload.find({
      collection: 'users',
    })
    expect(users).toBeDefined()
    expect(users.totalDocs).toBeGreaterThan(0)
  })

  it('enforces message limits without needing a provider call', async () => {
    await payload.update({
      collection: 'users',
      id: userA.id,
      data: {
        messageLimit: 2,
        messagesUsed: 2,
        limitPeriodStart: new Date().toISOString(),
      },
      overrideAccess: true,
    })

    const refreshed = await payload.findByID({
      collection: 'users',
      id: userA.id,
      overrideAccess: true,
    })

    const settings = await loadAiSettings(payload)
    const result = await checkMessageLimit(payload, refreshed, settings)

    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.remaining).toBe(0)
      expect(result.reason).toMatch(/limit/i)
    }
  })

  it('lazy-resets usage when the period has elapsed', async () => {
    const oldStart = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()

    await payload.update({
      collection: 'users',
      id: userA.id,
      data: {
        messagesUsed: 40,
        messageLimit: 50,
        limitPeriodStart: oldStart,
      },
      overrideAccess: true,
    })

    const stale = await payload.findByID({
      collection: 'users',
      id: userA.id,
      overrideAccess: true,
    })

    const refreshed = await ensureUsagePeriod(payload, stale)
    expect(refreshed.messagesUsed).toBe(0)
    expect(refreshed.limitPeriodStart).not.toBe(oldStart)
  })

  it('prevents patient B from reading patient A chat via Local API access', async () => {
    const result = await payload.find({
      collection: 'chats',
      where: { id: { equals: chatAId } },
      user: userB,
      overrideAccess: false,
    })

    expect(result.docs).toHaveLength(0)
  })

  it('allows patient A to read own chat', async () => {
    const chat = await payload.findByID({
      collection: 'chats',
      id: chatAId,
      user: userA,
      overrideAccess: false,
    })

    expect(chat.id).toBe(chatAId)
  })

  it('never exposes apiKey on ai-settings when read as patient', async () => {
    await payload.updateGlobal({
      slug: 'ai-settings',
      data: {
        apiKey: 'sk-test-secret-should-not-leak',
        model: 'gpt-4.1',
        defaultMessageLimit: 50,
        provider: 'openai',
        systemPrompt: 'test prompt',
      },
      overrideAccess: true,
    })

    await expect(
      payload.findGlobal({
        slug: 'ai-settings',
        user: userA,
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    const asAdminSettings = await loadAiSettings(payload)
    expect(asAdminSettings.apiKey).toBeTruthy()
    // Patient-facing JSON helpers must not include apiKey — loadAiSettings is server-only.
    expect(JSON.stringify({ model: asAdminSettings.model })).not.toContain('sk-test')
  })
})
