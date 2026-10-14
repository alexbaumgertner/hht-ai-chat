import { NextResponse } from 'next/server'

import { checkMessageLimit } from '@/lib/ai/limits'
import { loadAiSettings } from '@/lib/ai/settings'
import { getAuthenticatedUser, requirePatient } from '@/lib/auth'
import { validateChatTitle } from '@/lib/chats/title'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const { payload, user } = await getAuthenticatedUser()

  if (!requirePatient(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let chat
  try {
    chat = await payload.findByID({
      collection: 'chats',
      id,
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

  const messages = await payload.find({
    collection: 'messages',
    where: { chat: { equals: chat.id } },
    sort: 'createdAt',
    limit: 500,
    depth: 0,
    overrideAccess: true,
  })

  const settings = await loadAiSettings(payload)
  const limitCheck = await checkMessageLimit(payload, user, settings)

  return NextResponse.json({
    chat: {
      id: chat.id,
      title: chat.title,
      status: chat.status,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    },
    messages: messages.docs.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    })),
    quota: {
      used: limitCheck.used,
      limit: limitCheck.limit,
      remaining: limitCheck.remaining,
    },
  })
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const { payload, user } = await getAuthenticatedUser()

  if (!requirePatient(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const titleInput =
    body && typeof body === 'object' && body !== null && 'title' in body
      ? (body as { title: unknown }).title
      : undefined

  const validated = validateChatTitle(titleInput)
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }

  let chat
  try {
    chat = await payload.findByID({
      collection: 'chats',
      id,
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

  try {
    const updated = await payload.update({
      collection: 'chats',
      id: chat.id,
      data: { title: validated.title },
      user,
      overrideAccess: false,
      depth: 0,
    })

    return NextResponse.json({
      chat: {
        id: updated.id,
        title: updated.title,
        status: updated.status,
        updatedAt: updated.updatedAt,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Could not update chat' }, { status: 500 })
  }
}
