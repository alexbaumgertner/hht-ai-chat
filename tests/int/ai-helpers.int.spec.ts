import { describe, expect, it } from 'vitest'

import { MEDICAL_DISCLAIMER } from '@/lib/ai/disclaimer'
import { getEffectiveLimit } from '@/lib/ai/settings'
import { checkRateLimit } from '@/lib/ai/rate-limit'

describe('AI helpers (unit)', () => {
  it('uses user messageLimit override when set', () => {
    expect(getEffectiveLimit({ messageLimit: 10 }, 50)).toBe(10)
    expect(getEffectiveLimit({ messageLimit: null }, 50)).toBe(50)
    expect(getEffectiveLimit({ messageLimit: undefined }, 25)).toBe(25)
  })

  it('exports a non-empty medical disclaimer', () => {
    expect(MEDICAL_DISCLAIMER.length).toBeGreaterThan(20)
    expect(MEDICAL_DISCLAIMER.toLowerCase()).toMatch(/not medical advice/)
  })

  it('rate-limits after max requests in a window', () => {
    const userId = `rate-test-${Date.now()}`
    for (let i = 0; i < 20; i++) {
      expect(checkRateLimit(userId).allowed).toBe(true)
    }
    expect(checkRateLimit(userId).allowed).toBe(false)
  })

  it('builds a PDF that includes the disclaimer', async () => {
    const { buildChatPdfBuffer } = await import('@/lib/pdf/chat-pdf')
    const pdf = await buildChatPdfBuffer({
      title: 'Test chat',
      messages: [
        { role: 'user', content: 'What is HHT?', createdAt: new Date().toISOString() },
        { role: 'assistant', content: 'HHT is a genetic condition.', createdAt: new Date().toISOString() },
      ],
    })
    expect(pdf.length).toBeGreaterThan(100)
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF')
  })
})
