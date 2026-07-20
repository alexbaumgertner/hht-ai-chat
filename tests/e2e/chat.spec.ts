import { expect, test } from '@playwright/test'

const EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'e2e@example.com'
const PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'e2epassword123'

test('a patient can log in and chat with the assistant', async ({ page }) => {
  await page.goto('/login')

  await page.getByPlaceholder('you@example.com').fill(EMAIL)
  await page.getByPlaceholder('Your password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()

  // Land on the chat page.
  await expect(page).toHaveURL(/\/chat/)
  await expect(page.getByTestId('composer-input')).toBeVisible()

  // Start a fresh conversation so the test is independent of existing data.
  await page.getByTestId('new-chat').click()

  // Send a message.
  await page.getByTestId('composer-input').fill('What is HHT?')
  await page.getByTestId('send-button').click()

  // The user's message and an assistant reply appear (assert on the latest).
  await expect(page.getByTestId('user-message').last()).toContainText('What is HHT?')
  await expect(page.getByTestId('assistant-message').last()).toBeVisible({ timeout: 20_000 })

  // A chat now exists in the sidebar.
  await expect(page.getByTestId('chat-item').first()).toBeVisible()
})
