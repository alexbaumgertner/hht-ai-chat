import { describe, expect, it } from 'vitest'

import { chatMessageSchema, chatRequestSchema } from '@/lib/chat/schema'

describe('chat validation', () => {
  it('trims a valid user message', () => {
    expect(chatMessageSchema.parse('  Как снизить риск кровотечения?  ')).toBe(
      'Как снизить риск кровотечения?',
    )
  })

  it('rejects an empty user message', () => {
    expect(chatMessageSchema.safeParse('   ').success).toBe(false)
  })

  it('limits the conversation sent to the model', () => {
    const messages = Array.from({ length: 51 }, (_, index) => ({
      id: String(index),
      role: 'user',
      parts: [{ type: 'text', text: 'Вопрос' }],
    }))

    expect(chatRequestSchema.safeParse({ messages }).success).toBe(false)
  })
})
