import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.PORT ?? 3000)
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Runs the dev server, which auto-syncs the DB schema (Payload "push").
    // For production/Neon, schema is applied via migrations instead (see README).
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL ?? 'e2e@example.com',
      SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD ?? 'e2epassword123',
      PAYLOAD_SECRET: process.env.PAYLOAD_SECRET ?? 'e2e-secret',
    },
  },
})
