import { mkdir, writeFile } from 'node:fs/promises'
import { Builder } from 'selenium-webdriver'

const username = process.env.BROWSERSTACK_USERNAME
const accessKey = process.env.BROWSERSTACK_ACCESS_KEY
const baseUrl = (process.env.TEST_BASE_URL || 'https://nearly-jose-meat-progressive.trycloudflare.com').replace(/\/$/, '')
if (!username || !accessKey) throw new Error('BrowserStack credentials are required')

let driver
try {
  driver = await new Builder()
    .usingServer('https://hub-cloud.browserstack.com/wd/hub')
    .withCapabilities({
      browserName: 'Safari',
      browserVersion: '14.1',
      'bstack:options': {
        os: 'OS X',
        osVersion: 'Big Sur',
        userName: username,
        accessKey,
        projectName: 'Anika Sterilis Website',
        buildName: 'Solutions legacy Safari overlay',
        sessionName: 'Big Sur Safari 14.1 brand overlay',
        resolution: '1920x1080',
        debug: true,
        networkLogs: true,
      },
    })
    .build()

  await driver.manage().window().setRect({ width: 1669, height: 747 })
  await driver.get(`${baseUrl}/solutions?product=card`)
  await driver.wait(async () => driver.executeScript(
    "return document.readyState === 'complete' && document.querySelector('.sample-card__stage-wrap') && document.querySelector('[data-page-loader]')?.classList.contains('is-hidden')",
  ), 30000)
  await driver.executeScript(`
    const section = document.querySelector('.sample-card__stage-wrap');
    scrollTo(0, section.offsetTop + (section.offsetHeight - innerHeight) * .76);
  `)
  await driver.sleep(1200)

  const layout = await driver.executeScript(`
    const overlay = document.querySelector('.video-brand-overlay--sample-card');
    const rect = overlay?.getBoundingClientRect();
    return {
      viewport: [innerWidth, innerHeight],
      route: location.pathname + location.search,
      overlay: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null,
      inlineWidth: overlay?.style.width || null,
      inlineHeight: overlay?.style.height || null,
      cssAspectRatio: CSS.supports('aspect-ratio', '1 / 1'),
    }
  `)
  if (!layout.overlay) throw new Error('Sample Card overlay was not rendered')
  if (Math.abs(layout.overlay.width - layout.overlay.height) > 1) {
    throw new Error(`Overlay is not square: ${JSON.stringify(layout.overlay)}`)
  }

  await mkdir('test-results/browserstack', { recursive: true })
  await writeFile(
    'test-results/browserstack/bigsur-solutions-brand-overlay.png',
    await driver.takeScreenshot(),
    'base64',
  )

  await driver.executeScript("document.querySelector('.site-footer')?.scrollIntoView({ block: 'center' })")
  await driver.sleep(700)
  const footerSeal = await driver.executeScript(`
    const seal = document.querySelector('.footer-seal > div');
    const rect = seal?.getBoundingClientRect();
    const css = seal ? getComputedStyle(seal) : null;
    return rect ? {
      width: rect.width,
      height: rect.height,
      computedWidth: css.width,
      computedHeight: css.height,
      minHeight: css.minHeight,
      maxHeight: css.maxHeight,
      flex: css.flex,
      flexShrink: css.flexShrink,
      display: css.display,
    } : null;
  `)
  if (!footerSeal || Math.abs(footerSeal.width - footerSeal.height) > 1) {
    throw new Error(`Footer seal is not circular: ${JSON.stringify(footerSeal)}`)
  }
  await writeFile(
    'test-results/browserstack/bigsur-solutions-footer-seal.png',
    await driver.takeScreenshot(),
    'base64',
  )
  await driver.executeScript(`browserstack_executor: ${JSON.stringify({
    action: 'setSessionStatus',
    arguments: { status: 'passed', reason: `Brand overlay remained square: ${JSON.stringify(layout.overlay)}` },
  })}`)
  console.log(JSON.stringify({ ...layout, footerSeal }, null, 2))
} catch (error) {
  if (driver) await driver.executeScript(`browserstack_executor: ${JSON.stringify({
    action: 'setSessionStatus', arguments: { status: 'failed', reason: error.message },
  })}`).catch(() => {})
  throw error
} finally {
  if (driver) await driver.quit().catch(() => {})
}
