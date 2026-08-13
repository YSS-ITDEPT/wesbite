import { webkit } from '@playwright/test'

const browser = await webkit.launch()
const page = await browser.newPage({ viewport: { width: 900, height: 700 } })
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text())
})
await page.goto('http://localhost:4174/index.html#applications', { waitUntil: 'networkidle' })
await page.waitForTimeout(4000)

const result = await page.evaluate(() => ({
  safariClass: document.documentElement.classList.contains('is-safari'),
  applicationHeight: Math.round(document.querySelector('.applications').getBoundingClientRect().height),
  applications: [...document.querySelectorAll('.app-panels article')].map((article) => ({
    title: article.querySelector('h3')?.textContent.trim(),
    height: Math.round(article.getBoundingClientRect().height),
    opacity: getComputedStyle(article).opacity,
    position: getComputedStyle(article).position,
    top: Math.round(article.getBoundingClientRect().top),
  })),
  panelHeight: Math.round(document.querySelector('.app-panels').getBoundingClientRect().height),
  pinHeight: Math.round(document.querySelector('.applications-pin').getBoundingClientRect().height),
  products: [...document.querySelectorAll('[data-parade-row]')].map((row) => ({
    title: row.querySelector('h3')?.textContent.trim(),
    copyOpacity: getComputedStyle(row.querySelector('.parade-copy')).opacity,
    headingOpacity: getComputedStyle(row.querySelector('h3')).opacity,
  })),
}))

console.log(JSON.stringify({ ...result, errors }, null, 2))
await browser.close()
