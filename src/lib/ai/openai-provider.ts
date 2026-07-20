import type { AIProvider, CompletionInput, CompletionResult } from './types'

export interface OpenAICompatibleOptions {
  apiKey: string
  baseUrl: string
  model: string
}

interface OpenAIChatResponse {
  choices?: Array<{ message?: { content?: string } }>
  usage?: { prompt_tokens?: number; completion_tokens?: number }
}

/**
 * Talks to any OpenAI Chat Completions-compatible endpoint (OpenAI, Vercel AI
 * Gateway, Yandex GPT proxies, etc.). This single implementation covers the
 * "different tools" requirement — a tool is just a (baseUrl, apiKey, model) triple.
 */
export class OpenAICompatibleProvider implements AIProvider {
  readonly id: string
  private readonly options: OpenAICompatibleOptions

  constructor(options: OpenAICompatibleOptions, id = 'openai-compatible') {
    this.options = options
    this.id = id
  }

  async complete(input: CompletionInput): Promise<CompletionResult> {
    const messages = input.system
      ? [{ role: 'system' as const, content: input.system }, ...input.messages]
      : input.messages

    const res = await fetch(`${this.options.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.options.apiKey}`,
      },
      body: JSON.stringify({
        model: this.options.model,
        messages,
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`AI provider request failed (${res.status}): ${detail.slice(0, 500)}`)
    }

    const data = (await res.json()) as OpenAIChatResponse
    const content = data.choices?.[0]?.message?.content?.trim()

    if (!content) {
      throw new Error('AI provider returned an empty response')
    }

    return {
      content,
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
      },
    }
  }
}
