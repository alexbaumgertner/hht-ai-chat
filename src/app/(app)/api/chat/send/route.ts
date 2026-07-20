import { NextResponse } from 'next/server'
import { HHT_SYSTEM_PROMPT, resolveProvider } from '@/lib/ai'
import { buildContextMessages, type StoredMessage } from '@/lib/chat/context'
import { getPayloadClient } from '@/lib/payload'
import { sendMessageSchema } from '@/lib/validation/chat'

export async function POST(req: Request) {
  const payload = await getPayloadClient()

  const { user } = await payload.auth({ headers: req.headers })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = sendMessageSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { content } = parsed.data

  // Resolve or create the target chat, always scoped to the authenticated user.
  // IDs are numeric with the Postgres/SQLite adapters.
  let chatId: number
  if (parsed.data.chatId !== undefined) {
    chatId = Number(parsed.data.chatId)
    const chat = await payload
      .findByID({
        collection: 'chats',
        id: chatId,
        user,
        overrideAccess: false,
        depth: 0,
      })
      .catch(() => null)

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }
  } else {
    const created = await payload.create({
      collection: 'chats',
      data: {
        title: content.slice(0, 60) || 'New chat',
        owner: user.id,
      },
      user,
      overrideAccess: false,
    })
    chatId = created.id
  }

  // Persist the user's message.
  const userMessage = await payload.create({
    collection: 'messages',
    data: {
      chat: chatId,
      owner: user.id,
      role: 'user',
      content,
    },
    user,
    overrideAccess: false,
  })

  // Build conversation context from stored history (chronological).
  const history = await payload.find({
    collection: 'messages',
    where: { chat: { equals: chatId } },
    sort: 'createdAt',
    limit: 200,
    depth: 0,
    user,
    overrideAccess: false,
  })

  const contextMessages = buildContextMessages(
    history.docs.map((m) => ({ role: m.role, content: m.content }) as StoredMessage),
  )

  // Run the AI provider (Echo when no key is configured).
  const provider = resolveProvider()
  let assistantContent: string
  let usage: { promptTokens: number; completionTokens: number } | undefined
  try {
    const result = await provider.complete({
      system: HHT_SYSTEM_PROMPT,
      messages: contextMessages,
    })
    assistantContent = result.content
    usage = result.usage
  } catch (err) {
    payload.logger.error({ err }, 'AI provider failed')
    return NextResponse.json(
      { error: 'The assistant is temporarily unavailable. Please try again.' },
      { status: 502 },
    )
  }

  // Persist the assistant's reply with usage metadata for auditing.
  const assistantMessage = await payload.create({
    collection: 'messages',
    data: {
      chat: chatId,
      owner: user.id,
      role: 'assistant',
      content: assistantContent,
      meta: {
        provider: provider.id,
        model: process.env.AI_MODEL,
        promptTokens: usage?.promptTokens,
        completionTokens: usage?.completionTokens,
      },
    },
    user,
    overrideAccess: false,
  })

  return NextResponse.json({
    chatId,
    userMessage: { id: userMessage.id, role: 'user', content: userMessage.content },
    assistantMessage: {
      id: assistantMessage.id,
      role: 'assistant',
      content: assistantMessage.content,
    },
  })
}
