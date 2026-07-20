import { describe, expect, it } from 'vitest'
import { EchoProvider } from '@/lib/ai/echo-provider'

describe('EchoProvider', () => {
  const provider = new EchoProvider()

  it('has a stable id', () => {
    expect(provider.id).toBe('echo')
  })

  it('references the last user message and includes a disclaimer', async () => {
    const result = await provider.complete({
      messages: [
        { role: 'user', content: 'Tell me about nosebleeds' },
        { role: 'assistant', content: 'previous reply' },
        { role: 'user', content: 'What lifestyle changes help HHT?' },
      ],
    })

    expect(result.content).toContain('What lifestyle changes help HHT?')
    expect(result.content.toLowerCase()).toContain('not medical advice')
  })

  it('greets when there is no user message', async () => {
    const result = await provider.complete({ messages: [] })
    expect(result.content.toLowerCase()).toContain('hht assistant')
  })

  it('reports non-zero token usage', async () => {
    const result = await provider.complete({ messages: [{ role: 'user', content: 'hi' }] })
    expect(result.usage?.promptTokens).toBeGreaterThan(0)
    expect(result.usage?.completionTokens).toBeGreaterThan(0)
  })
})
