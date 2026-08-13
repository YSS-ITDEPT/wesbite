import { test, expect } from '@playwright/test'

const MONTEREY_SAFARI_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15'
const VENTURA_SAFARI_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15'
const VENTURA_SAFARI_VERSIONS = [
  '16.1', '16.2', '16.3', '16.4', '16.5', '16.6',
  '17.0', '17.1', '17.2', '17.3', '17.4', '17.5', '17.6',
  '18.0', '18.1', '18.2', '18.3', '18.4', '18.5', '18.6',
]

const venturaSafariUserAgent = (version) =>
  `Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6_9) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version} Safari/605.1.15`

async function waitForLoader(page) {
  await page.waitForFunction(() =>
    document.querySelector('[data-page-loader]')?.classList.contains('is-hidden'),
  )
}

async function scrubFrames(page, direction = 1) {
  const seenFrames = []
  for (let step = 0; step < 9; step += 1) {
    await page.evaluate((deltaY) => window.dispatchEvent(
      new WheelEvent('wheel', { deltaY, bubbles: true, cancelable: true }),
    ), 120 * direction)
    await page.waitForTimeout(28)
    seenFrames.push(await page.locator('.product-frame-poster--active').getAttribute('src'))
  }
  return seenFrames
}

async function scrollProduct(page, expectedProduct) {
  // Product handoff deliberately ignores the previous gesture's momentum.
  await page.waitForTimeout(460)
  const contentSelector = {
    aacts3000: '.aacts__block--intro, .aacts__block--specs',
    card: '.sample-card__content',
    handheld: '.handheld__content',
    sampler: '.high-volume__content',
  }[expectedProduct ?? 'aacts3000']
  const expectReadableContent = async () => {
    await expect.poll(() => page.locator(contentSelector).evaluateAll((elements) =>
      Math.max(...elements.map((element) => Number(getComputedStyle(element).opacity))),
    )).toBeGreaterThan(0.9)
  }

  expect(new URL(page.url()).searchParams.get('product')).toBe(expectedProduct)
  await expectReadableContent()
  const openingSrc = await page.locator('.product-frame-poster--active').getAttribute('src')

  // One sustained gesture scrubs the complete image sequence but cannot also
  // perform the product handoff.
  const seenFrames = await scrubFrames(page, 1)
  expect(new Set(seenFrames).size).toBeGreaterThan(6)
  expect(new URL(page.url()).searchParams.get('product')).toBe(expectedProduct)
  await expectReadableContent()
  await expect.poll(() => page.locator('.product-frame-poster--active').getAttribute('src'))
    .not.toBe(openingSrc)
  await expect(page.locator('.product-frame-poster--active')).toHaveAttribute(
    'src',
    /frame_000120\.webp$/,
  )

  const pinnedStage = await page.locator(
    '.aacts__stage, .sample-card__stage, .handheld__stage, .high-volume__stage',
  ).boundingBox()
  expect(pinnedStage.height).toBeGreaterThan(850)
  expect(Math.abs(pinnedStage.y)).toBeLessThan(40)

  // A separate gesture performs the product handoff.
  await page.waitForTimeout(620)
  await page.evaluate(() => window.dispatchEvent(
    new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true }),
  ))
}

test('Monterey Safari reveals each product before advancing without a blank runway', async ({ browser }) => {
  const context = await browser.newContext({
    userAgent: MONTEREY_SAFARI_UA,
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
  })
  const page = await context.newPage()
  await page.route('https://ik.imagekit.io/**', (route) => route.abort())
  await page.goto('http://localhost:4174/solutions', { waitUntil: 'domcontentloaded' })
  await waitForLoader(page)
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto'
  })

  await expect(page.locator('.aacts')).toHaveClass(/aacts--fixed-safari/)
  await expect(page.locator('.aacts__canvas')).toBeHidden()
  await expect.poll(() => page.locator('.product-frame-poster--active').evaluate((image) => image.naturalWidth)).toBeGreaterThan(0)
  await expect(page.locator('.aacts__stage-wrap')).toHaveCSS('height', '900px')

  const transitions = [
    [null, 'card'],
    ['card', 'handheld'],
    ['handheld', 'sampler'],
    ['sampler', 'cleaner'],
  ]
  for (const [currentProduct, nextProduct] of transitions) {
    await scrollProduct(page, currentProduct)
    await expect.poll(() => new URL(page.url()).searchParams.get('product')).toBe(nextProduct)
    await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(40)
  }

  // Product 05 still reveals its last frame before releasing normal page
  // scrolling to the footer.
  await page.waitForTimeout(460)
  await scrubFrames(page, 1)
  await expect(page.locator('.product-frame-poster--active')).toHaveAttribute('src', /frame_000120\.webp$/)
  await page.waitForTimeout(620)
  // First boundary gesture releases the fixed stage; the following native
  // gesture scrolls into the footer.
  await page.evaluate(() => window.dispatchEvent(
    new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true }),
  ))
  await page.waitForTimeout(80)
  await page.mouse.wheel(0, 700)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100)

  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto'
    scrollTo(0, document.documentElement.scrollHeight)
  })
  await page.waitForTimeout(150)
  const footerScrollY = await page.evaluate(() => scrollY)
  await page.waitForTimeout(460)
  await page.mouse.wheel(0, -700)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(footerScrollY)

  await page.locator('.cleaner__stage-wrap').evaluate((element) => {
    const rect = element.getBoundingClientRect()
    scrollTo(0, rect.top + scrollY)
  })
  await page.waitForTimeout(460)
  await scrubFrames(page, -1)
  await expect(page.locator('.product-frame-poster--active')).toHaveAttribute(
    'src',
    /frame_000036\.webp$/,
  )
  await page.waitForTimeout(620)
  await page.evaluate(() =>
    window.dispatchEvent(
      new WheelEvent('wheel', { deltaY: -60, bubbles: true, cancelable: true }),
    ),
  )
  await expect.poll(() => new URL(page.url()).searchParams.get('product')).toBe('sampler')
  await page.waitForTimeout(700)
  expect(new URL(page.url()).searchParams.get('product')).toBe('sampler')

  await context.close()
})

