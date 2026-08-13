import { test, expect } from '@playwright/test'

for (const viewport of [
  { width: 1848, height: 731 },
  { width: 1280, height: 720 },
]) {
  test(`manufacturing records do not overlap at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/capability.html', { waitUntil: 'networkidle' })
    const records = page.locator('.trace-records')
    await records.scrollIntoViewIfNeeded()
    await page.waitForTimeout(1200)

    const geometry = await records.evaluate(container => {
      const bounds = container.getBoundingClientRect()
      const cards = [...container.querySelectorAll('.record')].map(card => {
        const rect = card.getBoundingClientRect()
        return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right }
      })
      const overlaps = cards.some((card, index) => cards.slice(index + 1).some(other =>
        card.left < other.right && card.right > other.left && card.top < other.bottom && card.bottom > other.top,
      ))
      return {
        overlaps,
        inside: cards.every(card =>
          card.left >= bounds.left && card.right <= bounds.right &&
          card.top >= bounds.top && card.bottom <= bounds.bottom,
        ),
      }
    })

    expect(geometry.overlaps).toBeFalsy()
    expect(geometry.inside).toBeTruthy()
  })
}
