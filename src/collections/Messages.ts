import type { CollectionConfig } from 'payload'
import { isAdmin } from './Users'

export const Messages: CollectionConfig = {
  slug: 'messages',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['chat', 'role', 'owner', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      if (user) return { owner: { equals: user.id } }
      return false
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => isAdmin(user),
    delete: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      if (user) return { owner: { equals: user.id } }
      return false
    },
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
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'user',
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
      name: 'meta',
      type: 'group',
      label: 'AI metadata',
      admin: {
        description: 'Provider/model and token usage for assistant messages (audit).',
      },
      fields: [
        { name: 'provider', type: 'text' },
        { name: 'model', type: 'text' },
        { name: 'promptTokens', type: 'number' },
        { name: 'completionTokens', type: 'number' },
      ],
    },
  ],
}
