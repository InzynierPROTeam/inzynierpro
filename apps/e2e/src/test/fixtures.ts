import type { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import { getAuthClient } from '@inzpro/auth-client'
import { type CookieJar, makeCookieJar } from '@inzpro/testing/cookie-jar'
import { test as base, expect, type Page } from '@playwright/test'

import { apiUrl, businessTime, platformUrl } from '../environment'
import { latestSignInCode } from './outbox'

// A seeded technical path: building construction, full scope, both exams, an open session.
// Mirrors `technicalConfiguration` in `apps/api/src/test/preparation.ts`; the suite cannot import
// API sources, so update both when the technical seed changes.
export const technicalConfiguration = {
  specializationId: '60000000-0000-4000-8000-000000000001',
  qualificationKindId: '70000000-0000-4000-8000-000000000001',
  qualificationScopeId: '80000000-0000-4000-8000-000000000001',
  accessScope: 'both',
  examSessionId: '90000000-0000-4000-8000-000000000001',
  oralExamDate: null,
} satisfies typeof CompleteOnboardingPayload.Encoded

// The second seeded path: architecture design in a restricted scope with three Building Law
// questions, so its learning round can be finished in a few answers.
export const smallPathConfiguration = {
  specializationId: '60000000-0000-4000-8000-000000000002',
  qualificationKindId: '70000000-0000-4000-8000-000000000002',
  qualificationScopeId: '80000000-0000-4000-8000-000000000002',
  accessScope: 'both',
  examSessionId: '90000000-0000-4000-8000-000000000002',
  oralExamDate: null,
} satisfies typeof CompleteOnboardingPayload.Encoded

export const uniqueEmail = (label: string) => `e2e-${label}-${crypto.randomUUID()}@example.com`

// Every Node-side visitor reports its own address, so sign-in rate limits never collide.
const uniqueAddress = () => `10.${[0, 0, 0].map(() => Math.floor(Math.random() * 255)).join('.')}`

const signInThroughApi = async (email: string) => {
  const jar = makeCookieJar({ origin: platformUrl, 'x-forwarded-for': uniqueAddress() })
  const auth = getAuthClient({ baseURL: apiUrl, fetchOptions: { customFetchImpl: jar.fetch } })

  const sent = await auth.emailOtp.sendVerificationOtp({ email, type: 'sign-in' })
  expect(sent.error).toBeNull()

  const signedIn = await auth.signIn.emailOtp({ email, otp: await latestSignInCode(email) })
  expect(signedIn.error).toBeNull()

  return jar
}

type Account = { readonly email: string }

type SignedInPage = { readonly page: Page; readonly account: Account }

// Declines optional cookies up front, so the consent banner never covers the page.
const declineOptionalCookies = (page: Page) =>
  page.context().addCookies([
    {
      name: 'cookie-consent',
      value: JSON.stringify({
        Analytics: { consented: false, timestamp: businessTime },
        Social: { consented: false, timestamp: businessTime },
        Advertising: { consented: false, timestamp: businessTime },
      }),
      url: platformUrl,
    },
  ])

const shareSession = (page: Page, jar: CookieJar) =>
  page
    .context()
    .addCookies([...jar.cookies].map(([name, value]) => ({ name, value, url: platformUrl })))

export const test = base.extend<{
  pathConfiguration: typeof CompleteOnboardingPayload.Encoded
  accessScope: typeof CompleteOnboardingPayload.Encoded.accessScope
  visitor: Page
  signedIn: SignedInPage
  onboarded: SignedInPage
}>({
  pathConfiguration: [technicalConfiguration, { option: true }],
  accessScope: ['both', { option: true }],
  visitor: async ({ page }, use) => {
    const address = uniqueAddress()

    // Each test is its own client, as separate people are, so rate limits never collide. The
    // header is set below the page, so it adds no CORS preflight.
    await page
      .context()
      .route(`${apiUrl}/**`, route =>
        route.continue({ headers: { ...route.request().headers(), 'x-forwarded-for': address } }),
      )
    // Browser code sees the same date as the API. Server rendering in the Cloudflare runtime keeps
    // the real clock, so pages must take dates from the API rather than compute them.
    await page.clock.setFixedTime(businessTime)
    await declineOptionalCookies(page)
    await use(page)
  },
  signedIn: async ({ visitor }, use) => {
    const email = uniqueEmail('signed-in')

    await shareSession(visitor, await signInThroughApi(email))
    await use({ page: visitor, account: { email } })
  },
  onboarded: async ({ visitor, pathConfiguration, accessScope }, use) => {
    const email = uniqueEmail('onboarded')
    const jar = await signInThroughApi(email)

    const response = await jar.fetch(`${apiUrl}/api/v1/preparation/onboarding`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...pathConfiguration, accessScope }),
    })

    expect(response.ok).toBe(true)

    await shareSession(visitor, jar)
    await use({ page: visitor, account: { email } })
  },
})
