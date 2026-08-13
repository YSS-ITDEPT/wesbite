import { chromium, webkit } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const output = 'test-results/final-desktop-sanity'
await mkdir(output, { recursive: true })

const browsers = [
  ['windows-chrome', chromium, { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' }],
  ['macos-safari', webkit, {}],
]
const viewports = [
  ['fhd-16x9', 1920, 1080],
  ['desktop-16x9', 1600, 900],
  ['macbook-16x10', 1440, 900],
  ['laptop-16x9', 1366, 768],
  ['compact-16x9', 1280, 720],
  ['classic-4x3', 1024, 768],
  ['short-narrow', 900, 700],
]
const routes = [
  ['index', '/index.html'],
  ['capability', '/capability.html'],
  ['solutions', '/solutions'],
  ['about', '/about'],
  ['contact', '/contact'],
  ['privacy', '/privacy'],
  ['terms', '/terms'],
]

const allReports = []

for (const [browserName, engine, launchOptions] of browsers) {
  const browser = await engine.launch(launchOptions)
  for (const [viewportName, width, height] of viewports) {
    const context = await browser.newContext({
      viewport: { width, height },
      userAgent: browserName === 'macos-safari'
        ? 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15'
        : undefined,
    })
    for (const [routeName, route] of routes) {
      const page = await context.newPage()
      const errors = []
      const failures = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => message.type() === 'error' && errors.push(message.text()))
      page.on('requestfailed', (request) => failures.push(`${request.url()} — ${request.failure()?.errorText}`))
      page.on('response', (response) => response.status() >= 400 && failures.push(`${response.status()} ${response.url()}`))

      await page.goto(`http://localhost:4174${route}`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(3600)

      let scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight)
      const step = Math.max(170, Math.round(height * 0.38))
      const samples = []
      for (let y = 0; y <= scrollHeight; y += step) {
        await page.evaluate((top) => scrollTo(0, top), y)
        await page.waitForTimeout(42)
        const sample = await page.evaluate(() => {
          const viewportElements = [...document.querySelectorAll('main h1,main h2,main h3,footer h2')]
            .filter((element) => {
              const rect = element.getBoundingClientRect()
              const style = getComputedStyle(element)
              return rect.bottom > 72 && rect.top < innerHeight && style.display !== 'none' && style.visibility !== 'hidden'
            })
          const hiddenHeadings = viewportElements.map((heading) => ({
            text: heading.textContent.trim().replace(/\s+/g, ' '),
            opacity: Number(getComputedStyle(heading).opacity),
            hiddenChildren: [...heading.querySelectorAll('*')].filter((child) => {
              const style = getComputedStyle(child)
              return child.getClientRects().length && Number(style.opacity) < 0.08
            }).length,
          })).filter((heading) => heading.opacity < 0.08 || heading.hiddenChildren)

          const stickyProblems = [...document.querySelectorAll('*')].filter((element) => {
            const style = getComputedStyle(element)
            if (style.position !== 'sticky' || style.display === 'none') return false
            const parent = element.parentElement?.getBoundingClientRect()
            const rect = element.getBoundingClientRect()
            const parentCrossesViewport = parent && parent.top < innerHeight * 0.5 && parent.bottom > innerHeight * 0.5
            return parentCrossesViewport && (rect.bottom < 72 || rect.top > innerHeight)
          }).map((element) => ({
            className: String(element.className || '').slice(0, 100),
            top: Math.round(element.getBoundingClientRect().top),
            bottom: Math.round(element.getBoundingClientRect().bottom),
          }))

          const center = document.elementFromPoint(innerWidth / 2, innerHeight / 2)
          return {
            y: Math.round(scrollY),
            hiddenHeadings,
            stickyProblems,
            center: center ? `${center.tagName}.${String(center.className || '').slice(0, 90)}` : null,
          }
        })
        if (sample.hiddenHeadings.length || sample.stickyProblems.length) samples.push(sample)
        scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight)
      }

      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
      await page.waitForTimeout(700)
      const summary = await page.evaluate(() => {
        const root = document.documentElement
        const oldLeft = root.scrollLeft
        root.scrollLeft = 100
        const reachableHorizontalScroll = root.scrollLeft
        root.scrollLeft = oldLeft
        const hiddenHeadings = [...document.querySelectorAll('main h1,main h2,main h3,footer h2')].map((heading) => ({
          text: heading.textContent.trim().replace(/\s+/g, ' '),
          opacity: Number(getComputedStyle(heading).opacity),
          invisibleChildren: [...heading.querySelectorAll('*')].filter((child) => child.getClientRects().length && Number(getComputedStyle(child).opacity) < 0.08).length,
        })).filter((heading) => heading.opacity < 0.08 || heading.invisibleChildren)
        return {
          clientWidth: root.clientWidth,
          scrollWidth: root.scrollWidth,
          reachableHorizontalScroll,
          hiddenHeadings,
          canvases: [...document.querySelectorAll('canvas')].map((canvas) => ({
            className: canvas.className,
            cssWidth: canvas.clientWidth,
            cssHeight: canvas.clientHeight,
            bitmapWidth: canvas.width,
            bitmapHeight: canvas.height,
          })),
          activeProof: [...document.querySelectorAll('.proof-list article.is-active')].length,
          visibleApps: [...document.querySelectorAll('.app-panels article')].filter((panel) => Number(getComputedStyle(panel).opacity) > 0.9).length,
        }
      })

      const report = { browserName, viewportName, width, height, routeName, route, ...summary, samples, errors, failures }
      allReports.push(report)
      const issues = [
        ...(summary.reachableHorizontalScroll ? [`horizontal:${summary.clientWidth}/${summary.scrollWidth}/${summary.reachableHorizontalScroll}`] : []),
        ...(summary.hiddenHeadings.length ? [`hidden-headings:${summary.hiddenHeadings.length}`] : []),
        ...(samples.length ? [`animation-samples:${samples.length}`] : []),
        ...(errors.length ? [`errors:${errors.length}`] : []),
        ...(failures.length ? [`failures:${failures.length}`] : []),
      ]
      console.log(JSON.stringify({ browserName, viewportName, routeName, issues }))
      if (issues.length) await page.screenshot({ path: `${output}/${browserName}-${viewportName}-${routeName}-issue.png` })
      await page.close()
    }
    await context.close()
  }
  await browser.close()
}

await writeFile(`${output}/report.json`, JSON.stringify(allReports, null, 2))
