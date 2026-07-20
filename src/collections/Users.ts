import type { CollectionConfig } from 'payload'

/**
 * Whether the currently-authenticated user has the admin role.
 * Used across collections for access control.
 */
export const isAdmin = (user: unknown): boolean => {
  if (!user || typeof user !== 'object') return false
  const roles = (user as { roles?: unknown }).roles
  return Array.isArray(roles) && roles.includes('admin')
}

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'roles'],
  },
  access: {
    // Anyone authenticated can read their own record; admins read all.
    read: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      if (user) return { id: { equals: user.id } }
      return false
    },
    // Only admins manage the roles/limits of other users.
    create: ({ req: { user } }) => isAdmin(user),
    delete: ({ req: { user } }) => isAdmin(user),
    update: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      if (user) return { id: { equals: user.id } }
      return false
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      defaultValue: ['patient'],
      options: [
        { label: 'Patient', value: 'patient' },
        { label: 'Admin', value: 'admin' },
      ],
      access: {
        // Only admins can change roles; patients cannot self-promote.
        update: ({ req: { user } }) => isAdmin(user),
      },
    },
    {
      name: 'aiLimits',
      type: 'group',
      label: 'AI usage limits',
      admin: {
        description: 'Per-user AI limits. Enforcement lands in Phase 4.',
      },
      access: {
        update: ({ req: { user } }) => isAdmin(user),
      },
      fields: [
        {
          name: 'monthlyRequestLimit',
          type: 'number',
          defaultValue: 200,
          min: 0,
        },
        {
          name: 'monthlyTokenLimit',
          type: 'number',
          defaultValue: 200_000,
          min: 0,
        },
        {
          name: 'requestsUsedThisPeriod',
          type: 'number',
          defaultValue: 0,
          min: 0,
          admin: { readOnly: true },
        },
        {
          name: 'tokensUsedThisPeriod',
          type: 'number',
          defaultValue: 0,
          min: 0,
          admin: { readOnly: true },
        },
        {
          name: 'periodStartedAt',
          type: 'date',
          admin: { readOnly: true },
        },
      ],
    },
  ],
}
