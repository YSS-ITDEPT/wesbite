import { test, expect } from '@playwright/test'

async function waitForLoader(page) {
  await page.waitForFunction(() =>
    document.querySelector('[data-page-loader]')?.classList.contains('is-hidden'),
  )
}

async function advanceToCard(page) {
  const geometry = await page.locator('.aacts__stage-wrap').evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return { top: rect.top + scrollY, range: rect.height - innerHeight }
  })
  await page.evaluate(({ top, range }) => scrollTo(0, top + range * 0.15), geometry)
  await page.waitForTimeout(180)
  await page.evaluate(({ top, range }) => scrollTo(0, top + range), geometry)
  await expect.poll(() => new URL(page.url()).searchParams.get('product')).toBe('card')
}

test.beforeEach(async ({ page }) => {
  await page.route('https://ik.imagekit.io/**', (route) => route.abort())
  await page.goto('/solutions', { waitUntil: 'domcontentloaded' })
  await waitForLoader(page)
})

test('trackpad momentum cannot reverse a new product', async ({ page }) => {
  await advanceToCard(page)

  for (const delay of [450, 300, 200]) {
    await page.waitForTimeout(delay)
    await page.evaluate(() =>
      window.dispatchEvent(new WheelEvent('wheel', { deltaY: -7, bubbles: true })),
    )
  }
  await page.waitForTimeout(250)
  expect(new URL(page.url()).searchParams.get('product')).toBe('card')

  await page.waitForTimeout(320)
  await page.evaluate(() =>
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: -80, bubbles: true })),
  )
  await expect.poll(() => new URL(page.url()).searchParams.get('product')).toBe(null)
})

test('continued touch gesture cannot reverse a new product', async ({ page }) => {
  await page.evaluate(() => {
    window.__testTouch = (type, y) => {
      const event = new Event(type, { bubbles: true })
      Object.defineProperty(event, 'touches', {
        value: y == null ? [] : [{ clientY: y }],
      })
      window.dispatchEvent(event)
    }
    window.__testTouch('touchstart', 300)
    window.__testTouch('touchmove', 245)
  })

  await advanceToCard(page)
  await page.waitForTimeout(950)
  await page.evaluate(() => window.__testTouch('touchmove', 330))
  await page.waitForTimeout(350)
  expect(new URL(page.url()).searchParams.get('product')).toBe('card')

  await page.evaluate(() => {
    window.__testTouch('touchend', null)
    window.__testTouch('touchstart', 180)
    window.__testTouch('touchmove', 235)
  })
  await expect.poll(() => new URL(page.url()).searchParams.get('product')).toBe(null)
})
