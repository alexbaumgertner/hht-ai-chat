import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { validateChatTitle } from '@/lib/chats/title'
import config from '@/payload.config'
import type { User } from '@/payload-types'

let payload: Payload

const stamp = Date.now()

describe('Rename chat title (access)', () => {
  let userA: User
  let userB: User
  let chatAId: number

  beforeAll(async () => {
    payload = await getPayload({ config })

    userA = await payload.create({
      collection: 'users',
      data: {
        email: `rename-a-${stamp}@example.com`,
        password: 'test-password-a',
        role: 'patient',
        messagesUsed: 0,
        limitPeriodStart: new Date().toISOString(),
      },
      overrideAccess: true,
    })

    userB = await payload.create({
      collection: 'users',
      data: {
        email: `rename-b-${stamp}@example.com`,
        password: 'test-password-b',
        role: 'patient',
        messagesUsed: 0,
        limitPeriodStart: new Date().toISOString(),
      },
      overrideAccess: true,
    })

    const chat = await payload.create({
      collection: 'chats',
      data: {
        user: userA.id,
        title: 'Original title',
        status: 'active',
      },
      overrideAccess: true,
    })
    chatAId = chat.id
  })

  it('allows owner to update chat title via Local API', async () => {
    const validated = validateChatTitle('Renamed by owner')
    expect(validated.ok).toBe(true)
    if (!validated.ok) return

    const updated = await payload.update({
      collection: 'chats',
      id: chatAId,
      data: { title: validated.title },
      user: userA,
      overrideAccess: false,
    })

    expect(updated.title).toBe('Renamed by owner')
  })

  it('denies non-owner title update', async () => {
    await expect(
      payload.update({
        collection: 'chats',
        id: chatAId,
        data: { title: 'Hijacked title' },
        user: userB,
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    const still = await payload.findByID({
      collection: 'chats',
      id: chatAId,
      overrideAccess: true,
    })
    expect(still.title).toBe('Renamed by owner')
  })
})
