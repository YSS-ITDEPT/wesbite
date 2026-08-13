import { test, expect } from '@playwright/test'

for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 1024, height: 640 },
]) {
  test(`capability closing fits one view at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/capability.html', { waitUntil: 'networkidle' })
    const closing = page.locator('.closing')
    await closing.scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)

    const layout = await closing.evaluate(section => {
      const bounds = section.getBoundingClientRect()
      const content = [
        section.querySelector('.closing-copy'),
        section.querySelector('.closing-logo'),
        section.querySelector('.aacts-stack'),
      ].map(element => element.getBoundingClientRect())
      return {
        height: bounds.height,
        viewportHeight: innerHeight,
        contained: content.every(rect =>
          rect.top >= bounds.top - 1 && rect.bottom <= bounds.bottom + 1 &&
          rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1,
        ),
      }
    })

    expect(layout.height).toBeLessThanOrEqual(layout.viewportHeight + 1)
    expect(layout.contained).toBeTruthy()
  })
}
