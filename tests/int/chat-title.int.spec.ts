import { describe, expect, it } from 'vitest'

import {
  CHAT_TITLE_MAX_LENGTH,
  validateChatTitle,
} from '@/lib/chats/title'

describe('validateChatTitle', () => {
  it('accepts a trimmed title within max length', () => {
    const result = validateChatTitle('  My HHT notes  ')
    expect(result).toEqual({ ok: true, title: 'My HHT notes' })
  })

  it('rejects empty and whitespace-only titles', () => {
    expect(validateChatTitle('').ok).toBe(false)
    expect(validateChatTitle('   ').ok).toBe(false)
    expect(validateChatTitle(null).ok).toBe(false)
    expect(validateChatTitle(undefined).ok).toBe(false)
  })

  it('rejects titles longer than max after trim', () => {
    const tooLong = 'x'.repeat(CHAT_TITLE_MAX_LENGTH + 1)
    const result = validateChatTitle(tooLong)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/120/)
    }
  })

  it('accepts titles at max length', () => {
    const exact = 'x'.repeat(CHAT_TITLE_MAX_LENGTH)
    expect(validateChatTitle(exact)).toEqual({ ok: true, title: exact })
  })
})
