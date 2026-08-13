import { chromium, webkit, devices } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const output = 'test-results/remaining-pages'
await mkdir(output, { recursive: true })

const routes = ['/capability.html', '/solutions', '/about', '/contact', '/privacy', '/terms']
const profiles = [
  ['windows', chromium, { viewport: { width: 1366, height: 768 }, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' }],
  ['safari', webkit, { viewport: { width: 1440, height: 900 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15' }],
  ['iphone', webkit, { ...devices['iPhone 15 Pro'] }],
]

for (const route of routes) {
  for (const [profileName, engine, options] of profiles) {
    const browser = await engine.launch(options.executablePath ? { executablePath: options.executablePath } : {})
    const contextOptions = { ...options }
    delete contextOptions.executablePath
    const context = await browser.newContext(contextOptions)
    const page = await context.newPage()
    const errors = []
    const failures = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => message.type() === 'error' && errors.push(message.text()))
    page.on('requestfailed', (request) => failures.push(`${request.url()} — ${request.failure()?.errorText}`))
    page.on('response', (response) => response.status() >= 400 && failures.push(`${response.status()} ${response.url()}`))

    await page.goto(`http://localhost:4174${route}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(4200)
    const viewportHeight = page.viewportSize().height
    let scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight)
    const samples = []
    for (let top = 0; top <= scrollHeight; top += Math.max(190, Math.round(viewportHeight * 0.44))) {
      await page.evaluate((value) => scrollTo(0, value), top)
      await page.waitForTimeout(55)
      if (samples.length < 80) {
        samples.push(await page.evaluate(() => ({
          y: Math.round(scrollY),
          center: (() => {
            const element = document.elementFromPoint(innerWidth / 2, innerHeight / 2)
            return element ? `${element.tagName}.${String(element.className || '').slice(0, 100)}` : null
          })(),
        })))
      }
      scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight)
    }
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
    await page.waitForTimeout(900)

    const report = await page.evaluate(() => {
      const visible = (element) => {
        const style = getComputedStyle(element)
        return element.getClientRects().length && style.display !== 'none' && style.visibility !== 'hidden'
      }
      const root = document.documentElement
      const oldLeft = root.scrollLeft
      root.scrollLeft = 100
      const reachableHorizontalScroll = root.scrollLeft
      root.scrollLeft = oldLeft
      return {
        title: document.title,
        path: location.pathname,
        clientWidth: root.clientWidth,
        scrollWidth: root.scrollWidth,
        reachableHorizontalScroll,
        scrollHeight: root.scrollHeight,
        headings: [...document.querySelectorAll('h1,h2,h3')].filter(visible).map((heading) => ({
          text: heading.textContent.trim().replace(/\s+/g, ' '),
          opacity: getComputedStyle(heading).opacity,
          hiddenChildren: [...heading.querySelectorAll('*')].filter((child) => visible(child) && Number(getComputedStyle(child).opacity) < 0.92).length,
        })),
        sections: [...document.querySelectorAll('main section, main > div, footer')].filter(visible).map((section) => ({
          tag: section.tagName,
          className: String(section.className || '').slice(0, 120),
          height: Math.round(section.getBoundingClientRect().height),
          opacity: getComputedStyle(section).opacity,
        })),
      }
    })

    const slug = route.replace(/^\//, '').replace(/\.html$/, '').replaceAll('/', '-')
    await page.screenshot({ path: `${output}/${slug}-${profileName}-bottom.png` })
    const landmarks = page.locator('main section, footer')
    const count = Math.min(await landmarks.count(), 20)
    for (let index = 0; index < count; index++) {
      const landmark = landmarks.nth(index)
      if (!await landmark.isVisible()) continue
      await landmark.scrollIntoViewIfNeeded()
      await page.waitForTimeout(280)
      await page.screenshot({ path: `${output}/${slug}-${profileName}-section-${String(index + 1).padStart(2, '0')}.png` })
    }

    const finalReport = { route, profile: profileName, ...report, samples, errors, failures }
    await writeFile(`${output}/${slug}-${profileName}.json`, JSON.stringify(finalReport, null, 2))
    console.log(JSON.stringify({
      route,
      profile: profileName,
      width: `${report.clientWidth}/${report.scrollWidth}/${report.reachableHorizontalScroll}`,
      hiddenHeadings: report.headings.filter((heading) => Number(heading.opacity) < 0.92 || heading.hiddenChildren),
      sectionCount: report.sections.length,
      errors,
      failures,
    }))
    await context.close()
    await browser.close()
  }
}
