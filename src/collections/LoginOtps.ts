import type { CollectionConfig } from 'payload'

/**
 * Short-lived hashed one-time passwords for email login.
 * Hidden from the admin UI; only the Local API / OTP routes touch these docs.
 */
export const LoginOtps: CollectionConfig = {
  slug: 'login-otps',
  admin: {
    hidden: true,
  },
  access: {
    create: () => false,
    read: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      index: true,
    },
    {
      name: 'codeHash',
      type: 'text',
      required: true,
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'attempts',
      type: 'number',
      required: true,
      defaultValue: 0,
    },
  ],
}
