// @vitest-environment jsdom
import { UserId } from '@inzpro/domain/modules/identity/user'
import { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import { learningXpQueryOptions } from '@inzpro/queries/modules/learning-xp/queries'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { apiHttpClient } from '~platform/lib/api-client'

import { LearningXpTotal } from './LearningXpTotal'

const userId = UserId.make('10000000-0000-4000-8000-000000000001')
let root: Root
let container: HTMLDivElement
let queryClient: QueryClient

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('scrollTo', () => undefined)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, enabled: false } },
  })
})

afterEach(async () => {
  await act(async () => root.unmount())
  queryClient.clear()
  container.remove()
  vi.unstubAllGlobals()
})

const renderTotal = async () => {
  const rootRoute = createRootRoute({ component: Outlet })
  const app = createRoute({ getParentRoute: () => rootRoute, id: '(app)' })

  const authenticated = createRoute({
    getParentRoute: () => app,
    id: '_authenticated',
    beforeLoad: () => ({ session: { user: { id: userId } } }),
    component: LearningXpTotal,
  })

  const index = createRoute({ getParentRoute: () => authenticated, path: '/' })

  const router = createRouter({
    routeTree: rootRoute.addChildren([app.addChildren([authenticated.addChildren([index])])]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
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

test('the shell shows the current account total and refreshes when the cache changes', async () => {
  const options = learningXpQueryOptions(apiHttpClient, userId)
  queryClient.setQueryData(options.queryKey, { total: LearningXp.make(8) })
  await renderTotal()
  expect(container.querySelector('[aria-label="Punkty za naukę: 8 XP"]')?.textContent).toBe('8 XP')
  await act(async () => {
    queryClient.setQueryData(options.queryKey, { total: LearningXp.make(11) })
  })
  await vi.waitFor(() => expect(container.textContent).toBe('11 XP'))
})

test('the shell waits for the account total instead of showing an invented zero', async () => {
  await renderTotal()
  expect(container.textContent).toBe('')
})
