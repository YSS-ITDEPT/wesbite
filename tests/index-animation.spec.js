import { test, expect } from '@playwright/test'

test('index scroll animations complete at each chapter', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })

  await page.goto('/index.html', { waitUntil: 'networkidle' })
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready
    await new Promise(resolve => setTimeout(resolve, 900))
  })

  const application = page.locator('.applications')
  await expect(application).toBeVisible()
  const applicationState = await application.evaluate(async section => {
    const states = []
    const distance = section.offsetHeight - innerHeight
    for (let index = 0; index < 5; index += 1) {
      scrollTo(0, section.offsetTop + distance * ((index + 0.25) / 5))
      window.ScrollTrigger?.update()
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const scenes = [...section.querySelectorAll('.app-panels article')]
      states.push({
        requested: index,
        active: scenes.findIndex(scene => scene.classList.contains('is-active')),
        visible: scenes.filter(scene => Number(getComputedStyle(scene).opacity) > 0.9).length,
        pinTop: Math.round(section.querySelector('.applications-pin').getBoundingClientRect().top),
      })
    }
    return states
  })

  expect(applicationState.map(state => state.active)).toEqual([0, 1, 2, 3, 4])
  expect(applicationState.every(state => state.visible === 1)).toBeTruthy()
  expect(applicationState.every(state => Math.abs(state.pinTop) <= 1)).toBeTruthy()

  const paradeRows = page.locator('[data-parade-row]')
  const rowCount = await paradeRows.count()
  expect(rowCount).toBeGreaterThan(0)
  for (let index = 0; index < rowCount; index += 1) {
    const row = paradeRows.nth(index)
    const revealRange = await row.evaluate(element => {
      const media = element.querySelector('.parade-media')
      const copy = element.querySelector('.parade-copy')
      const triggers = window.ScrollTrigger?.getAll().filter(item =>
        (item.trigger === media || item.trigger === copy) && item.animation,
      ) || []
      const image = element.querySelector('.parade-media img')
      const imageTrigger = triggers.find(item => item.animation.targets?.().includes(image))
      const textTrigger = triggers.find(item => item !== imageTrigger)
      return {
        start: imageTrigger.start,
        imageEnd: imageTrigger.end,
        textStart: textTrigger.start,
        textEnd: textTrigger.end,
        end: Math.max(...triggers.map(item => item.end)),
      }
    })
    await page.evaluate(({ start, imageEnd }) => {
      const target = start + (imageEnd - start) * 0.42
      window.__anikaLenis?.scrollTo(target, { immediate: true })
      scrollTo(0, target)
      window.ScrollTrigger?.update()
    }, revealRange)
    await page.waitForTimeout(750)

    const midpoint = await row.evaluate(element => {
      const mediaOpacity = Number(getComputedStyle(element.querySelector('.parade-media img')).opacity)
      return { mediaOpacity }
    })
    expect(midpoint.mediaOpacity).toBeGreaterThan(0.05)
    expect(midpoint.mediaOpacity).toBeLessThan(1)

    await page.evaluate(({ textStart, textEnd }) => {
      const target = textStart + (textEnd - textStart) * 0.42
      window.__anikaLenis?.scrollTo(target, { immediate: true })
      scrollTo(0, target)
      window.ScrollTrigger?.update()
    }, revealRange)
    await page.waitForTimeout(750)
    const orangeChars = await row.locator('.parade-type-char').evaluateAll(chars =>
      chars.filter(char => getComputedStyle(char).color === 'rgb(255, 122, 0)').length,
    )
    expect(orangeChars).toBeGreaterThan(0)

    await page.evaluate(({ end }) => {
      const target = end + 4
      window.__anikaLenis?.scrollTo(target, { immediate: true })
      scrollTo(0, target)
      window.ScrollTrigger?.update()
    }, revealRange)
    await page.waitForTimeout(900)
    await expect(row.locator('.parade-media')).toBeVisible()
    await expect(row.locator('.parade-copy')).toBeVisible()
    await expect(row.locator('.parade-copy')).toHaveCSS('opacity', '1')
    const revealState = await row.evaluate(element => {
      const media = element.querySelector('.parade-media')
      const titleChars = [...element.querySelectorAll('.parade-type-char')]
      const descriptionWords = [...element.querySelectorAll('.parade-copy-word')]
      return {
        mediaOpacity: Number(getComputedStyle(media.querySelector('img')).opacity),
        titleComplete: titleChars.length > 0 && titleChars.every(char => Number(getComputedStyle(char).opacity) > 0.99),
        descriptionComplete: descriptionWords.length > 0 && descriptionWords.every(word => Number(getComputedStyle(word).opacity) > 0.99),
      }
    })
    expect(revealState.mediaOpacity).toBeGreaterThan(0.99)
    expect(revealState.titleComplete).toBeTruthy()
    expect(revealState.descriptionComplete).toBeTruthy()
  }

  expect(errors).toEqual([])
})

