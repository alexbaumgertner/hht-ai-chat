import { z } from 'zod'

/** Payload for POST /api/chat/send. */
export const sendMessageSchema = z.object({
  chatId: z.union([z.string(), z.number()]).optional(),
  content: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(8000, 'Message is too long (max 8000 characters)'),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>

/** Payload for the Phase 1 email + password login form. */
export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type LoginInput = z.infer<typeof loginSchema>
