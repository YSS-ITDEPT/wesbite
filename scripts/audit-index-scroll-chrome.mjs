import puppeteer from 'puppeteer-core'
import { mkdir } from 'node:fs/promises'

const width = Number(process.env.AUDIT_WIDTH || 1440)
const height = Number(process.env.AUDIT_HEIGHT || 850)
const output = `test-results/index-scroll-chrome-${width}x${height}`
await mkdir(output, { recursive: true })
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const page = await browser.newPage()
await page.setViewport({ width, height })
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text())
})
await page.goto('http://localhost:4174/index.html', { waitUntil: 'networkidle0' })
await new Promise((resolve) => setTimeout(resolve, 4500))

const targets = [
  ...Array.from({ length: 5 }, (_, index) => [`product-${index + 1}`, `[data-parade-row]:nth-of-type(${index + 1})`]),
  ['proof', '#capability'],
  ['applications', '#applications'],
  ['closing', '#closing'],
  ['footer', '[data-footer]'],
]

let currentY = 0
for (const [name, selector] of targets) {
  const destination = await page.$eval(selector, (element) =>
    Math.max(0, element.getBoundingClientRect().top + scrollY - innerHeight * 0.12),
  )
  while (currentY < destination - 20) {
    currentY = Math.min(destination, currentY + 240)
    await page.evaluate((top) => scrollTo(0, top), currentY)
    await new Promise((resolve) => setTimeout(resolve, 45))
  }
  await new Promise((resolve) => setTimeout(resolve, 900))
  const state = await page.$eval(selector, (element) => ({
    rect: Object.fromEntries(['top', 'bottom', 'height'].map((key) => [key, Math.round(element.getBoundingClientRect()[key])])),
    headings: [...element.querySelectorAll('h1,h2,h3')].map((heading) => ({
      text: heading.textContent.trim().replace(/\s+/g, ' '),
      opacity: getComputedStyle(heading).opacity,
      visibility: getComputedStyle(heading).visibility,
      children: [...heading.querySelectorAll('*')].map((child) => ({
        text: child.textContent.trim(),
        opacity: getComputedStyle(child).opacity,
        transform: getComputedStyle(child).transform,
      })).filter((child) => child.opacity !== '1' || child.transform !== 'none').slice(0, 12),
    })),
  }))
  console.log(JSON.stringify({ name, ...state }))
  await page.screenshot({ path: `${output}/${name}.png` })
}
console.log(JSON.stringify({ errors }))
await browser.close()