test('application chapter numbers remain above their labels in a short viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 520 })
  await page.goto('/index.html', { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)

  const results = await page.locator('.applications').evaluate(async section => {
    const results = []
    const distance = section.offsetHeight - innerHeight
    for (let index = 0; index < 5; index += 1) {
      scrollTo(0, section.offsetTop + distance * ((index + 0.25) / 5))
      await new Promise(resolve => setTimeout(resolve, 450))
      const scene = section.querySelectorAll('.app-panels article')[index]
      const number = scene.querySelector(':scope > b').getBoundingClientRect()
      const label = scene.querySelector(':scope > div > small').getBoundingClientRect()
      const overlaps = !(
        number.right + 8 <= label.left ||
        number.left >= label.right + 8 ||
        number.bottom + 8 <= label.top ||
        number.top >= label.bottom + 8
      )
      results.push({ overlaps, numberTop: number.top })
    }
    return results
  })

  expect(results.every(({ overlaps, numberTop }) => !overlaps && numberTop < 160)).toBeTruthy()

  const headingClearance = await page.evaluate(() => {
    const headerBottom = document.querySelector('header').getBoundingClientRect().bottom
    const kickerTop = document.querySelector('.applications .app-heading > span').getBoundingClientRect().top
    const headingTop = document.querySelector('.applications .app-heading h2').getBoundingClientRect().top
    return { headerBottom, kickerTop, headingTop }
  })
  expect(headingClearance.kickerTop).toBeGreaterThanOrEqual(headingClearance.headerBottom + 6)
  expect(headingClearance.headingTop).toBeGreaterThan(headingClearance.kickerTop)
})

test('chemical intelligence remains readable and centered in a short desktop viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1555, height: 576 })
  await page.goto('/index.html', { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)

  const layout = await page.locator('[data-proof-overview]').evaluate(async section => {
    scrollTo(0, section.offsetTop + 10)
    window.ScrollTrigger?.update()
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    const header = document.querySelector('header').getBoundingClientRect()
    const heading = section.querySelector('.proof-heading').getBoundingClientRect()
    const cards = [...section.querySelectorAll('.proof-list article')]
    return {
      headingTop: heading.top,
      headerBottom: header.bottom,
      cardFonts: cards.map(card => Number.parseFloat(getComputedStyle(card.querySelector('p')).fontSize)),
      cardsInsideViewport: cards.every(card => {
        const rect = card.getBoundingClientRect()
        return rect.top >= 0 && rect.bottom <= innerHeight
      }),
    }
  })

  expect(layout.headingTop).toBeGreaterThanOrEqual(layout.headerBottom)
  expect(Math.min(...layout.cardFonts)).toBeGreaterThanOrEqual(10)
  expect(layout.cardsInsideViewport).toBeTruthy()
})

test('chemical intelligence advances through all six scroll chapters', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  const overview = page.locator('[data-proof-overview]')
  const states = []

  for (let index = 0; index < 6; index += 1) {
    const state = await overview.evaluate(async (section, requested) => {
      const distance = section.offsetHeight - innerHeight
      const target = section.offsetTop + distance * ((requested + 0.22) / 6)
      window.__anikaLenis?.scrollTo(target, { immediate: true })
      scrollTo(0, target)
      window.ScrollTrigger?.update()
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      return {
        active: [...section.querySelectorAll('.proof-list article')]
          .findIndex(card => card.classList.contains('is-active')),
        pinTop: Math.round(section.querySelector('.proof-overview-pin').getBoundingClientRect().top),
      }
    }, index)
    states.push(state)
  }

  expect(states.map(state => state.active)).toEqual([0, 1, 2, 3, 4, 5])
  expect(states.every(state => Math.abs(state.pinTop) <= 1)).toBeTruthy()
})

test('a direct jump to product 04 cannot leave the row blank', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  const row = page.locator('[data-parade-row]').nth(3)
  const target = await row.evaluate(element =>
    element.getBoundingClientRect().top + scrollY - innerHeight * 0.3,
  )
  await page.evaluate(y => {
    window.__anikaLenis?.scrollTo(y, { immediate: true })
    scrollTo(0, y)
    window.ScrollTrigger?.update()
  }, target)
  await page.waitForTimeout(800)

  const state = await row.evaluate(element => ({
    imageOpacity: Number(getComputedStyle(element.querySelector('.parade-media img')).opacity),
    titleVisible: [...element.querySelectorAll('.parade-type-char')]
      .every(char => Number(getComputedStyle(char).opacity) > 0.99),
    copyVisible: [...element.querySelectorAll('.parade-copy-word')]
      .every(word => Number(getComputedStyle(word).opacity) > 0.99),
  }))
  expect(state.imageOpacity).toBeGreaterThan(0.99)
  if ((await page.viewportSize()).width > 800) {
    expect(state.titleVisible).toBeTruthy()
    expect(state.copyVisible).toBeTruthy()
  }
})
