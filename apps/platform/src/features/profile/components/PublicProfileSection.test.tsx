// @vitest-environment jsdom
import { ProfileNotFound } from '@inzpro/api-contracts/modules/profiles/errors'
import type { PublicProfile } from '@inzpro/api-contracts/modules/profiles/responses'
import { UserId } from '@inzpro/domain/modules/identity/user'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { Schema } from 'effect'
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { PublicProfileSection } from './PublicProfileSection'

const viewerId = UserId.make('10000000-0000-4000-8000-000000000001')
const ownerId = UserId.make('10000000-0000-4000-8000-000000000002')

const publicProfile: typeof PublicProfile.Encoded = {
  name: 'Anna Nowak',
  image: null,
  totalXp: 120,
  badges: [{ code: 'streak_7' }],
  currentStreak: 4,
  paths: [
    {
      specialization: {
        id: '60000000-0000-4000-8000-000000000002',
        name: 'Konstrukcyjno-budowlana',
      },
      qualificationKind: {
        id: '70000000-0000-4000-8000-000000000002',
        name: 'Do kierowania robotami budowlanymi',
      },
      qualificationScope: {
        id: '80000000-0000-4000-8000-000000000002',
        name: 'Bez ograniczeń',
      },
      examSession: {
        id: '90000000-0000-4000-8000-000000000002',
        name: 'Sesja jesienna 2026',
        writtenAt: '2026-11-27T08:00:00.000Z',
      },
    },
  ],
}

const profileNotFound = Schema.encodeSync(ProfileNotFound)(
  new ProfileNotFound({ type: 'profile_not_found', message: 'The profile was not found.' }),
)

let root: Root
let container: HTMLDivElement
let queryClient: QueryClient
let requestedUrls: Array<string>

let respond: (input: RequestInfo | URL) => Promise<Response>

const respondWith = (
  status: number,
  body: typeof PublicProfile.Encoded | typeof ProfileNotFound.Encoded,
) => {
  respond = async input => {
    requestedUrls.push(String(input instanceof Request ? input.url : input))

    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    })
  }
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('scrollTo', () => undefined)
  vi.stubGlobal('fetch', (input: RequestInfo | URL) => respond(input))
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  requestedUrls = []
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
})

afterEach(async () => {
  await act(async () => root.unmount())
  queryClient.clear()
  container.remove()
  vi.unstubAllGlobals()
})

const renderPublicProfile = async () => {
  const rootRoute = createRootRoute({ component: Outlet })
  const app = createRoute({ getParentRoute: () => rootRoute, id: '(app)' })

  const authenticated = createRoute({
    getParentRoute: () => app,
    id: '_authenticated',
    beforeLoad: () => ({ session: { user: { id: viewerId } } }),
  })

  const profile = createRoute({
    getParentRoute: () => authenticated,
    path: 'uzytkownik/$userId',
    component: PublicProfileSection,
  })

  const ownProfile = createRoute({ getParentRoute: () => authenticated, path: 'profil' })

  const router = createRouter({
    routeTree: rootRoute.addChildren([
      app.addChildren([authenticated.addChildren([profile, ownProfile])]),
    ]),
    history: createMemoryHistory({ initialEntries: [`/uzytkownik/${ownerId}`] }),
  })

  await router.load()
  await act(async () =>
    root.render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  )
}

test('the public profile shows the name, XP, streak, badges and active paths', async () => {
  respondWith(200, publicProfile)

  await renderPublicProfile()

  await vi.waitFor(() =>
    expect(container.querySelector('h1')?.textContent).toBe(publicProfile.name),
  )
  expect(requestedUrls.some(url => url.endsWith(`/api/v1/users/${ownerId}/profile`))).toBe(true)
  expect(container.textContent).toContain('120 XP')
  expect(container.textContent).toContain('4 dni')
  expect(container.querySelector('[aria-label="Zdobyte odznaki"]')?.children).toHaveLength(1)
  expect(container.querySelector('[aria-label="Aktywne ścieżki nauki"]')?.textContent).toContain(
    'Konstrukcyjno-budowlana',
  )
  expect(container.textContent).toContain('Sesja jesienna 2026')
})

test('a hidden or missing profile shows that it is unavailable', async () => {
  respondWith(404, profileNotFound)

  await renderPublicProfile()

  await vi.waitFor(() => expect(container.textContent).toContain('Profil jest niedostępny'))
  expect(container.querySelector('[role="alert"]')).toBeNull()
})
