import type { Access, CollectionConfig } from 'payload'

import { isAdmin } from '@/access'

type UserWithRole = {
  id: number | string
  role?: 'admin' | 'patient' | null
}

const messageViaChatOwnership: Access = async ({ req, id }) => {
  const u = req.user as UserWithRole | null
  if (!u) return false
  if (isAdmin(u)) return true

  // List/create path: constrain by related chat owner when possible
  if (!id) {
    return {
      'chat.user': { equals: u.id },
    }
  }

  const message = await req.payload.findByID({
    collection: 'messages',
    id,
    depth: 1,
    overrideAccess: true,
  })

  const chat = message.chat
  if (!chat) return false
  if (typeof chat === 'object' && 'user' in chat) {
    const owner = chat.user
    const ownerId = typeof owner === 'object' && owner !== null ? owner.id : owner
    return ownerId === u.id
  }

  const chatDoc = await req.payload.findByID({
    collection: 'chats',
    id: chat as string | number,
    depth: 0,
    overrideAccess: true,
  })

  const ownerId =
    typeof chatDoc.user === 'object' && chatDoc.user !== null
      ? chatDoc.user.id
      : chatDoc.user

  return ownerId === u.id
}

export const Messages: CollectionConfig = {
  slug: 'messages',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['chat', 'role', 'createdAt'],
  },
  access: {
    create: async ({ req, data }) => {
      const u = req.user as UserWithRole | null
      if (!u) return false
      if (isAdmin(u)) return true
      const chatId = data?.chat
      if (chatId == null) return false
      try {
        const chat = await req.payload.findByID({
          collection: 'chats',
          id: typeof chatId === 'object' ? chatId : chatId,
          depth: 0,
          overrideAccess: true,
        })
        const ownerId = typeof chat.user === 'object' ? chat.user.id : chat.user
        return ownerId === u.id
      } catch {
        return false
      }
    },
    read: messageViaChatOwnership,
    update: messageViaChatOwnership,
    delete: messageViaChatOwnership,
  },
  fields: [
    {
      name: 'chat',
      type: 'relationship',
      relationTo: 'chats',
      required: true,
      index: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      options: [
        { label: 'User', value: 'user' },
        { label: 'Assistant', value: 'assistant' },
        { label: 'System', value: 'system' },
      ],
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
    },
    {
      name: 'tokenCount',
      type: 'number',
      admin: {
        description: 'Optional token usage from the provider.',
      },
    },
  ],
  timestamps: true,
}
