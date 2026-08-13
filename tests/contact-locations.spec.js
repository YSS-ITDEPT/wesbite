import { test, expect } from '@playwright/test'

test('strategic locations reveals as the section enters', async ({ page }) => {
  await page.goto('/contact', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  const section = page.locator('.contact-locations')
  const sectionTop = await section.evaluate(element => element.getBoundingClientRect().top + scrollY)

  await page.evaluate(top => scrollTo(0, top - innerHeight * 0.84), sectionTop)
  await page.waitForTimeout(1100)

  const selectors = [
    '.contact-locations__kicker',
    '.contact-locations__title',
    '.contact-locations__subtitle',
    '.contact-locations__card',
    '.contact-locations__media',
  ]
  for (const selector of selectors) {
    const elements = section.locator(selector)
    const count = await elements.count()
    expect(count).toBeGreaterThan(0)
    for (let index = 0; index < count; index += 1) {
      await expect(elements.nth(index)).toHaveCSS('opacity', '1')
    }
  }
})
