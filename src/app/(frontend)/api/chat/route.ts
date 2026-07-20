import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  validateUIMessages,
} from 'ai'

import { chatRequestSchema } from '@/lib/chat/schema'
import { HHT_ASSISTANT_SYSTEM_PROMPT } from '@/lib/chat/system-prompt'

export const maxDuration = 60

const DEFAULT_MODEL = 'openai/gpt-5.6-sol'

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null)
  const parsedRequest = chatRequestSchema.safeParse(body)

  if (!parsedRequest.success) {
    return Response.json({ error: 'Некорректный запрос чата.' }, { status: 400 })
  }

  try {
    const messages = await validateUIMessages({
      messages: parsedRequest.data.messages,
    })
    const prompt = await convertToModelMessages(messages)
    const result = streamText({
      model: process.env.AI_GATEWAY_MODEL ?? DEFAULT_MODEL,
      system: HHT_ASSISTANT_SYSTEM_PROMPT,
      prompt,
      maxOutputTokens: 1_000,
      providerOptions: {
        gateway: {
          tags: ['feature:hht-chat', 'stage:mvp'],
        },
      },
    })

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        originalMessages: messages,
        onError: () => 'Не удалось получить ответ. Попробуйте ещё раз.',
      }),
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return Response.json({ error: 'Некорректная история сообщений.' }, { status: 400 })
  }
}
