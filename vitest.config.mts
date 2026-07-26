import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: [
      // next-auth imports the extensionless "next/server", which Vite's ESM
      // resolver cannot map. next.config.ts solves the same problem for the
      // app build via webpack's extensionAlias.
      { find: /^next\/server$/, replacement: 'next/server.js' },
    ],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/int/**/*.int.spec.ts'],
    fileParallelism: false,
    server: {
      // Inlined so the next/server alias above is applied during transform
      // instead of next-auth being handed to Node's ESM resolver.
      deps: {
        inline: [/next-auth/, /payload-authjs/, /@auth\/core/],
      },
    },
  },
})
