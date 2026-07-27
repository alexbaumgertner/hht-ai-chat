import type { Payload } from 'payload'

import type { Prompt, User } from '@/payload-types'

export type PromptListItem = {
  id: number | string
  title: string
  isDefault: boolean
}

export type ResolvedPrompt = {
  promptId: number | string
  promptVersionId: string | null
  content: string
}

export class PromptAccessError extends Error {
  status: number

  constructor(message: string, status = 404) {
    super(message)
    this.name = 'PromptAccessError'
    this.status = status
  }
}

const DEFAULT_PROMPT_TITLE = 'HHT Education Assistant'

const FALLBACK_SYSTEM_PROMPT = `You are an educational assistant for patients with Hereditary Hemorrhagic Telangiectasia (HHT).

Rules:
- Provide general HHT education about symptoms, tests, treatments, and lifestyle.
- Do NOT give definitive medical diagnoses or replace professional clinical care.
- For emergencies (severe bleeding, chest pain, neurological symptoms, difficulty breathing), urge the patient to seek emergency care immediately.
- Be clear, compassionate, and evidence-oriented.
- Always remind users that this is educational information, not medical advice.`

/**
 * Ensure at least one public default prompt exists (seeded from AI Settings when possible).
 */
export async function ensureDefaultPrompt(payload: Payload): Promise<void> {
  const { totalDocs } = await payload.count({
    collection: 'prompts',
    overrideAccess: true,
  })
  if (totalDocs > 0) return

  let content = FALLBACK_SYSTEM_PROMPT
  try {
    const settings = await payload.findGlobal({
      slug: 'ai-settings',
      overrideAccess: true,
    })
    if (typeof settings.systemPrompt === 'string' && settings.systemPrompt.trim()) {
      content = settings.systemPrompt
    }
  } catch {
    // Global may not exist yet during first boot; use fallback.
  }

  await payload.create({
    collection: 'prompts',
    data: {
      title: DEFAULT_PROMPT_TITLE,
      content,
      visibility: 'public',
      status: 'active',
      isDefault: true,
    },
    overrideAccess: true,
  })
}

export async function listPromptsForUser(
  payload: Payload,
  user: Pick<User, 'id'>,
): Promise<PromptListItem[]> {
  await ensureDefaultPrompt(payload)

  const result = await payload.find({
    collection: 'prompts',
    where: {
      status: { equals: 'active' },
    },
    sort: '-isDefault',
    limit: 100,
    depth: 0,
    user,
    overrideAccess: false,
    select: {
      title: true,
      isDefault: true,
    },
  })

  return result.docs.map((doc) => ({
    id: doc.id,
    title: doc.title,
    isDefault: Boolean(doc.isDefault),
  }))
}

async function latestVersionId(
  payload: Payload,
  promptId: number | string,
): Promise<string | null> {
  try {
    const versions = await payload.findVersions({
      collection: 'prompts',
      where: {
        parent: { equals: promptId },
      },
      sort: '-updatedAt',
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const version = versions.docs[0]
    return version ? String(version.id) : null
  } catch {
    return null
  }
}

/**
 * Resolve a prompt the user is allowed to use for a new conversation.
 * Loads full content via overrideAccess after an access-checked existence check.
 */
export async function resolvePromptForCreate(
  payload: Payload,
  user: Pick<User, 'id'>,
  promptId?: string | number | null,
): Promise<ResolvedPrompt> {
  await ensureDefaultPrompt(payload)

  let accessibleId: number | string

  if (promptId != null && promptId !== '') {
    try {
      const accessible = await payload.findByID({
        collection: 'prompts',
        id: promptId,
        depth: 0,
        user,
        overrideAccess: false,
        select: {
          title: true,
          isDefault: true,
        },
      })
      accessibleId = accessible.id
    } catch {
      throw new PromptAccessError('Prompt not found')
    }
  } else {
    const defaults = await payload.find({
      collection: 'prompts',
      where: {
        and: [{ status: { equals: 'active' } }, { isDefault: { equals: true } }],
      },
      limit: 1,
      depth: 0,
      user,
      overrideAccess: false,
      select: {
        title: true,
        isDefault: true,
      },
    })

    if (defaults.docs[0]) {
      accessibleId = defaults.docs[0].id
    } else {
      const anyAccessible = await payload.find({
        collection: 'prompts',
        where: { status: { equals: 'active' } },
        limit: 1,
        depth: 0,
        user,
        overrideAccess: false,
        select: {
          title: true,
          isDefault: true,
        },
      })
      if (!anyAccessible.docs[0]) {
        throw new PromptAccessError('No prompts available', 503)
      }
      accessibleId = anyAccessible.docs[0].id
    }
  }

  const full = (await payload.findByID({
    collection: 'prompts',
    id: accessibleId,
    depth: 0,
    overrideAccess: true,
  })) as Prompt

  if (full.status !== 'active') {
    throw new PromptAccessError('Prompt not found')
  }

  const promptVersionId = await latestVersionId(payload, full.id)

  return {
    promptId: full.id,
    promptVersionId,
    content: full.content,
  }
}

/**
 * System prompt for an existing chat: snapshot first, then legacy AI Settings fallback.
 */
export async function resolveSystemPromptForChat(
  payload: Payload,
  chat: { systemPromptSnapshot?: string | null },
): Promise<string> {
  if (typeof chat.systemPromptSnapshot === 'string' && chat.systemPromptSnapshot.trim()) {
    return chat.systemPromptSnapshot
  }

  try {
    const settings = await payload.findGlobal({
      slug: 'ai-settings',
      overrideAccess: true,
    })
    if (typeof settings.systemPrompt === 'string' && settings.systemPrompt.trim()) {
      return settings.systemPrompt
    }
  } catch {
    // fall through
  }

  return FALLBACK_SYSTEM_PROMPT
}
