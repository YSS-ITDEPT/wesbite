import { mkdir, writeFile } from 'node:fs/promises'
import { resolve as resolvePath } from 'node:path'
import { Builder, until } from 'selenium-webdriver'
import browserstackLocal from 'browserstack-local'

const username = process.env.BROWSERSTACK_USERNAME
const accessKey = process.env.BROWSERSTACK_ACCESS_KEY
const baseUrl = (process.env.TEST_BASE_URL || 'http://localhost:4174').replace(/\/$/, '')
const needsLocalTunnel = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(baseUrl)

if (!username || !accessKey) {
  throw new Error('Set BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY before running this test.')
}

const local = new browserstackLocal.Local()
const localIdentifier = `anika-ventura-${Date.now()}`
let driver

const startLocal = () => new Promise((done, reject) => {
  local.start({
    key: accessKey,
    localIdentifier,
    forceLocal: true,
    onlyAutomate: true,
    logFile: resolvePath('browserstack-local.log'),
  }, (error) => error ? reject(error) : done())
})

const stopLocal = () => new Promise((resolve) => {
  if (!local.isRunning()) {
    resolve()
    return
  }
  local.stop(() => resolve())
})

const setSessionStatus = async (status, reason) => {
  if (!driver) return
  const payload = JSON.stringify({ action: 'setSessionStatus', arguments: { status, reason } })
  await driver.executeScript(`browserstack_executor: ${payload}`)
}

try {
  if (needsLocalTunnel) await startLocal()

  const browserstackOptions = {
    os: 'OS X',
    osVersion: 'Ventura',
    userName: username,
    accessKey,
    projectName: 'Anika Sterilis Website',
    buildName: 'Ventura native Safari compatibility',
    sessionName: 'Safari 16.5 Solutions fixed-frame scroll',
    debug: true,
    networkLogs: true,
  }
  if (needsLocalTunnel) {
    browserstackOptions.local = true
    browserstackOptions.localIdentifier = localIdentifier
  }

  driver = await new Builder()
    .usingServer('https://hub-cloud.browserstack.com/wd/hub')
    .withCapabilities({
      browserName: 'Safari',
      browserVersion: '16.5',
      'bstack:options': browserstackOptions,
    })
    .build()

  await driver.get(`${baseUrl}/solutions`)
  await driver.wait(async () => driver.executeScript(
    "return Boolean(document.querySelector('.aacts'))",
  ), 30000, 'Solutions application did not mount')
  await driver.wait(async () => driver.executeScript(
    "return document.querySelector('[data-page-loader]')?.classList.contains('is-hidden') === true",
  ), 30000, 'Page loader did not finish')

  await driver.wait(async () => driver.executeScript(
    "return document.querySelector('.aacts')?.classList.contains('aacts--fixed-safari') === true",
  ), 10000, 'Ventura Safari did not select the fixed-frame renderer')

  await driver.wait(async () => driver.executeScript(
    "const image=document.querySelector('.product-frame-poster--active'); return Boolean(image && image.complete && image.naturalWidth)",
  ), 30000, 'Opening product frame did not paint')

  const openingFrame = await driver.executeScript(
    "return document.querySelector('.product-frame-poster--active')?.getAttribute('src')",
  )

  for (let index = 0; index < 6; index += 1) {
    await driver.executeScript(
      "window.dispatchEvent(new WheelEvent('wheel',{deltaY:4,bubbles:true,cancelable:true}))",
    )
    await driver.sleep(45)
  }

  await driver.wait(async () => {
    const currentFrame = await driver.executeScript(
      "return document.querySelector('.product-frame-poster--active')?.getAttribute('src')",
    )
    return Boolean(currentFrame && currentFrame !== openingFrame)
  }, 5000, 'Small Ventura trackpad deltas did not reveal a new frame')

  const productBeforeHandoff = await driver.executeScript(
    "return new URL(location.href).searchParams.get('product')",
  )
  if (productBeforeHandoff !== null) {
    throw new Error('A partial gesture skipped product 01 before its sequence completed')
  }

  for (let index = 0; index < 9; index += 1) {
    await driver.executeScript(
      "window.dispatchEvent(new WheelEvent('wheel',{deltaY:120,bubbles:true,cancelable:true}))",
    )
    await driver.sleep(45)
  }

  await driver.wait(async () => driver.executeScript(
    "return /frame_000120\\.webp$/.test(document.querySelector('.product-frame-poster--active')?.getAttribute('src') || '')",
  ), 7000, 'Final product frame was not revealed')

  await driver.sleep(700)
  await driver.executeScript(
    "window.dispatchEvent(new WheelEvent('wheel',{deltaY:120,bubbles:true,cancelable:true}))",
  )
  await driver.wait(until.urlContains('product=card'), 7000, 'Separate gesture did not advance to product 02')
  await driver.wait(async () => driver.executeScript(
    `const image=document.querySelector('.product-frame-poster--active');
     return Boolean(
       image &&
       /sample-card-frames-webp\\/frame_000035\\.webp$/.test(image.getAttribute('src') || '') &&
       image.complete &&
       image.naturalWidth > 0
     )`,
  ), 15000, 'Product 02 opening frame did not decode after handoff')
  await driver.sleep(700)

  await mkdir('test-results/browserstack', { recursive: true })
  const screenshot = await driver.takeScreenshot()
  await writeFile('test-results/browserstack/ventura-safari-16.5-solutions.png', screenshot, 'base64')

  await setSessionStatus('passed', 'Small deltas painted immediately; final frame and product handoff passed.')
  console.log('PASS: native Safari 16.5 on macOS Ventura revealed frames and advanced product-by-product.')
} catch (error) {
  if (driver) {
    await mkdir('test-results/browserstack', { recursive: true }).catch(() => {})
    const diagnostics = await driver.executeScript(`return {
      url: location.href,
      title: document.title,
      readyState: document.readyState,
      loaderClass: document.querySelector('[data-page-loader]')?.className || null,
      loaderProgress: document.querySelector('[data-boot-count]')?.textContent || null,
      appMounted: Boolean(document.querySelector('.aacts')),
      bodyText: document.body?.innerText?.slice(0, 300) || ''
    }`).catch(() => null)
    const screenshot = await driver.takeScreenshot().catch(() => null)
    if (screenshot) {
      await writeFile(
        'test-results/browserstack/ventura-safari-16.5-failure.png',
        screenshot,
        'base64',
      ).catch(() => {})
    }
    console.error('Native Safari diagnostics:', diagnostics)
  }
  await setSessionStatus('failed', error.message).catch(() => {})
  console.error(error)
  process.exitCode = 1
} finally {
  if (driver) await driver.quit().catch(() => {})
  if (needsLocalTunnel) await stopLocal()
}
