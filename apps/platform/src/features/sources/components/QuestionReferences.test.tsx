// @vitest-environment jsdom
import { QuestionReference } from '@inzpro/api-contracts/modules/learning-content/responses'
import { UserId } from '@inzpro/domain/modules/identity/user'
import { ReferenceDocumentCode } from '@inzpro/domain/modules/learning-content/reference-document'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { paragraphs } from '@inzpro/rich-content/rich-content'
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
import { QuestionReferences } from './QuestionReferences'

const userId = UserId.make('10000000-0000-4000-8000-000000000001')
const pathId = QualificationPathId.make('10000000-0000-4000-8000-000000000002')
const code = ReferenceDocumentCode.make('prawo-budowlane')

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
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
})

afterEach(async () => {
  await act(async () => root.unmount())
  queryClient.clear()
  container.remove()
  vi.unstubAllGlobals()
})

const buildingLaw = {
  code,
  abbreviation: 'PB',
  title: 'Ustawa z dnia 7 lipca 1994 r. — Prawo budowlane',
}

const selfGovernmentAct = {
  code: 'samorzady-zawodowe',
  abbreviation: 'USZ',
  title: 'Ustawa o samorządach zawodowych architektów oraz inżynierów budownictwa',
}

const reference = <Fields extends object>(fields: Fields) => ({
  page: null,
  isCritical: false,
  isLinked: true,
  fragment: null,
  ...fields,
})

const references = Schema.decodeSync(Schema.Array(QuestionReference))([
  reference({
    document: buildingLaw,
    address: 'art:18/ust:1/pkt:5',
    kind: 'direct_basis',
    isCritical: true,
    fragment: [
      {
        address: 'art:18/ust:1/pkt:5',
        parentAddress: 'art:18/ust:1',
        title: null,
        content: {
          content: paragraphs('ustanowienie inspektora nadzoru inwestorskiego,'),
          assets: [],
        },
      },
      {
        address: 'art:18/ust:1/pkt:5/lit:a',
        parentAddress: 'art:18/ust:1/pkt:5',
        title: null,
        content: { content: paragraphs('jeżeli jest on wymagany.'), assets: [] },
      },
    ],
  }),
  reference({
    document: buildingLaw,
    address: 'art:82/ust:3',
    kind: 'direct_basis',
    isLinked: false,
  }),
  reference({ document: buildingLaw, address: 'art:18/ust:1/pkt:4', kind: 'aid' }),
  reference({ document: selfGovernmentAct, address: null, page: 2, kind: 'aid' }),
  reference({ document: buildingLaw, address: null, kind: 'topic' }),
  reference({ document: buildingLaw, address: 'art:99', kind: 'topic', isLinked: false }),
])

const renderReferences = async () => {
  const rootRoute = createRootRoute({ component: Outlet })
  const app = createRoute({ getParentRoute: () => rootRoute, id: '(app)' })
  const authenticated = createRoute({ getParentRoute: () => app, id: '_authenticated' })

  const onboarded = createRoute({
    getParentRoute: () => authenticated,
    id: '_onboarded',
    beforeLoad: () => ({ selectedPath: { id: pathId }, session: { user: { id: userId } } }),
  })

  const index = createRoute({
    getParentRoute: () => onboarded,
    path: '/',
    component: () => <QuestionReferences references={references} />,
  })

  const document = createRoute({
    getParentRoute: () => onboarded,
    path: 'zrodla/$code',
    validateSearch: Schema.toStandardSchemaV1(ReferenceDocumentSearch),
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([
      app.addChildren([authenticated.addChildren([onboarded.addChildren([index, document])])]),
    ]),
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

const section = (name: string) => container.querySelector(`section[aria-label="${name}"]`)

const list = (title: string) =>
  [...container.querySelectorAll('section[aria-labelledby]')].find(
    element => element.querySelector('h3')?.textContent === title,
  )

const items = (title: string) => [...(list(title)?.querySelectorAll('li') ?? [])]

test('each basis shows its linked label, the document title and the fragment text', async () => {
  await renderReferences()

  const linked = section('Podstawa: PB art. 18 ust. 1 pkt 5')

  expect(linked?.querySelector('a')?.getAttribute('href')).toBe(
    '/zrodla/prawo-budowlane?jednostka=art%3A18%2Fust%3A1%2Fpkt%3A5',
  )
  expect(linked?.textContent).toBe(
    'Podstawa: PB art. 18 ust. 1 pkt 5Ustawa z dnia 7 lipca 1994 r. — Prawo budowlaneart. 18 ust. 1 pkt 5ustanowienie inspektora nadzoru inwestorskiego,lit. ajeżeli jest on wymagany.',
  )

  const missing = section('Podstawa: PB art. 82 ust. 3')

  expect(missing?.querySelector('a, button')).toBeNull()
  expect(missing?.textContent).toBe(
    'Podstawa: PB art. 82 ust. 3Ustawa z dnia 7 lipca 1994 r. — Prawo budowlane',
  )
})

test('aids and topical references are listed apart and link to the reader where they resolve', async () => {
  await renderReferences()

  const [fragment, page] = items('Materiały pomocnicze')

  expect(fragment?.querySelector('a')?.getAttribute('href')).toBe(
    '/zrodla/prawo-budowlane?jednostka=art%3A18%2Fust%3A1%2Fpkt%3A4',
  )
  expect(page?.querySelector('a')?.getAttribute('href')).toBe('/zrodla/samorzady-zawodowe?strona=2')

  const [whole, missing] = items('Powiązane materiały')

  expect(whole?.querySelector('a')?.getAttribute('href')).toBe('/zrodla/prawo-budowlane')
  expect(missing?.textContent).toBe('PB art. 99')
  expect(missing?.querySelector('a, button')).toBeNull()
})
