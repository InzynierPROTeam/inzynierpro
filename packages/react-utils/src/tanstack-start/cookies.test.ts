import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { createServerEntry, getResponseHeaders } from '@tanstack/react-start/server'
import { Duration } from 'effect'
import { expect, test, vi } from 'vitest'

import { canSsrWithCookies, getCookie, removeCookie, setCookie } from './cookies.js'

test('server reads use the request cookie', async () => {
  const entry = createServerEntry({
    fetch: () => new Response(getCookie('preference')),
  })

  const response = await entry.fetch(
    new Request('https://platform.example.test', { headers: { cookie: 'preference=selected' } }),
  )

  expect(await response.text()).toBe('selected')
})

test('server writes enforce the shared policy', async () => {
  const options = {
    maxAge: Duration.seconds(60),
    secure: false,
    sameSite: 'none',
    domain: 'example.test',
  }

  const entry = createServerEntry({
    fetch: () => {
      setCookie('preference', 'selected', options)

      return new Response(null, { headers: [...getResponseHeaders()] })
    },
  })

  const response = await entry.fetch(new Request('https://platform.example.test'))
  const cookie = response.headers.get('set-cookie')

  expect(cookie).toContain('preference=selected')
  expect(cookie).toContain('Max-Age=60')
  expect(cookie).toContain('SameSite=Strict')
  expect(cookie).toContain('Secure')
  expect(cookie).toContain('Path=/')
  expect(cookie).not.toContain('Domain=')
})

test('server removals preserve security and scope attributes', async () => {
  const entry = createServerEntry({
    fetch: () => {
      removeCookie('preference')

      return new Response(null, { headers: [...getResponseHeaders()] })
    },
  })

  const response = await entry.fetch(new Request('https://platform.example.test'))
  const cookie = response.headers.get('set-cookie')

  expect(cookie).toContain('preference=')
  expect(cookie).toContain('Max-Age=0')
  expect(cookie).toContain('SameSite=Strict')
  expect(cookie).toContain('Secure')
  expect(cookie).toContain('Path=/')
  expect(cookie).not.toContain('Domain=')
})

test.each(['same-origin', 'same-site', 'none', 'cross-site', undefined, 'unknown'])(
  'authenticated guards respect Strict cookie availability for %s entries',
  async site => {
    const authenticate = vi.fn()
    const synchronizeSelection = vi.fn()
    const root = createRootRoute()

    const authenticated = createRoute({
      getParentRoute: () => root,
      id: '_authenticated',
      ssr: canSsrWithCookies,
      beforeLoad: authenticate,
    })

    const onboarded = createRoute({
      getParentRoute: () => authenticated,
      path: '/start',
      beforeLoad: synchronizeSelection,
    })

    const entry = createServerEntry({
      fetch: async () => {
        const router = createRouter({
          routeTree: root.addChildren([authenticated.addChildren([onboarded])]),
          history: createMemoryHistory({ initialEntries: ['/start'] }),
          isServer: true,
        })

        await router.load()

        return new Response(null)
      },
    })

    const headers = new Headers()

    if (site !== undefined) {
      headers.set('sec-fetch-site', site)
    }

    const response = await entry.fetch(
      new Request('https://platform.example.test/start', { headers }),
    )

    expect(response.status).toBe(200)
    const expectedCalls = site === 'same-origin' || site === 'same-site' || site === 'none' ? 1 : 0
    expect(authenticate).toHaveBeenCalledTimes(expectedCalls)
    expect(synchronizeSelection).toHaveBeenCalledTimes(expectedCalls)
    expect(response.headers.get('set-cookie')).toBeNull()
  },
)
