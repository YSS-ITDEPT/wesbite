import { test, expect } from '@playwright/test'

test('reloading the index returns to the hero', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'networkidle' })
  await page.locator('#applications').scrollIntoViewIfNeeded()
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(500)

  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(500)

  expect(await page.evaluate(() => scrollY)).toBeLessThanOrEqual(1)
  expect(new URL(page.url()).hash).toBe('')
  await expect(page.locator('[data-index-hero="01"]')).toBeVisible()
})
