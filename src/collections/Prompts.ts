import type { Access, CollectionConfig, FieldAccess, Where } from 'payload'

import { adminOnly, isAdmin } from '@/access'

type UserWithRole = {
  id: number | string
  role?: 'admin' | 'patient' | null
}

const adminFieldOnly: FieldAccess = ({ req: { user } }) => isAdmin(user as UserWithRole)

const promptReadAccess: Access = ({ req: { user } }) => {
  const u = user as UserWithRole | null
  if (!u) return false
  if (isAdmin(u)) return true
  const query: Where = {
    and: [
      { status: { equals: 'active' } },
      {
        or: [
          { visibility: { equals: 'public' } },
          { assignedUsers: { contains: u.id } },
        ],
      },
    ],
  }
  return query
}

export const Prompts: CollectionConfig = {
  slug: 'prompts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'visibility', 'status', 'isDefault', 'updatedAt'],
    description:
      'System prompt templates for patient chat. Prefer Archive to retire prompts; Delete is permanent.',
    group: 'AI',
    listSearchableFields: ['title'],
  },
  versions: {
    maxPerDoc: 100,
  },
  access: {
    create: adminOnly,
    read: promptReadAccess,
    update: adminOnly,
    delete: adminOnly,
  },
  hooks: {
    beforeValidate: [
      ({ data, originalDoc, operation }) => {
        if (!data) return data

        const visibility =
          data.visibility ?? (operation === 'update' ? originalDoc?.visibility : undefined) ?? 'public'
        const status =
          data.status ?? (operation === 'update' ? originalDoc?.status : undefined) ?? 'active'

        if (visibility === 'public') {
          data.assignedUsers = []
        }

        if (status === 'archived') {
          data.isDefault = false
        }

        if (visibility === 'private') {
          const assignees =
            data.assignedUsers !== undefined
              ? data.assignedUsers
              : operation === 'update'
                ? originalDoc?.assignedUsers
                : []
          const count = Array.isArray(assignees) ? assignees.length : 0
          if (count === 0) {
            throw new Error('Private prompts require at least one assigned user.')
          }
        }

        if (data.isDefault && status === 'archived') {
          throw new Error('Archived prompts cannot be marked as default.')
        }

        return data
      },
    ],
    beforeChange: [
      async ({ data, req, operation, originalDoc, context }) => {
        if (!data || context?.skipDefaultClear) return data

        const status = data.status ?? originalDoc?.status ?? 'active'
        if (data.isDefault === true && status === 'archived') {
          data.isDefault = false
          return data
        }

        const wasActive = originalDoc?.status === 'active'
        const becomingArchived = data.status === 'archived' && wasActive
        const wasDefault = originalDoc?.isDefault === true

        if (becomingArchived && wasDefault) {
          data.isDefault = false

          const replacement = await req.payload.find({
            collection: 'prompts',
            where: {
              and: [
                { status: { equals: 'active' } },
                { visibility: { equals: 'public' } },
                ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : []),
              ],
            },
            limit: 1,
            depth: 0,
            req,
            overrideAccess: true,
          })

          if (replacement.docs[0]) {
            await req.payload.update({
              collection: 'prompts',
              id: replacement.docs[0].id,
              data: { isDefault: true },
              req,
              overrideAccess: true,
              context: { skipDefaultClear: true },
            })
          }
        }

        if (data.isDefault === true) {
          const existing = await req.payload.find({
            collection: 'prompts',
            where: {
              isDefault: { equals: true },
              ...(operation === 'update' && originalDoc?.id
                ? { id: { not_equals: originalDoc.id } }
                : {}),
            },
            limit: 100,
            depth: 0,
            req,
            overrideAccess: true,
          })

          for (const doc of existing.docs) {
            await req.payload.update({
              collection: 'prompts',
              id: doc.id,
              data: { isDefault: false },
              req,
              overrideAccess: true,
              context: { skipDefaultClear: true },
            })
          }
        }

        return data
      },
    ],
    beforeDelete: [
      async ({ req, id }) => {
        const doc = await req.payload.findByID({
          collection: 'prompts',
          id,
          depth: 0,
          overrideAccess: true,
        })

        if (doc.status === 'active') {
          const activeCount = await req.payload.count({
            collection: 'prompts',
            where: { status: { equals: 'active' } },
            overrideAccess: true,
          })

          if (activeCount.totalDocs <= 1) {
            throw new Error(
              'Cannot delete the only active prompt. Create or activate another prompt first.',
            )
          }
        }

        if (doc.isDefault && doc.status === 'active') {
          const otherDefaults = await req.payload.count({
            collection: 'prompts',
            where: {
              and: [
                { status: { equals: 'active' } },
                { isDefault: { equals: true } },
                { id: { not_equals: id } },
              ],
            },
            overrideAccess: true,
          })

          if (otherDefaults.totalDocs === 0) {
            throw new Error(
              'Cannot delete the only default active prompt. Set another prompt as default first.',
            )
          }
        }
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      access: {
        read: adminFieldOnly,
      },
      admin: {
        description: 'System prompt body sent to the model for new conversations that select this template.',
      },
    },
    {
      name: 'visibility',
      type: 'select',
      required: true,
      defaultValue: 'public',
      options: [
        { label: 'Public', value: 'public' },
        { label: 'Private', value: 'private' },
      ],
      index: true,
    },
    {
      name: 'assignedUsers',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      access: {
        read: adminFieldOnly,
      },
      admin: {
        condition: (_, siblingData) => siblingData?.visibility === 'private',
        description: 'Patients who may select this private prompt.',
      },
      filterOptions: {
        role: { equals: 'patient' },
      },
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
      index: true,
    },
    {
      name: 'isDefault',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'When set, new conversations use this prompt unless the patient chooses another.',
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
