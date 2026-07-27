import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { authjsPlugin } from 'payload-authjs'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { authConfig } from './auth.config'
import { Chats } from './collections/Chats'
import { LoginOtps } from './collections/LoginOtps'
import { Media } from './collections/Media'
import { Messages } from './collections/Messages'
import { Prompts } from './collections/Prompts'
import { Users } from './collections/Users'
import { getEmailAdapter } from './email/adapter'
import { AiSettings } from './globals/AiSettings'
import { ensureDefaultPrompt } from './lib/ai/prompts'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Chats, Messages, LoginOtps, Prompts],
  globals: [AiSettings],
  editor: lexicalEditor(),
  email: getEmailAdapter(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [
    authjsPlugin({
      authjsConfig: authConfig,
      // Keep Payload's email/password login working alongside social login.
      enableLocalStrategy: true,
    }),
  ],
  onInit: async (payload) => {
    await ensureDefaultPrompt(payload)
  },
})
