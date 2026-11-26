import { readFile } from 'node:fs/promises'

import { expect } from '@playwright/test'
import { Duration } from 'effect'
import { PDFDocument } from 'pdf-lib'
import { test } from '~e2e/test/fixtures'

test('a failed document keeps the selection and can be retried without silently saving a partial package', async ({
  onboarded: { page },
}) => {
  let downloads = 0
  page.on('download', () => downloads++)
  await page
    .context()
    .route('**/prawo-budowlane/pdf/download', route =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }),
    )
  await page.goto('/zrodla/pakiet')
  await page.getByRole('button', { name: 'Pobierz pakiet PDF' }).click()
  await expect(page.getByRole('alert')).toContainText('Prawo budowlane')
  await expect(page.getByRole('button', { name: 'Spróbuj ponownie' })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: /Prawo budowlane/ })).toBeChecked()
  expect(downloads).toBe(0)

  await page.context().unroute('**/prawo-budowlane/pdf/download')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Spróbuj ponownie' }).click()
  const merged = await PDFDocument.load(await readFile(await (await download).path()))
  expect(merged.getPageCount()).toBe(18)
})

test('removing a failed document is deliberate and keeps the remaining selection across reloads', async ({
  onboarded: { page },
}) => {
  let downloads = 0
  page.on('download', () => downloads++)
  await page
    .context()
    .route('**/prawo-budowlane/pdf/download', route =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }),
    )
  await page.goto('/zrodla/pakiet')
  await page.getByRole('button', { name: 'Pobierz pakiet PDF' }).click()
  await page.getByRole('button', { name: 'Usuń z pakietu' }).click()
  await expect(page.getByRole('checkbox', { name: /Prawo budowlane/ })).not.toBeChecked()
  await expect(page.getByRole('checkbox', { name: /samorządach zawodowych/ })).toBeChecked()
  expect(downloads).toBe(0)

  await page.reload()
  await expect(page.getByRole('checkbox', { name: /Prawo budowlane/ })).not.toBeChecked()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Pobierz pakiet PDF' }).click()
  const merged = await PDFDocument.load(await readFile(await (await download).path()))
  expect(merged.getPageCount()).toBe(9)
})

test('cancelling a download stops assembly and allows a fresh attempt with the same selection', async ({
  onboarded: { page },
}) => {
  let downloads = 0
  page.on('download', () => downloads++)
  const fixtureUrl = 'http://localhost:4100/package-cancel.pdf'
  await page
    .context()
    .route('**/pdf/download', route => route.fulfill({ json: { url: fixtureUrl } }))
  let releaseDownload: () => void = () => {}

  const released = new Promise<void>(resolve => {
    releaseDownload = resolve
  })

  await page.context().route(fixtureUrl, async route => {
    await released
    await route.fulfill({ status: 500 })
  })
  await page.goto('/zrodla/pakiet')
  await expect(page.getByText('Dokumenty: 2 · Liczba stron: 18')).toBeVisible()
  const downloading = page.waitForRequest(fixtureUrl)
  await page.getByRole('button', { name: 'Pobierz pakiet PDF' }).click()
  await downloading
  await expect(page.getByRole('button', { name: 'Anuluj przygotowanie' })).toBeVisible()
  await page.getByRole('button', { name: 'Anuluj przygotowanie' }).click()
  releaseDownload()
  await expect(page.getByRole('status')).toContainText('Przygotowanie pakietu zostało anulowane.')
  await expect(page.getByRole('button', { name: 'Pobierz pakiet PDF' })).toBeEnabled()
  expect(downloads).toBe(0)
  await expect(page.getByRole('checkbox', { name: /Prawo budowlane/ })).toBeChecked()
  await page.context().unroute('**/pdf/download')
  await page.context().unroute(fixtureUrl)
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Pobierz pakiet PDF' }).click()
  const merged = await PDFDocument.load(await readFile(await (await download).path()))
  expect(merged.getPageCount()).toBe(18)
})

test('a 1500-page package finishes with CPU throttling while the page keeps rendering', async ({
  onboarded: { page },
}) => {
  test.setTimeout(Duration.toMillis(Duration.minutes(2)))
  const source = await PDFDocument.create()

  for (let index = 0; index < 750; index++) {
    source.addPage().drawText(`Fixture page ${index + 1}`)
  }

  const bytes = Buffer.from(await source.save())
  const fixtureUrl = 'http://localhost:4100/package-performance.pdf'
  await page
    .context()
    .route('**/pdf/download', route => route.fulfill({ json: { url: fixtureUrl } }))
  await page.context().route(fixtureUrl, route =>
    route.fulfill({
      body: bytes,
      contentType: 'application/pdf',
      headers: { 'access-control-allow-origin': '*' },
    }),
  )
  await page.goto('/zrodla/pakiet')
  await expect(page.getByText('Dokumenty: 2 · Liczba stron: 18')).toBeVisible()
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })

  try {
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Pobierz pakiet PDF' }).click()
    await expect(page.getByRole('button', { name: 'Anuluj przygotowanie' })).toBeVisible()

    const responsiveness = page.evaluate(async () => {
      const gaps: Array<number> = []
      let previous = performance.now()

      while (
        [...document.querySelectorAll('button')].some(button =>
          button.textContent?.includes('Anuluj przygotowanie'),
        )
      ) {
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
        const now = performance.now()
        gaps.push(now - previous)
        previous = now
      }

      return { frames: gaps.length, longestFrame: Math.max(...gaps) }
    })

    const file = await download
    const rendering = await responsiveness
    expect(rendering.frames).toBeGreaterThan(3)
    expect(rendering.longestFrame).toBeLessThan(Duration.toMillis(Duration.seconds(1)))
    const merged = await PDFDocument.load(await readFile(await file.path()))
    expect(merged.getPageCount()).toBe(1504)
  } finally {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    await cdp.detach()
  }
})

test('an expired signed URL is refreshed through the API once and the package completes', async ({
  onboarded: { page },
}) => {
  const expiredUrl = 'http://localhost:4100/package-expired.pdf'
  let issuedUrls = 0
  await page
    .context()
    .route(expiredUrl, route =>
      route.fulfill({ status: 403, headers: { 'access-control-allow-origin': '*' } }),
    )
  await page.context().route('**/prawo-budowlane/pdf/download', route => {
    issuedUrls++

    return issuedUrls === 1 ? route.fulfill({ json: { url: expiredUrl } }) : route.fallback()
  })
  await page.goto('/zrodla/pakiet')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Pobierz pakiet PDF' }).click()
  const merged = await PDFDocument.load(await readFile(await (await download).path()))
  expect(merged.getPageCount()).toBe(18)
  expect(issuedUrls).toBe(2)
  await expect(page.getByRole('alert')).toHaveCount(0)
})
