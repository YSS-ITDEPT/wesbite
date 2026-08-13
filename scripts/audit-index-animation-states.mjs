import { chromium, webkit } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const output = 'test-results/index-animation-states'
await mkdir(output, { recursive: true })

const profiles = [
  ['windows-chrome', chromium, {
    viewport: { width: 1366, height: 768 },
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  }],
  ['macos-safari', webkit, {
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
  }],
]

for (const [name, engine, options] of profiles) {
  const browser = await engine.launch(options.executablePath ? { executablePath: options.executablePath } : {})
  const context = await browser.newContext({ viewport: options.viewport, userAgent: options.userAgent })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()))
  page.on('requestfailed', (request) => errors.push(`${request.url()} — ${request.failure()?.errorText}`))
  await page.goto('http://localhost:4174/index.html', { waitUntil: 'networkidle' })
  await page.waitForTimeout(4500)

  const states = { proof: [], applications: [] }
  const proofGeometry = await page.evaluate(() => {
    const section = document.querySelector('[data-proof-overview]')
    return {
      top: section.getBoundingClientRect().top + scrollY,
      range: Math.max(0, section.offsetHeight - innerHeight),
    }
  })
  for (let index = 0; index < 6; index++) {
    await page.evaluate(({ index, geometry }) =>
      scrollTo(0, geometry.top + geometry.range * (index / 5)),
    { index, geometry: proofGeometry })
    await page.waitForTimeout(650)
    const state = await page.evaluate(() => ({
      active: [...document.querySelectorAll('.proof-list article')].map((card, i) => card.classList.contains('is-active') ? i + 1 : null).filter(Boolean),
      current: document.querySelector('[data-proof-current]')?.textContent.trim(),
      cards: [...document.querySelectorAll('.proof-list article')].map((card) => ({
        opacity: getComputedStyle(card).opacity,
        title: card.querySelector('h3')?.textContent.trim(),
      })),
    }))
    states.proof.push(state)
    await page.screenshot({ path: `${output}/${name}-proof-${index + 1}.png` })
  }

  if (!await page.evaluate(() => document.documentElement.classList.contains('is-safari'))) {
    const appGeometry = await page.evaluate(() => {
      const section = document.querySelector('.applications')
      return {
        top: section.getBoundingClientRect().top + scrollY,
        range: Math.max(0, section.offsetHeight - innerHeight),
      }
    })
    for (let index = 0; index < 5; index++) {
      await page.evaluate(({ index, geometry }) =>
        scrollTo(0, geometry.top + geometry.range * ((index + 0.08) / 5)),
      { index, geometry: appGeometry })
      await page.waitForTimeout(650)
      const state = await page.evaluate(() => ({
        active: [...document.querySelectorAll('.app-panels article')].findIndex((panel) => panel.classList.contains('is-active')) + 1,
        title: document.querySelector('.app-heading h2')?.textContent.trim().replace(/\s+/g, ' '),
        panelOpacity: [...document.querySelectorAll('.app-panels article')].map((panel) => getComputedStyle(panel).opacity),
      }))
      states.applications.push(state)
      await page.screenshot({ path: `${output}/${name}-application-${index + 1}.png` })
    }
  } else {
    states.applications = await page.evaluate(() => [...document.querySelectorAll('.app-panels article')].map((panel) => ({
      opacity: getComputedStyle(panel).opacity,
      height: Math.round(panel.getBoundingClientRect().height),
      title: panel.querySelector('h3')?.textContent.trim(),
    })))
  }

  const report = { name, states, errors }
  await writeFile(`${output}/${name}.json`, JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report))
  await context.close()
  await browser.close()
}
