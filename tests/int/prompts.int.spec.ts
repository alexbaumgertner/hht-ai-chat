import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import {
  ensureDefaultPrompt,
  listPromptsForUser,
  resolvePromptForCreate,
  resolveSystemPromptForChat,
} from '@/lib/ai/prompts'
import config from '@/payload.config'
import type { User } from '@/payload-types'

let payload: Payload

const stamp = Date.now()

describe('Prompt library', () => {
  let patientA: User
  let patientB: User
  let publicPromptId: number | string
  let privateForAId: number | string
  let privateForBId: number | string

  beforeAll(async () => {
    payload = await getPayload({ config })

    await ensureDefaultPrompt(payload)

    patientA = await payload.create({
      collection: 'users',
      data: {
        email: `prompt-patient-a-${stamp}@example.com`,
        password: 'test-password-a',
        role: 'patient',
        messagesUsed: 0,
        limitPeriodStart: new Date().toISOString(),
      },
      overrideAccess: true,
    })

    patientB = await payload.create({
      collection: 'users',
      data: {
        email: `prompt-patient-b-${stamp}@example.com`,
        password: 'test-password-b',
        role: 'patient',
        messagesUsed: 0,
        limitPeriodStart: new Date().toISOString(),
      },
      overrideAccess: true,
    })

    const publicPrompt = await payload.create({
      collection: 'prompts',
      data: {
        title: `Public prompt ${stamp}`,
        content: `Public system prompt content ${stamp}`,
        visibility: 'public',
        status: 'active',
        isDefault: false,
      },
      overrideAccess: true,
    })
    publicPromptId = publicPrompt.id

    const privateA = await payload.create({
      collection: 'prompts',
      data: {
        title: `Private for A ${stamp}`,
        content: `Secret for A ${stamp}`,
        visibility: 'private',
        status: 'active',
        isDefault: false,
        assignedUsers: [patientA.id],
      },
      overrideAccess: true,
    })
    privateForAId = privateA.id

    const privateB = await payload.create({
      collection: 'prompts',
      data: {
        title: `Private for B ${stamp}`,
        content: `Secret for B ${stamp}`,
        visibility: 'private',
        status: 'active',
        isDefault: false,
        assignedUsers: [patientB.id],
      },
      overrideAccess: true,
    })
    privateForBId = privateB.id
  }, 60_000)

  it('lists public and assigned private prompts for a patient, hiding others', async () => {
    const list = await listPromptsForUser(payload, patientA)
    const ids = list.map((p) => String(p.id))

    expect(ids).toContain(String(publicPromptId))
    expect(ids).toContain(String(privateForAId))
    expect(ids).not.toContain(String(privateForBId))

    for (const item of list) {
      expect(item).toHaveProperty('title')
      expect(item).toHaveProperty('isDefault')
      expect(item).not.toHaveProperty('content')
      expect(item).not.toHaveProperty('assignedUsers')
    }
  })

  it('blocks findByID of another user private prompt under access control', async () => {
    await expect(
      payload.findByID({
        collection: 'prompts',
        id: privateForBId,
        user: patientA,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('does not expose content or assignees when a patient reads an accessible prompt', async () => {
    const doc = await payload.findByID({
      collection: 'prompts',
      id: privateForAId,
      user: patientA,
      overrideAccess: false,
    })

    expect(doc.title).toBeTruthy()
    expect((doc as { content?: string }).content).toBeUndefined()
    expect((doc as { assignedUsers?: unknown }).assignedUsers).toBeUndefined()
  })

  it('enforces a single default prompt', async () => {
    const first = await payload.create({
      collection: 'prompts',
      data: {
        title: `Default A ${stamp}`,
        content: 'default-a',
        visibility: 'public',
        status: 'active',
        isDefault: true,
      },
      overrideAccess: true,
    })

    const second = await payload.create({
      collection: 'prompts',
      data: {
        title: `Default B ${stamp}`,
        content: 'default-b',
        visibility: 'public',
        status: 'active',
        isDefault: true,
      },
      overrideAccess: true,
    })

    const refreshedFirst = await payload.findByID({
      collection: 'prompts',
      id: first.id,
      overrideAccess: true,
    })
    const refreshedSecond = await payload.findByID({
      collection: 'prompts',
      id: second.id,
      overrideAccess: true,
    })

    expect(refreshedFirst.isDefault).toBe(false)
    expect(refreshedSecond.isDefault).toBe(true)
  })

  it('snapshots prompt content onto a new chat and keeps it after prompt edits', async () => {
    const resolved = await resolvePromptForCreate(payload, patientA, publicPromptId)
    expect(resolved.content).toContain(`Public system prompt content ${stamp}`)

    const chat = await payload.create({
      collection: 'chats',
      data: {
        user: patientA.id,
        title: 'Snapshot chat',
        status: 'active',
        prompt: Number(resolved.promptId),
        promptVersionId: resolved.promptVersionId ?? undefined,
        systemPromptSnapshot: resolved.content,
      },
      overrideAccess: true,
    })

    await payload.update({
      collection: 'prompts',
      id: publicPromptId,
      data: {
        content: `UPDATED public content ${stamp}`,
        status: 'archived',
      },
      overrideAccess: true,
    })

    const systemPrompt = await resolveSystemPromptForChat(payload, chat)
    expect(systemPrompt).toBe(resolved.content)
    expect(systemPrompt).not.toContain('UPDATED')
  })

  it('rejects resolving a private prompt for an unassigned patient', async () => {
    await expect(resolvePromptForCreate(payload, patientA, privateForBId)).rejects.toMatchObject({
      name: 'PromptAccessError',
      status: 404,
    })
  })

  it('requires assignees for private prompts', async () => {
    await expect(
      payload.create({
        collection: 'prompts',
        data: {
          title: `Invalid private ${stamp}`,
          content: 'no assignees',
          visibility: 'private',
          status: 'active',
          isDefault: false,
          assignedUsers: [],
        },
        overrideAccess: true,
      }),
    ).rejects.toThrow(/assigned user/i)
  })

  it('auto-promotes another active public prompt when the default is archived', async () => {
    const defaultPrompt = await payload.create({
      collection: 'prompts',
      data: {
        title: `Default to archive ${stamp}`,
        content: 'default content',
        visibility: 'public',
        status: 'active',
        isDefault: true,
      },
      overrideAccess: true,
    })

    const backup = await payload.create({
      collection: 'prompts',
      data: {
        title: `Backup ${stamp}`,
        content: 'backup content',
        visibility: 'public',
        status: 'active',
        isDefault: false,
      },
      overrideAccess: true,
    })

    await payload.update({
      collection: 'prompts',
      id: defaultPrompt.id,
      data: { status: 'archived' },
      overrideAccess: true,
    })

    const refreshedBackup = await payload.findByID({
      collection: 'prompts',
      id: backup.id,
      overrideAccess: true,
    })

    expect(refreshedBackup.isDefault).toBe(true)
  })

  it('blocks deleting the only active prompt', async () => {
    const tag = `${stamp}-sole-active`
    const sole = await payload.create({
      collection: 'prompts',
      data: {
        title: `Sole active ${tag}`,
        content: 'sole',
        visibility: 'public',
        status: 'active',
        isDefault: false,
      },
      overrideAccess: true,
    })

    const others = await payload.find({
      collection: 'prompts',
      where: {
        and: [{ status: { equals: 'active' } }, { id: { not_equals: sole.id } }],
      },
      limit: 500,
      overrideAccess: true,
    })

    const archivedIds: (number | string)[] = []
    for (const doc of others.docs) {
      archivedIds.push(doc.id)
      await payload.update({
        collection: 'prompts',
        id: doc.id,
        data: { status: 'archived', isDefault: false },
        overrideAccess: true,
      })
    }

    try {
      await expect(
        payload.delete({ collection: 'prompts', id: sole.id, overrideAccess: true }),
      ).rejects.toThrow(/only active/i)
    } finally {
      for (const id of archivedIds) {
        await payload.update({
          collection: 'prompts',
          id,
          data: { status: 'active' },
          overrideAccess: true,
        })
      }
      await payload.delete({ collection: 'prompts', id: sole.id, overrideAccess: true }).catch(() => {})
    }
  })

  it('blocks deleting the only default active prompt', async () => {
    const tag = `${stamp}-sole-default`
    const defaultPrompt = await payload.create({
      collection: 'prompts',
      data: {
        title: `Sole default ${tag}`,
        content: 'default sole',
        visibility: 'public',
        status: 'active',
        isDefault: true,
      },
      overrideAccess: true,
    })

    const sibling = await payload.create({
      collection: 'prompts',
      data: {
        title: `Sibling active ${tag}`,
        content: 'sibling',
        visibility: 'public',
        status: 'active',
        isDefault: false,
      },
      overrideAccess: true,
    })

    try {
      await expect(
        payload.delete({ collection: 'prompts', id: defaultPrompt.id, overrideAccess: true }),
      ).rejects.toThrow(/only default/i)
    } finally {
      await payload.update({
        collection: 'prompts',
        id: defaultPrompt.id,
        data: { isDefault: false },
        overrideAccess: true,
      })
      await payload.delete({ collection: 'prompts', id: sibling.id, overrideAccess: true }).catch(() => {})
      await payload
        .delete({ collection: 'prompts', id: defaultPrompt.id, overrideAccess: true })
        .catch(() => {})
    }
  })
})
