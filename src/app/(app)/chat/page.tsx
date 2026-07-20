import { headers as nextHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { ChatClient, type ChatSummary, type UIMessage } from './ChatClient'

export const dynamic = 'force-dynamic'

export default async function ChatPage() {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await nextHeaders() })

  if (!user) {
    redirect('/login')
  }

  const chatsResult = await payload.find({
    collection: 'chats',
    where: { owner: { equals: user.id } },
    sort: '-updatedAt',
    limit: 100,
    depth: 0,
    user,
    overrideAccess: false,
  })

  const chats: ChatSummary[] = chatsResult.docs.map((c) => ({
    id: String(c.id),
    title: c.title ?? 'New chat',
  }))

  const activeChatId = chats[0]?.id ?? null
  let messages: UIMessage[] = []

  if (activeChatId) {
    const messagesResult = await payload.find({
      collection: 'messages',
      where: { chat: { equals: activeChatId } },
      sort: 'createdAt',
      limit: 200,
      depth: 0,
      user,
      overrideAccess: false,
    })
    messages = messagesResult.docs.map((m) => ({
      id: String(m.id),
      role: m.role as UIMessage['role'],
      content: m.content,
    }))
  }

  return (
    <ChatClient
      userName={user.name ?? user.email}
      initialChats={chats}
      initialActiveChatId={activeChatId}
      initialMessages={messages}
    />
  )
}
