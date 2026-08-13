import { webkit, devices } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const output = 'test-results/index-webkit-matrix'
await mkdir(output, { recursive: true })
const browser = await webkit.launch()
const profiles = [
  ['macos-safari', { viewport: { width: 1440, height: 900 } }],
  ['macbook-narrow', { viewport: { width: 900, height: 700 } }],
  ['iphone-393', { ...devices['iPhone 15 Pro'] }],
  ['iphone-440', { viewport: { width: 440, height: 956 }, isMobile: true, hasTouch: true }],
  ['iphone-landscape', { viewport: { width: 852, height: 393 }, isMobile: true, hasTouch: true }],
]
const selectors = [
  ['hero-01', '[data-index-hero="01"]'],
  ['hero-02', '[data-index-hero="02"]'],
  ...Array.from({ length: 5 }, (_, index) => [`product-${index + 1}`, `[data-parade-row]:nth-of-type(${index + 1})`]),
  ['proof', '#capability'],
  ...Array.from({ length: 5 }, (_, index) => [`application-${index + 1}`, `.app-panels article:nth-child(${index + 1})`]),
  ['closing', '#closing'],
  ['footer', '[data-footer]'],
]

for (const [name, profile] of profiles) {
  const context = await browser.newContext({
    ...profile,
    userAgent: profile.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
  })
  const page = await context.newPage()
  const errors = []
  const failures = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('requestfailed', (request) => failures.push(`${request.url()} — ${request.failure()?.errorText}`))
  page.on('response', (response) => {
    if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`)
  })

  await page.goto('http://localhost:4174/index.html', { waitUntil: 'networkidle' })
  await page.waitForTimeout(4200)
  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight)
  const viewportHeight = page.viewportSize().height
  for (let top = 0; top < scrollHeight; top += Math.max(180, Math.round(viewportHeight * 0.48))) {
    await page.evaluate((value) => scrollTo(0, value), top)
    await page.waitForTimeout(45)
  }
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
  await page.waitForTimeout(1000)

  const report = await page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element)
      return element.getClientRects().length > 0 && style.display !== 'none' && style.visibility !== 'hidden'
    }
    const headingFailures = [...document.querySelectorAll('main h1,main h2,main h3,.site-footer h2')]
      .filter((heading) => visible(heading) && !heading.closest('[hidden]'))
      .map((heading) => {
        const badChildren = [...heading.querySelectorAll('*')].filter((child) => {
          const style = getComputedStyle(child)
          return visible(child) && Number(style.opacity) < 0.94
        })
        return {
          text: heading.textContent.trim().replace(/\s+/g, ' '),
          opacity: getComputedStyle(heading).opacity,
          hiddenChildren: badChildren.length,
        }
      })
      .filter((heading) => Number(heading.opacity) < 0.94 || heading.hiddenChildren)

    const root = document.documentElement
    const oldLeft = root.scrollLeft
    root.scrollLeft = 100
    const reachableHorizontalScroll = root.scrollLeft
    root.scrollLeft = oldLeft
    return {
      safariClass: root.classList.contains('is-safari'),
      clientWidth: root.clientWidth,
      scrollWidth: root.scrollWidth,
      reachableHorizontalScroll,
      headingFailures,
      applicationPanels: [...document.querySelectorAll('.app-panels article')].map((article) => ({
        opacity: getComputedStyle(article).opacity,
        height: Math.round(article.getBoundingClientRect().height),
      })),
    }
  })

  for (const [label, selector] of selectors) {
    const element = page.locator(selector).first()
    if (!(await element.count()) || !(await element.isVisible())) continue
    await element.scrollIntoViewIfNeeded()
    await page.waitForTimeout(350)
    await page.screenshot({ path: `${output}/${name}-${label}.png` })
  }
  const finalReport = { name, ...report, errors, failures }
  await writeFile(`${output}/${name}.json`, JSON.stringify(finalReport, null, 2))
  console.log(JSON.stringify(finalReport))
  await context.close()
}

await browser.close()
