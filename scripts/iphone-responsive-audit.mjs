import puppeteer from 'puppeteer-core'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const output = process.argv[2] || path.join(process.cwd(), 'iphone-audit')
await mkdir(output, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--no-sandbox'],
})

const devices = [
  ['iphone-15', 393, 852],
  ['iphone-pro-max', 440, 956],
  ['iphone-landscape', 852, 393],
]

for (const [name, width, height] of devices) {
  for (const [pageName, url] of [['index', 'http://localhost:4174/'], ['contact', 'http://localhost:4174/contact']]) {
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1')
    await page.setViewport({ width, height, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await page.goto(url, { waitUntil: 'networkidle0' })
    await new Promise((resolve) => setTimeout(resolve, 4500))
    await page.screenshot({ path: path.join(output, `${name}-${pageName}-top.png`) })

    const report = await page.evaluate(() => {
      const root = document.documentElement
      const offenders = [...document.querySelectorAll('body *')].filter((element) => {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        return style.position !== 'fixed' && rect.width > 0 && (rect.left < -1 || rect.right > root.clientWidth + 1)
      }).slice(0, 25).map((element) => ({
        selector: `${element.tagName.toLowerCase()}.${[...element.classList].join('.')}`,
        left: Math.round(element.getBoundingClientRect().left),
        right: Math.round(element.getBoundingClientRect().right),
      }))
      const initialLeft = root.scrollLeft
      root.scrollLeft = 100
      const reachableHorizontalScroll = root.scrollLeft
      root.scrollLeft = initialLeft
      return { clientWidth: root.clientWidth, scrollWidth: root.scrollWidth, reachableHorizontalScroll, offenders }
    })
    console.log(JSON.stringify({ name, pageName, ...report }))
    await page.close()
  }
}

await browser.close()
