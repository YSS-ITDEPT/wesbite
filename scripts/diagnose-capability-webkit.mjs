import { webkit } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

const output = 'test-results/capability-webkit-diagnostic'
await mkdir(output, { recursive: true })
const browser = await webkit.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 800 } })
const errors = []
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`)
})
page.on('pageerror', (error) => errors.push(`page: ${error.message}`))
page.on('requestfailed', (request) => errors.push(`request: ${request.url()} — ${request.failure()?.errorText}`))

await page.goto('http://localhost:4174/capability.html', { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)

const cardCount = await page.locator('.safari-discipline-card').count()
console.log(JSON.stringify({ safariClass: await page.locator('html').getAttribute('class'), cardCount }))
for (let index = 0; index < cardCount; index += 1) {
  const card = page.locator('.safari-discipline-card').nth(index)
  await card.scrollIntoViewIfNeeded()
  await page.waitForTimeout(1200)
  const state = await card.evaluate((element) => {
    const image = element.querySelector('img')
    return {
      title: element.querySelector('h3')?.textContent,
      height: Math.round(element.getBoundingClientRect().height),
      image: image?.currentSrc || image?.src,
      naturalWidth: image?.naturalWidth,
      display: getComputedStyle(element).display,
    }
  })
  console.log(JSON.stringify({ index, ...state }))
  await page.screenshot({ path: `${output}/discipline-${index + 1}.png` })
}

console.log(JSON.stringify({ errors }, null, 2))
await browser.close()
