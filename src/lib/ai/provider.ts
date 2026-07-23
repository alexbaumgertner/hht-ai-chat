import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'

import type { ResolvedAiSettings } from './settings'

export type ChatHistoryMessage = {
  role: 'user' | 'assistant'
  content: string
}

export function createChatStream(options: {
  settings: ResolvedAiSettings
  messages: ChatHistoryMessage[]
  onFinish?: (text: string, usage?: { totalTokens?: number }) => Promise<void> | void
}) {
  const { settings, messages, onFinish } = options

  if (!settings.apiKey) {
    throw new Error('AI API key is not configured')
  }

  const openai = createOpenAI({
    apiKey: settings.apiKey,
  })

  return streamText({
    model: openai(settings.model),
    system: settings.systemPrompt,
    messages,
    onFinish: async ({ text, usage }) => {
      if (onFinish) {
        const totalTokens =
          usage?.totalTokens ??
          ((usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0) || undefined)
        await onFinish(text, { totalTokens })
      }
    },
  })
}
