import { test, expect } from '@playwright/test'

test('visible achievement cards contain fully revealed headings', async ({ page }) => {
  await page.goto('/about', { waitUntil: 'networkidle' })
  const section = page.locator('.about-achievements')
  await section.scrollIntoViewIfNeeded()
  await page.waitForTimeout(1600)

  const cards = section.locator('.about-achievements__card')
  await expect(cards).toHaveCount(4)
  const states = await cards.evaluateAll(elements => elements.map(card => {
    const heading = card.querySelector('h3')
    const style = getComputedStyle(heading)
    return {
      text: heading.textContent.trim(),
      opacity: Number(style.opacity),
      transform: style.transform,
      splitWords: heading.querySelectorAll('.word').length,
      color: style.color,
    }
  }))

  expect(states.every(state => state.text.length > 0)).toBeTruthy()
  expect(states.every(state => state.opacity > 0.99)).toBeTruthy()
  expect(states.every(state => state.transform === 'none')).toBeTruthy()
  expect(states.every(state => state.splitWords === 0)).toBeTruthy()
  expect(states.every(state => state.color === 'rgb(255, 255, 255)')).toBeTruthy()
})
