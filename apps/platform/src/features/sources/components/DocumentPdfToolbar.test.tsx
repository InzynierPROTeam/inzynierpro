// @vitest-environment jsdom
import { DocumentPageCount } from '@inzpro/domain/modules/learning-content/document-edition'
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
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ReferenceDocumentSearch } from '../validation'
import { DocumentPdfToolbar } from './DocumentPdfToolbar'

let root: Root
let container: HTMLDivElement

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('scrollTo', () => undefined)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

type ToolbarProps = React.ComponentProps<typeof DocumentPdfToolbar>

const renderToolbar = async (initialEntry: string, props: ToolbarProps) => {
  const rootRoute = createRootRoute({ component: Outlet })
  const app = createRoute({ getParentRoute: () => rootRoute, id: '(app)' })
  const authenticated = createRoute({ getParentRoute: () => app, id: '_authenticated' })
  const onboarded = createRoute({ getParentRoute: () => authenticated, id: '_onboarded' })

  const document = createRoute({
    getParentRoute: () => onboarded,
    path: 'zrodla/$code',
    validateSearch: Schema.toStandardSchemaV1(ReferenceDocumentSearch),
    component: () => <DocumentPdfToolbar {...props} />,
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([
      app.addChildren([authenticated.addChildren([onboarded.addChildren([document])])]),
    ]),
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  })

  await router.load()
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  await act(async () =>
    root.render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  )

  return router
}

const button = (name: string) =>
  [...container.querySelectorAll('button')].find(
    element => element.getAttribute('aria-label') === name || element.textContent === name,
  )

test('the viewer opens at the requested page and moves to the next one', async () => {
  const router = await renderToolbar('/zrodla/samorzady-zawodowe?strona=3', {
    pageCount: DocumentPageCount.make(6),
    downloadable: false,
  })

  expect(container.textContent).toContain('Strona 3 z 6')

  await act(async () => button('Następna strona')?.click())

  expect(router.state.location.search).toEqual({ strona: 4 })
  expect(container.textContent).toContain('Strona 4 z 6')
})

test('the viewer cannot move before the first page or past the last one', async () => {
  await renderToolbar('/zrodla/samorzady-zawodowe', {
    pageCount: DocumentPageCount.make(6),
    downloadable: false,
  })

  expect(container.textContent).toContain('Strona 1 z 6')
  expect(button('Poprzednia strona')?.disabled).toBe(true)

  await act(async () => root.unmount())
  root = createRoot(container)
  await renderToolbar('/zrodla/samorzady-zawodowe?strona=40', {
    pageCount: DocumentPageCount.make(6),
    downloadable: false,
  })

  expect(container.textContent).toContain('Strona 6 z 6')
  expect(button('Następna strona')?.disabled).toBe(true)
})

test('the download button appears only when the edition allows downloading', async () => {
  await renderToolbar('/zrodla/samorzady-zawodowe', {
    pageCount: DocumentPageCount.make(6),
    downloadable: false,
  })

  expect(button('Pobierz PDF')).toBeUndefined()

  await act(async () => root.unmount())
  root = createRoot(container)
  await renderToolbar('/zrodla/samorzady-zawodowe', {
    pageCount: DocumentPageCount.make(6),
    downloadable: true,
  })

  expect(button('Pobierz PDF')).toBeDefined()
})
