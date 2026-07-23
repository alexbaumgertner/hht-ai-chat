import type { Access, CollectionConfig } from 'payload'

import { isAdmin } from '@/access'

type UserWithRole = {
  id: number | string
  role?: 'admin' | 'patient' | null
}

const chatOwnerAccess: Access = ({ req: { user } }) => {
  const u = user as UserWithRole | null
  if (!u) return false
  if (isAdmin(u)) return true
  return { user: { equals: u.id } }
}

export const Chats: CollectionConfig = {
  slug: 'chats',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'user', 'status', 'updatedAt'],
  },
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: chatOwnerAccess,
    update: chatOwnerAccess,
    delete: chatOwnerAccess,
  },
  hooks: {
    beforeValidate: [
      ({ data, req, operation }) => {
        if (operation === 'create' && req.user && data) {
          const u = req.user as UserWithRole
          if (!isAdmin(u)) {
            data.user = u.id
          }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'New chat',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'messages',
      type: 'join',
      collection: 'messages',
      on: 'chat',
      admin: {
        description: 'Messages in this chat (admin inspection).',
      },
    },
  ],
  timestamps: true,
}
