import { test, expect } from '@playwright/test'

test('home page is healthy in Safari-compatible WebKit', async ({ page }, testInfo) => {
  test.setTimeout(0)

  const consoleErrors = []
  const pageErrors = []
  const failedRequests = []
  const failedResponses = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
      console.error(`[browser console] ${message.text()}`)
    }
  })
  page.on('pageerror', (error) => {
    const detail = error.stack || error.message
    pageErrors.push(detail)
    console.error(`[page error] ${detail}`)
  })
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.method()} ${request.url()} — ${request.failure()?.errorText || 'unknown error'}`)
  })
  page.on('response', (response) => {
    if (response.status() >= 400) {
      failedResponses.push(`${response.status()} ${response.request().method()} ${response.url()}`)
    }
  })

  const response = await page.goto('/', { waitUntil: 'networkidle' })
  await page.pause()

  expect(response, 'The localhost page should return a main-document response').not.toBeNull()
  expect(response.status(), 'The localhost page should load successfully').toBeLessThan(400)

  await expect(page.locator('body')).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath(`safari-${testInfo.project.name}-full-page.png`),
    fullPage: true,
  })

  const diagnostics = [
    ['Console errors', consoleErrors],
    ['Page errors', pageErrors],
    ['Failed requests', failedRequests],
    ['HTTP error responses', failedResponses],
  ].map(([heading, entries]) => `${heading}:\n${entries.length ? entries.join('\n') : 'None'}`).join('\n\n')

  await testInfo.attach('safari-diagnostics', {
    body: diagnostics,
    contentType: 'text/plain',
  })

  console.log(`\n${diagnostics}\n`)

  expect.soft(consoleErrors, 'Browser console errors were detected').toEqual([])
  expect.soft(pageErrors, 'Uncaught page errors were detected').toEqual([])
  expect.soft(failedRequests, 'Network requests failed').toEqual([])
  expect.soft(failedResponses, 'HTTP requests returned error responses').toEqual([])
})