test('entering Solutions from another page starts at product 01 and the runway origin', async ({ browser }) => {
  const context = await browser.newContext({
    userAgent: MONTEREY_SAFARI_UA,
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
  })
  const page = await context.newPage()
  await page.route('https://ik.imagekit.io/**', (route) => route.abort())
  await page.goto('http://localhost:4174/about', { waitUntil: 'domcontentloaded' })
  await waitForLoader(page)
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))

  await Promise.all([
    page.waitForURL(/\/solutions\/?$/),
    page.getByRole('banner').getByRole('link', { name: 'Solutions', exact: true }).click(),
  ])
  await waitForLoader(page)

  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(5)
  expect(new URL(page.url()).searchParams.get('product')).toBe(null)
  await expect(page.locator('.aacts')).toHaveClass(/aacts--static-safari/)

  // Entry reset must not break the normal first-product timeline.
  await scrollProduct(page, null)
  await expect.poll(() => new URL(page.url()).searchParams.get('product')).toBe('card')

  await context.close()
})

test('entering Solutions from the static Index keeps the first product pinned', async ({ browser }) => {
  const context = await browser.newContext({
    userAgent: MONTEREY_SAFARI_UA,
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
  })
  const page = await context.newPage()
  await page.route('https://ik.imagekit.io/**', (route) => route.abort())
  await page.goto('http://localhost:4174/index.html', { waitUntil: 'domcontentloaded' })
  await waitForLoader(page)
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))

  await Promise.all([
    page.waitForURL(/\/solutions\/?$/),
    page.locator('header > nav a[href="/solutions"]').click(),
  ])
  await waitForLoader(page)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(5)

  await scrollProduct(page, null)
  await expect.poll(() => new URL(page.url()).searchParams.get('product')).toBe('card')
  await context.close()
})

test('Ventura Safari responds immediately to small trackpad deltas', async ({ browser }) => {
  const context = await browser.newContext({
    userAgent: VENTURA_SAFARI_UA,
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
  })
  const page = await context.newPage()
  await page.route('https://ik.imagekit.io/**', (route) => route.abort())
  await page.goto('http://localhost:4174/solutions', { waitUntil: 'domcontentloaded' })
  await waitForLoader(page)

  await expect(page.locator('.aacts')).toHaveClass(/aacts--fixed-safari/)
  const openingSrc = await page.locator('.product-frame-poster--active').getAttribute('src')
  for (let step = 0; step < 6; step += 1) {
    await page.evaluate(() => window.dispatchEvent(
      new WheelEvent('wheel', { deltaY: 4, bubbles: true, cancelable: true }),
    ))
    await page.waitForTimeout(35)
  }

  await expect.poll(() => page.locator('.product-frame-poster--active').getAttribute('src'))
    .not.toBe(openingSrc)
  expect(new URL(page.url()).searchParams.get('product')).toBe(null)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(5)
  await context.close()
})

test('all Ventura-compatible Safari version identities use responsive fixed frames', async ({ browser }) => {
  test.setTimeout(120000)

  for (const version of VENTURA_SAFARI_VERSIONS) {
    const context = await browser.newContext({
      userAgent: venturaSafariUserAgent(version),
      viewport: { width: 1440, height: 900 },
      colorScheme: 'dark',
    })
    const page = await context.newPage()
    await page.route('https://ik.imagekit.io/**', (route) => route.abort())
    await page.goto('http://localhost:4174/solutions', { waitUntil: 'domcontentloaded' })

    await expect(page.locator('.aacts')).toHaveClass(/aacts--fixed-safari/)
    await expect.poll(() => page.locator('.product-frame-poster--active').evaluate((image) =>
      image.naturalWidth,
    )).toBeGreaterThan(0)

    const openingSrc = await page.locator('.product-frame-poster--active').getAttribute('src')
    await page.waitForTimeout(460)
    for (let step = 0; step < 6; step += 1) {
      await page.evaluate(() => window.dispatchEvent(
        new WheelEvent('wheel', { deltaY: 4, bubbles: true, cancelable: true }),
      ))
      await page.waitForTimeout(20)
    }
    await expect.poll(() => page.locator('.product-frame-poster--active').getAttribute('src'))
      .not.toBe(openingSrc)
    expect(new URL(page.url()).searchParams.get('product')).toBe(null)
    await context.close()
  }
})
