import { describe, expect, it } from 'vitest'
import { buildContextMessages, type StoredMessage } from '@/lib/chat/context'

describe('buildContextMessages', () => {
  it('preserves chronological order', () => {
    const history: StoredMessage[] = [
      { role: 'user', content: 'first' },
      { role: 'assistant', content: 'second' },
      { role: 'user', content: 'third' },
    ]
    const result = buildContextMessages(history)
    expect(result.map((m) => m.content)).toEqual(['first', 'second', 'third'])
  })

  it('drops empty/whitespace messages', () => {
    const history: StoredMessage[] = [
      { role: 'user', content: '  ' },
      { role: 'user', content: 'real' },
    ]
    const result = buildContextMessages(history)
    expect(result).toHaveLength(1)
    expect(result[0].content).toBe('real')
  })

  it('keeps only the most recent messages within the char budget', () => {
    const history: StoredMessage[] = [
      { role: 'user', content: 'a'.repeat(100) },
      { role: 'assistant', content: 'b'.repeat(100) },
      { role: 'user', content: 'c'.repeat(100) },
    ]
    const result = buildContextMessages(history, { maxChars: 150 })
    // Only the newest message fits within 150 chars.
    expect(result).toHaveLength(1)
    expect(result[0].content.startsWith('c')).toBe(true)
  })

  it('always keeps at least the newest message even if it exceeds the budget', () => {
    const history: StoredMessage[] = [{ role: 'user', content: 'x'.repeat(500) }]
    const result = buildContextMessages(history, { maxChars: 10 })
    expect(result).toHaveLength(1)
  })
})
