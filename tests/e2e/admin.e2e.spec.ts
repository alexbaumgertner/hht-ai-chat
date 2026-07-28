import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'

test.describe('Admin Panel', () => {
  let page: Page

  test.beforeAll(async ({ browser }, testInfo) => {
    await seedTestUser()

    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test('can navigate to dashboard', async () => {
    await page.goto('http://localhost:3000/admin')
    await expect(page).toHaveURL('http://localhost:3000/admin')
    const dashboardArtifact = page.locator('span[title="Dashboard"]').first()
    await expect(dashboardArtifact).toBeVisible()
  })

  test('can navigate to list view', async () => {
    await page.goto('http://localhost:3000/admin/collections/users')
    await expect(page).toHaveURL('http://localhost:3000/admin/collections/users')
    const listViewArtifact = page.locator('h1', { hasText: 'Users' }).first()
    await expect(listViewArtifact).toBeVisible()
  })

  test('can navigate to edit view', async () => {
    await page.goto('http://localhost:3000/admin/collections/users/create')
    await expect(page).toHaveURL(/\/admin\/collections\/users\/[a-zA-Z0-9-_]+/)
    const editViewArtifact = page.locator('input[name="email"]')
    await expect(editViewArtifact).toBeVisible()
  })

  test('can manage prompts (create, edit, archive)', async () => {
    const stamp = Date.now()
    const title = `E2E Prompt ${stamp}`
    const updatedTitle = `E2E Prompt Updated ${stamp}`

    await page.goto('http://localhost:3000/admin/collections/prompts')
    await expect(page.locator('h1', { hasText: 'Prompts' }).first()).toBeVisible()

    await page.goto('http://localhost:3000/admin/collections/prompts/create')
    await page.fill('input[name="title"]', title)
    await page.fill('textarea[name="content"]', 'E2E test system prompt content.')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/admin\/collections\/prompts\/\d+/)

    await page.fill('input[name="title"]', updatedTitle)
    await page.click('button[type="submit"]')
    await expect(page.locator('input[name="title"]')).toHaveValue(updatedTitle)

    await page.locator('select[name="status"]').selectOption('archived')
    await page.click('button[type="submit"]')
    await expect(page.locator('select[name="status"]')).toHaveValue('archived')
  })
})
