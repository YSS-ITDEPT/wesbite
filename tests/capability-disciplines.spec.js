import { test, expect } from '@playwright/test'

test('six disciplines uses the same pinned animation in every browser', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })

  await page.goto('/capability.html', { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)

  const section = page.locator('#disciplines')
  const pin = section.locator('.disciplines-pin')
  await expect(pin).toBeVisible()
  await expect(section.locator('.safari-disciplines-flow')).toBeHidden()

  const states = []
  for (let index = 0; index < 6; index += 1) {
    const state = await section.evaluate(async (element, requested) => {
      const distance = element.offsetHeight - innerHeight
      scrollTo(0, element.offsetTop + distance * ((requested + 0.25) / 6))
      window.ScrollTrigger?.update()
      await new Promise(resolve => setTimeout(resolve, 650))
      const buttons = [...element.querySelectorAll('[data-cap]')]
      const image = element.querySelector('[data-cap-image]')
      return {
        active: buttons.findIndex(button => button.classList.contains('is-active')),
        pinTop: Math.round(element.querySelector('.disciplines-pin').getBoundingClientRect().top),
        imageReady: image.complete && image.naturalWidth > 0,
        title: element.querySelector('[data-cap-title]').textContent.trim(),
      }
    }, index)
    states.push(state)
  }

  expect(states.map(state => state.active)).toEqual([0, 1, 2, 3, 4, 5])
  expect(states.every(state => Math.abs(state.pinTop) <= 1), JSON.stringify(states)).toBeTruthy()
  expect(states.every(state => state.imageReady && state.title.length > 0)).toBeTruthy()
  expect(errors).toEqual([])
})
