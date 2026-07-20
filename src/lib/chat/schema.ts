import { z } from 'zod'

const uiMessageSchema = z
  .object({
    id: z.string().min(1),
    role: z.enum(['system', 'user', 'assistant']),
    parts: z.array(z.unknown()).min(1),
  })
  .loose()

export const chatRequestSchema = z.object({
  messages: z.array(uiMessageSchema).min(1).max(50),
})

export const chatMessageSchema = z.string().trim().min(1).max(4_000)

export type ChatRequest = z.infer<typeof chatRequestSchema>
