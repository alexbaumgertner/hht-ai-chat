import type { CollectionConfig } from 'payload'
import { isAdmin } from './Users'

export const Chats: CollectionConfig = {
  slug: 'chats',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'owner', 'updatedAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      if (user) return { owner: { equals: user.id } }
      return false
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      if (user) return { owner: { equals: user.id } }
      return false
    },
    delete: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      if (user) return { owner: { equals: user.id } }
      return false
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'New chat',
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: { readOnly: true },
    },
  ],
  hooks: {
    beforeChange: [
      ({ req, data, operation }) => {
        // Stamp ownership from the session on create; never trust client input.
        if (operation === 'create' && req.user && !data.owner) {
          return { ...data, owner: req.user.id }
        }
        return data
      },
    ],
  },
}
