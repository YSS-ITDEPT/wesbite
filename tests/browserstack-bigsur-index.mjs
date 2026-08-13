import { mkdir, writeFile } from 'node:fs/promises'
import { Builder } from 'selenium-webdriver'

const username = process.env.BROWSERSTACK_USERNAME
const accessKey = process.env.BROWSERSTACK_ACCESS_KEY
const baseUrl = (process.env.TEST_BASE_URL || 'https://nearly-jose-meat-progressive.trycloudflare.com').replace(/\/$/, '')

if (!username || !accessKey) throw new Error('BrowserStack credentials are required')

let driver
const output = 'test-results/browserstack/bigsur-index-fixed'

const capture = async (name) => {
  const image = await driver.takeScreenshot()
  await writeFile(`${output}/${name}.png`, image, 'base64')
}

const sample = async (selector, progress, name) => {
  await driver.executeScript(`
    const section = document.querySelector(arguments[0]);
    const range = Math.max(0, section.offsetHeight - innerHeight);
    scrollTo(0, section.offsetTop + range * arguments[1]);
  `, selector, progress)
  await driver.sleep(700)
  await capture(name)
}

try {
  await mkdir(output, { recursive: true })
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
        buildName: 'Index legacy Safari compatibility',
        sessionName: 'Big Sur Safari 14.1 Index sections',
        resolution: '1920x1080',
        debug: true,
        networkLogs: true,
      },
    })
    .build()

  if (process.env.TEST_WINDOW_WIDTH && process.env.TEST_WINDOW_HEIGHT) {
    await driver.manage().window().setRect({
      width: Number(process.env.TEST_WINDOW_WIDTH),
      height: Number(process.env.TEST_WINDOW_HEIGHT),
    })
  }

  await driver.get(`${baseUrl}/index.html`)
  await driver.wait(async () => driver.executeScript(
    "return document.readyState === 'complete' && document.querySelector('[data-page-loader]')?.classList.contains('is-hidden')",
  ), 30000)

  const environment = await driver.executeScript(`return {
    legacy: document.documentElement.classList.contains('is-legacy-mac-safari'),
    viewport: [innerWidth, innerHeight],
    heroHeight: document.querySelector('.index-hero-showcase')?.offsetHeight,
    mediaHeight: document.querySelector('.parade-media')?.offsetHeight,
    bodyHeight: document.body.scrollHeight,
    lenisNative: Boolean(window.__anikaLegacyMacSafari)
  }`)

  if (!environment.legacy) throw new Error('Legacy Safari capability class was not selected')
  if (environment.heroHeight < environment.viewport[1] * 0.95) throw new Error(`Hero collapsed to ${environment.heroHeight}px`)
  if (environment.mediaHeight < 300) throw new Error(`Product media collapsed to ${environment.mediaHeight}px`)

  await sample('.applications', 0.08, '01-applications-start')
  await sample('.applications', 0.32, '02-applications-02')
  await sample('.applications', 0.72, '03-applications-04')
  const applicationLayout = await driver.executeScript(`
    const article = document.querySelector('.app-panels article.is-active');
    const copy = article?.querySelector(':scope > div');
    const nav = document.querySelector('.app-nav');
    const copyRect = copy?.getBoundingClientRect();
    const navRect = nav?.getBoundingClientRect();
    return {
      htmlClass: document.documentElement.className,
      mediaShort: matchMedia('(min-width: 801px) and (max-height: 760px)').matches,
      copyBottomStyle: copy ? getComputedStyle(copy).bottom : null,
      copyDisplay: copy ? getComputedStyle(copy).display : null,
      copyRect: copyRect ? { top: copyRect.top, bottom: copyRect.bottom, height: copyRect.height } : null,
      navRect: navRect ? { top: navRect.top, bottom: navRect.bottom, height: navRect.height } : null,
      headingRect: article?.querySelector('h3')?.getBoundingClientRect().toJSON(),
      paragraphRect: article?.querySelector('p')?.getBoundingClientRect().toJSON(),
    }
  `)
  await sample('.product-parade', 0.18, '04-products-01')
  await sample('.product-parade', 0.58, '05-products-03')
  await sample('.proof-overview', 0.12, '06-proof-01')
  await sample('.proof-overview', 0.88, '07-proof-06')
  await sample('.closing', 0, '08-closing')

  await driver.executeScript("document.querySelector('.site-footer')?.scrollIntoView({ block: 'center' })")
  await driver.sleep(500)
  const footerSeal = await driver.executeScript(`
    const seal = document.querySelector('.footer-seal > div');
    const rect = seal?.getBoundingClientRect();
    return rect ? { width: rect.width, height: rect.height } : null;
  `)
  if (!footerSeal || Math.abs(footerSeal.width - footerSeal.height) > 1) {
    throw new Error(`Footer seal is not circular: ${JSON.stringify(footerSeal)}`)
  }
  await capture('09-footer-seal')

  const state = await driver.executeScript(`return {
    activeApplication: [...document.querySelectorAll('.app-panels article')].findIndex(el => el.classList.contains('is-active')),
    visibleProductImages: [...document.querySelectorAll('.parade-media img')].filter(img => Number(getComputedStyle(img).opacity) > .9).length,
    activeProof: [...document.querySelectorAll('.proof-list article')].findIndex(el => el.classList.contains('is-active')),
    errors: window.__anikaTestErrors || []
  }`)

  await driver.executeScript(`browserstack_executor: ${JSON.stringify({
    action: 'setSessionStatus',
    arguments: { status: 'passed', reason: `Legacy layout and all Index scroll chapters rendered: ${JSON.stringify(environment)}` },
  })}`)
  console.log(JSON.stringify({ environment, applicationLayout, footerSeal, state }, null, 2))
} catch (error) {
  if (driver) {
    await driver.executeScript(`browserstack_executor: ${JSON.stringify({
      action: 'setSessionStatus',
      arguments: { status: 'failed', reason: error.message },
    })}`).catch(() => {})
  }
  throw error
} finally {
  if (driver) await driver.quit().catch(() => {})
}
