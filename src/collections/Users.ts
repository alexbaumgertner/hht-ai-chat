import type { CollectionConfig } from 'payload'

import { adminFieldOnly, adminOnly, adminOrSelf, anyoneCanCreateFirstUser } from '@/access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'messagesUsed', 'messageLimit'],
  },
  auth: true,
  access: {
    admin: ({ req: { user } }) => {
      // Allow first-user setup and admin panel for admins only
      if (!user) return true
      return (user as { role?: string }).role === 'admin'
    },
    create: anyoneCanCreateFirstUser,
    read: adminOrSelf,
    update: adminOrSelf,
    delete: adminOnly,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({ collection: 'users' })
          if (totalDocs === 0) {
            data.role = 'admin'
          }
          if (!data.limitPeriodStart) {
            data.limitPeriodStart = new Date().toISOString()
          }
          if (data.messagesUsed == null) {
            data.messagesUsed = 0
          }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'patient',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Patient', value: 'patient' },
      ],
      saveToJWT: true,
      access: {
        create: async ({ req }) => {
          const { totalDocs } = await req.payload.count({ collection: 'users' })
          if (totalDocs === 0) return true
          return (req.user as { role?: string } | null)?.role === 'admin'
        },
        update: adminFieldOnly,
      },
    },
    {
      name: 'messageLimit',
      type: 'number',
      admin: {
        description: 'Override monthly message limit. Leave empty to use global default.',
      },
      access: {
        update: adminFieldOnly,
      },
    },
    {
      name: 'messagesUsed',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Messages used in the current billing period.',
        readOnly: true,
      },
      access: {
        update: adminFieldOnly,
      },
    },
    {
      name: 'limitPeriodStart',
      type: 'date',
      admin: {
        description: 'Start of the current usage period (monthly reset).',
        date: { pickerAppearance: 'dayAndTime' },
      },
      access: {
        update: adminFieldOnly,
      },
    },
  ],
}
