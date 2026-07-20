import type { ChatMessage, ChatRole } from '@/lib/ai/types'

export interface StoredMessage {
  role: ChatRole
  content: string
}

export interface BuildContextOptions {
  /** Approximate max characters of history to include (naive token budget). */
  maxChars?: number
}

const DEFAULT_MAX_CHARS = 12_000

/**
 * Build the ordered message list sent to the AI provider from stored history.
 *
 * Pure and dependency-free so it is trivially unit-testable. It keeps the most
 * recent messages within a character budget (a stand-in for a token budget) and
 * always preserves chronological order. This is the seam where cross-chat and
 * document-grounding context will later be injected.
 */
export function buildContextMessages(
  history: StoredMessage[],
  options: BuildContextOptions = {},
): ChatMessage[] {
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS

  const cleaned = history
    .filter((m) => m.content && m.content.trim().length > 0)
    .map((m) => ({ role: m.role, content: m.content.trim() }))

  const selected: ChatMessage[] = []
  let total = 0

  // Walk newest → oldest, accepting messages until the budget is exhausted.
  for (let i = cleaned.length - 1; i >= 0; i--) {
    const message = cleaned[i]
    const cost = message.content.length
    if (total + cost > maxChars && selected.length > 0) {
      break
    }
    selected.unshift(message)
    total += cost
  }

  return selected
}
