import puppeteer from 'puppeteer-core'

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const page = await browser.newPage()
await page.setViewport({ width: 1860, height: 900 })
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text())
})
await page.goto('http://localhost:4174/index.html#applications', { waitUntil: 'networkidle0' })
await new Promise((resolve) => setTimeout(resolve, 4000))

const rows = await page.$$('[data-parade-row]')
for (let index = 0; index < rows.length; index += 1) {
  await rows[index].evaluate((row) => row.scrollIntoView({ block: 'center' }))
  await new Promise((resolve) => setTimeout(resolve, 900))
  const state = await rows[index].evaluate((row) => {
    const media = row.querySelector('.parade-media')
    const copy = row.querySelector('.parade-copy')
    const heading = row.querySelector('h3')
    return {
      title: heading?.textContent.trim(),
      mediaOpacity: getComputedStyle(media).opacity,
      mediaClip: getComputedStyle(media).clipPath,
      copyOpacity: getComputedStyle(copy).opacity,
      headingOpacity: getComputedStyle(heading).opacity,
    }
  })
  console.log(JSON.stringify({ index: index + 1, ...state }))
}
console.log(JSON.stringify({ errors }))
await browser.close()
