import { expect, test } from '@playwright/test'

test.describe('Frontend', () => {
  test('homepage redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: 'HHT AI Chat' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })
})
