import { createRootRoute, createRouter, RouterContextProvider } from '@tanstack/react-router'
import { DateTime, Effect } from 'effect'
import { act, StrictMode } from 'react'
import { useCookieConsent } from 'react-cookie-manager'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ThemeProvider } from '../providers/theme-provider.js'
import { loadGoogleTagManager } from '../side-effects/google-tag-manager.js'
import { setMetaPixelConsent } from '../side-effects/meta-pixel.js'
import { CookieConsent, type TrackingConsent } from './cookie-consent.js'

Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, configurable: true })

window.matchMedia = query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => true,
})

let root: Root | undefined

beforeEach(() => vi.useFakeTimers())

afterEach(async () => {
  await act(async () => root?.unmount())
  root = undefined
  document.cookie = 'cookie-consent=; Max-Age=0; path=/'
  document.body.innerHTML = ''
  document.head.querySelectorAll('script').forEach(script => script.remove())
  delete window.dataLayer
  delete window.fbq
  delete window._fbq
  vi.useRealTimers()
})

function ConsentControls() {
  const { showConsentBanner } = useCookieConsent()

  return <button onClick={showConsentBanner}>Change consent</button>
}

async function mountConsent(pixelId: string) {
  const router = createRouter({ routeTree: createRootRoute(), isServer: false })
  const container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)

  function onConsentChange(consent: TrackingConsent) {
    if (consent.analytics || consent.advertising) {
      loadGoogleTagManager('GTM-TEST123')
    }

    setMetaPixelConsent(pixelId, consent.advertising)
  }

  await act(async () =>
    root?.render(
      <StrictMode>
        <RouterContextProvider router={router}>
          <ThemeProvider>
            <CookieConsent onConsentChange={onConsentChange}>
              <ConsentControls />
            </CookieConsent>
          </ThemeProvider>
        </RouterContextProvider>
      </StrictMode>,
    ),
  )
}

async function clickButton(text: string) {
  const button = [...document.querySelectorAll('button')].find(item => item.textContent === text)
  expect(button).toBeDefined()
  await act(async () => {
    button?.click()
    await vi.advanceTimersByTimeAsync(500)
  })
}

test('loads only after consent and avoids duplicate initialization on repeated acceptance', async () => {
  await mountConsent('100000001')
  expect(document.querySelector('script[src*="googletagmanager.com"]')).toBeNull()
  expect(document.querySelector('script[src*="connect.facebook.net"]')).toBeNull()
  expect(window.dataLayer?.[0]).toMatchObject({
    0: 'consent',
    1: 'default',
    2: { analytics_storage: 'denied', ad_storage: 'denied' },
  })

  await clickButton('Akceptuję wszystkie')
  expect(document.querySelectorAll('script[src*="googletagmanager.com"]')).toHaveLength(1)
  expect(document.querySelectorAll('script[src*="connect.facebook.net"]')).toHaveLength(1)
  expect(window.fbq?.queue).toContainEqual(['init', '100000001'])

  await clickButton('Change consent')
  await clickButton('Akceptuję wszystkie')
  expect(document.querySelectorAll('script[src*="googletagmanager.com"]')).toHaveLength(1)
  expect(document.querySelectorAll('script[src*="connect.facebook.net"]')).toHaveLength(1)
  expect(window.fbq?.queue.filter(entry => entry[0] === 'init')).toHaveLength(1)
  expect(window.fbq?.queue.filter(entry => entry[0] === 'track')).toHaveLength(1)

  await clickButton('Change consent')
  await clickButton('Odrzuć opcjonalne')
  expect(window.fbq?.queue.at(-1)).toEqual(['consent', 'revoke'])
  expect(window.dataLayer?.at(-1)).toMatchObject({
    0: 'consent',
    1: 'update',
    2: { analytics_storage: 'denied', ad_storage: 'denied' },
  })
})

test('restores analytics consent without loading advertising trackers', async () => {
  const timestamp = Effect.runSync(Effect.map(DateTime.now, DateTime.formatIso))

  const consent = {
    Analytics: { consented: true, timestamp },
    Social: { consented: false, timestamp },
    Advertising: { consented: false, timestamp },
  }

  document.cookie = `cookie-consent=${JSON.stringify(consent)}; path=/`

  await mountConsent('100000002')
  expect(document.querySelectorAll('script[src*="googletagmanager.com"]')).toHaveLength(1)
  expect(document.querySelector('script[src*="connect.facebook.net"]')).toBeNull()
  expect(window.dataLayer?.[1]).toMatchObject({
    0: 'consent',
    1: 'update',
    2: { analytics_storage: 'granted', ad_storage: 'denied' },
  })
})
