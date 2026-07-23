import type { Payload } from 'payload'

import type { AiSetting, User } from '@/payload-types'

export type ResolvedAiSettings = {
  provider: AiSetting['provider']
  apiKey: string
  model: string
  defaultMessageLimit: number
  systemPrompt: string
}

/**
 * Load AI settings for server-side use only.
 * Never return apiKey to client responses.
 */
export async function loadAiSettings(payload: Payload): Promise<ResolvedAiSettings> {
  const settings = (await payload.findGlobal({
    slug: 'ai-settings',
    overrideAccess: true,
  })) as AiSetting

  const provider = settings.provider || 'openai'
  const apiKey =
    provider === 'gemini'
      ? process.env.GOOGLE_GENERATIVE_AI_API_KEY || settings.apiKey || ''
      : process.env.OPENAI_API_KEY || settings.apiKey || ''

  return {
    provider,
    apiKey,
    model: settings.model || 'gpt-4.1',
    defaultMessageLimit: settings.defaultMessageLimit ?? 50,
    systemPrompt: settings.systemPrompt || '',
  }
}

export function getEffectiveLimit(
  user: Pick<User, 'messageLimit'>,
  defaultMessageLimit: number,
): number {
  if (user.messageLimit != null && user.messageLimit > 0) {
    return user.messageLimit
  }
  return defaultMessageLimit
}
