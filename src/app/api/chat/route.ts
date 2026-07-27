import { NextResponse } from 'next/server'

import { checkMessageLimit, incrementMessagesUsed } from '@/lib/ai/limits'
import {
  PromptAccessError,
  resolvePromptForCreate,
  resolveSystemPromptForChat,
} from '@/lib/ai/prompts'
import { createChatStream } from '@/lib/ai/provider'
import { checkRateLimit } from '@/lib/ai/rate-limit'
import { loadAiSettings } from '@/lib/ai/settings'
import { getAuthenticatedUser, requirePatient } from '@/lib/auth'
import type { Chat, Message } from '@/payload-types'

type ChatBody = {
  chatId?: string | number
  content?: string
  promptId?: string | number
}

function titleFromContent(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, ' ')
  if (trimmed.length <= 60) return trimmed || 'New chat'
  return `${trimmed.slice(0, 57)}...`
}

export async function POST(request: Request) {
  const { payload, user } = await getAuthenticatedUser()

  if (!requirePatient(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rate = checkRateLimit(user.id)
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait and try again.' },
      {
        status: 429,
        headers: rate.retryAfterSec
          ? { 'Retry-After': String(rate.retryAfterSec) }
          : undefined,
      },
    )
  }

  let body: ChatBody
  try {
    body = (await request.json()) as ChatBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const content = typeof body.content === 'string' ? body.content.trim() : ''
  if (!content) {
    return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
  }

  const settings = await loadAiSettings(payload)
  if (!settings.apiKey) {
    return NextResponse.json(
      { error: 'AI is not configured. Please contact an administrator.' },
      { status: 503 },
    )
  }

  const limitCheck = await checkMessageLimit(payload, user, settings)
  if (!limitCheck.allowed) {
    return NextResponse.json(
      {
        error: limitCheck.reason,
        used: limitCheck.used,
        limit: limitCheck.limit,
      },
      { status: 429 },
    )
  }

  let chat: Chat
  let systemPrompt: string

  if (body.chatId != null) {
    try {
      chat = await payload.findByID({
        collection: 'chats',
        id: body.chatId,
        depth: 0,
        user,
        overrideAccess: false,
      })
    } catch {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    const ownerId = typeof chat.user === 'object' ? chat.user.id : chat.user
    if (ownerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    systemPrompt = await resolveSystemPromptForChat(payload, chat)
  } else {
    let resolved
    try {
      resolved = await resolvePromptForCreate(payload, user, body.promptId)
    } catch (err) {
      if (err instanceof PromptAccessError) {
        return NextResponse.json({ error: err.message }, { status: err.status })
      }
      throw err
    }

    chat = await payload.create({
      collection: 'chats',
      data: {
        user: user.id,
        title: titleFromContent(content),
        status: 'active',
        prompt: Number(resolved.promptId),
        promptVersionId: resolved.promptVersionId ?? undefined,
        systemPromptSnapshot: resolved.content,
      },
      user,
      overrideAccess: false,
    })
    systemPrompt = resolved.content
  }

  await payload.create({
    collection: 'messages',
    data: {
      chat: chat.id,
      role: 'user',
      content,
    },
    overrideAccess: true,
  })

  const history = await payload.find({
    collection: 'messages',
    where: { chat: { equals: chat.id } },
    sort: 'createdAt',
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  const modelMessages = history.docs
    .filter((m: Message) => m.role === 'user' || m.role === 'assistant')
    .map((m: Message) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

  try {
    const result = createChatStream({
      settings,
      systemPrompt,
      messages: modelMessages,
      onFinish: async (text, usage) => {
        await payload.create({
          collection: 'messages',
          data: {
            chat: chat.id,
            role: 'assistant',
            content: text,
            tokenCount: usage?.totalTokens,
          },
          overrideAccess: true,
        })
        await incrementMessagesUsed(payload, user.id)
      },
    })

    const streamResponse = result.toTextStreamResponse({
      headers: {
        'X-Chat-Id': String(chat.id),
        'X-Messages-Used': String(limitCheck.used + 1),
        'X-Message-Limit': String(limitCheck.limit),
      },
    })

    return streamResponse
  } catch (error) {
    console.error('[api/chat] provider error', error)
    return NextResponse.json(
      { error: 'Unable to generate a response. Please try again later.' },
      { status: 502 },
    )
  }
}
