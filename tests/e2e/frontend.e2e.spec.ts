import { expect, test } from '@playwright/test'

test.describe('HHT chat', () => {
  test('shows the chat safety baseline', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/HHT помощник/)
    await expect(page.getByRole('heading', { name: 'Понятные ответы о жизни с HHT' })).toBeVisible()
    await expect(page.getByLabel('Сообщение помощнику')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Отправить' })).toBeDisabled()
    await expect(page.getByText(/сильном кровотечении/)).toBeVisible()
  })
})
