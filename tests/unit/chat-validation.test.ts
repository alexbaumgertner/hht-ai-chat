import { describe, expect, it } from 'vitest'
import { loginSchema, sendMessageSchema } from '@/lib/validation/chat'

describe('sendMessageSchema', () => {
  it('accepts a valid message without a chatId', () => {
    const result = sendMessageSchema.safeParse({ content: 'What is HHT?' })
    expect(result.success).toBe(true)
  })

  it('accepts a chatId as string or number', () => {
    expect(sendMessageSchema.safeParse({ chatId: '5', content: 'hi' }).success).toBe(true)
    expect(sendMessageSchema.safeParse({ chatId: 5, content: 'hi' }).success).toBe(true)
  })

  it('trims and rejects empty content', () => {
    const result = sendMessageSchema.safeParse({ content: '   ' })
    expect(result.success).toBe(false)
  })

  it('rejects content over the max length', () => {
    const result = sendMessageSchema.safeParse({ content: 'x'.repeat(8001) })
    expect(result.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('accepts a valid email and password', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: 'secret123' })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid email', () => {
    expect(loginSchema.safeParse({ email: 'nope', password: 'secret123' }).success).toBe(false)
  })

  it('rejects a short password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '123' }).success).toBe(false)
  })
})
