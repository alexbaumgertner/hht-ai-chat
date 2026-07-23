import { NextResponse } from 'next/server'

import { getAuthenticatedUser, requirePatient } from '@/lib/auth'
import { buildChatPdfBuffer } from '@/lib/pdf/chat-pdf'

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

  const pdf = await buildChatPdfBuffer({
    title: chat.title || `Chat ${chat.id}`,
    messages: messages.docs.map((m) => ({
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    })),
  })

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="chat-${id}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
