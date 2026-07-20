import type { AIProvider, CompletionInput, CompletionResult } from './types'

const DISCLAIMER =
  'This is general information, not medical advice. Always consult your HHT specialist for decisions about your care.'

/**
 * A deterministic, offline provider used when no real AI backend is configured.
 * It keeps the entire chat flow working (and testable) with zero API keys, and
 * intentionally never fabricates clinical claims — it acknowledges the question
 * and points to the medical disclaimer.
 */
export class EchoProvider implements AIProvider {
  readonly id = 'echo'

  async complete(input: CompletionInput): Promise<CompletionResult> {
    const lastUser = [...input.messages].reverse().find((m) => m.role === 'user')
    const question = lastUser?.content?.trim() ?? ''

    const body = question
      ? `You asked: "${truncate(question, 400)}".\n\nI'm the HHT assistant running in offline demo mode, so I can't give a tailored answer yet. Once an AI provider is configured by an administrator, I'll help with questions about HHT symptoms, lifestyle and treatment options.`
      : "Hi! I'm the HHT assistant. Ask me anything about HHT symptoms, lifestyle or treatment options."

    const content = `${body}\n\n${DISCLAIMER}`

    return {
      content,
      usage: {
        promptTokens: estimateTokens(input.messages.map((m) => m.content).join(' ')),
        completionTokens: estimateTokens(content),
      },
    }
  }
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value
}

/** Rough token estimate (~4 chars/token) for usage accounting in the demo provider. */
function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4))
}
