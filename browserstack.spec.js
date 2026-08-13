import { expect, test } from '@playwright/test'

const allPages = [
  { name: 'home', path: '/index.html' },
  { name: 'capability', path: '/capability.html' },
  { name: 'solutions', path: '/solutions' },
  { name: 'about', path: '/about' },
  { name: 'contact', path: '/contact' },
]
const requestedPages = process.env.AUDIT_ROUTES?.split(',').map((name) => name.trim()).filter(Boolean)
const pages = requestedPages?.length
  ? allPages.filter((sitePage) => requestedPages.includes(sitePage.name))
  : allPages

const safeName = (value) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

async function waitForFiniteAnimations(page) {
  await page.evaluate(async () => {
    const animations = document.getAnimations().filter((animation) => {
      const timing = animation.effect?.getComputedTiming()
      return Number.isFinite(timing?.endTime) && timing.endTime > 0
    })

    await Promise.race([
      Promise.allSettled(animations.map((animation) => animation.finished)),
      new Promise((resolve) => setTimeout(resolve, 800)),
    ])
  })
}

test('cross-browser website audit', async ({ page, request }, testInfo) => {
  const runtimeErrors = []
  const failedRequests = []

  page.on('console', (message) => {
    const text = message.text()
    const isViteHmrSocket = message.location().url.includes('/@vite/client') ||
      /^WebSocket connection to 'ws:\/\/(?:127\.0\.0\.1|localhost):\d+\//.test(text) ||
      /^\[vite\] failed to connect to websocket/.test(text) ||
      /^Failed to send error to Vite server/.test(text)
    if (message.type() === 'error' && !isViteHmrSocket) runtimeErrors.push(`console: ${text}`)
  })
  page.on('pageerror', (error) => runtimeErrors.push(`page: ${error.message}`))
  page.on('requestfailed', (failedRequest) => {
    const failure = failedRequest.failure()?.errorText || 'unknown error'
    if (failure !== 'net::ERR_ABORTED') {
      failedRequests.push(`${failedRequest.method()} ${failedRequest.url()}: ${failure}`)
    }
  })

  for (const sitePage of pages) {
    runtimeErrors.length = 0
    failedRequests.length = 0

    const response = await page.goto(sitePage.path, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    expect(response, `${sitePage.name} did not return a document response`).not.toBeNull()
    expect(response.status(), `${sitePage.name} failed to load`).toBeLessThan(400)
    await expect(page.locator('body')).toBeVisible()
    await expect(page).toHaveTitle(/\S+/)

    const documentWidth = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    }))
    expect(
      documentWidth.content,
      `${sitePage.name} has horizontal overflow (${documentWidth.content}px content in ${documentWidth.viewport}px viewport)`,
    ).toBeLessThanOrEqual(documentWidth.viewport + 2)

    const internalLinks = await page.locator('a[href]').evaluateAll((anchors) =>
      [...new Set(anchors.map((anchor) => anchor.href))].filter((href) => {
        const url = new URL(href)
        return url.origin === location.origin && !url.pathname.match(/\.(pdf|zip)$/i)
      }),
    )
    for (const href of internalLinks) {
      const target = new URL(href)
      const linkResponse = await request.get(`${target.origin}${target.pathname}${target.search}`)
      expect(linkResponse.status(), `Navigation target failed: ${href}`).toBeLessThan(400)
    }

    const sections = page.locator('main > section, body > section, footer')
    const sectionCount = Math.min(await sections.count(), 30)
    for (let index = 0; index < sectionCount; index += 1) {
      const section = sections.nth(index)
      if (!(await section.isVisible())) continue

      await section.scrollIntoViewIfNeeded()
      await page.waitForTimeout(350)
      await waitForFiniteAnimations(page)

      const label = await section.evaluate((element, fallback) =>
        element.id || element.getAttribute('aria-label') ||
        element.querySelector('h1, h2, h3')?.textContent?.trim().slice(0, 45) || fallback,
      `section-${index + 1}`)
      await page.screenshot({
        path: testInfo.outputPath(`${sitePage.name}-${String(index + 1).padStart(2, '0')}-${safeName(label)}.png`),
        fullPage: false,
      })
    }

    await page.evaluate(async () => {
      const height = document.documentElement.scrollHeight
      for (let y = 0; y <= height; y += Math.max(innerHeight * 0.65, 300)) {
        scrollTo(0, y)
        await new Promise((resolve) => setTimeout(resolve, 80))
      }
      scrollTo(0, height)
    })
    await page.waitForTimeout(500)
    await waitForFiniteAnimations(page)

    const brokenImages = await page.locator('img').evaluateAll((images) =>
      images
        .filter((image) => image.currentSrc && image.complete && image.naturalWidth === 0)
        .map((image) => image.currentSrc),
    )
    expect(brokenImages, `${sitePage.name} contains broken images`).toEqual([])

    const unfinishedAnimations = await page.evaluate(() =>
      document.getAnimations()
        .filter((animation) => {
          const timing = animation.effect?.getComputedTiming()
          return animation.playState === 'running' && Number.isFinite(timing?.endTime)
        })
        .map((animation) => animation.effect?.target?.className || animation.effect?.target?.tagName),
    )
    expect(unfinishedAnimations, `${sitePage.name} has finite animations that never complete`).toEqual([])

    const stickyResults = await page.evaluate(() => {
      const stickyElements = [...document.querySelectorAll('body *')].filter(
        (element) => getComputedStyle(element).position === 'sticky',
      )
      return stickyElements
        .filter((element) => element.offsetWidth > 0 && element.offsetHeight > 0)
        .map((element) => {
        const rect = element.getBoundingClientRect()
        return {
          name: element.id || element.className || element.tagName,
          validGeometry: [rect.top, rect.left, rect.width, rect.height].every(Number.isFinite),
        }
      })
    })
    expect(stickyResults.filter((result) => !result.validGeometry), `${sitePage.name} has invalid sticky geometry`).toEqual([])

    expect(failedRequests, `${sitePage.name} had failed HTTP requests`).toEqual([])
    expect(runtimeErrors, `${sitePage.name} emitted browser errors`).toEqual([])
  }
})
