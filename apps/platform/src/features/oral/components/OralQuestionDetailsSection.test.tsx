// @vitest-environment jsdom
import { OralQuestionDetails } from '@inzpro/api-contracts/modules/oral-study/responses'
import { UserId } from '@inzpro/domain/modules/identity/user'
import { OralQuestionId } from '@inzpro/domain/modules/learning-content/oral-question'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { oralQuestionDetailsQueryOptions } from '@inzpro/queries/modules/oral-study/queries'
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
import { apiHttpClient } from '~platform/lib/api-client'

import { OralQuestionDetailsSection } from './OralQuestionDetailsSection'

const userId = UserId.make('10000000-0000-4000-8000-000000000001')
const pathId = QualificationPathId.make('10000000-0000-4000-8000-000000000002')
const questionId = OralQuestionId.make('30000000-0000-4000-8000-000000000001')

type SentRequest = { readonly method: string; readonly path: string; readonly body: unknown }

let sent: Array<SentRequest>
let root: Root
let container: HTMLDivElement
let queryClient: QueryClient

beforeEach(() => {
  sent = []
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init)
    const path = new URL(request.url).pathname
    const body = request.method === 'PUT' && path.includes('/notes/') ? await request.json() : null

    sent.push({ method: request.method, path, body })

    return path.includes('/favorites/')
      ? Response.json({ questionId, isFavorite: request.method === 'PUT' })
      : Response.json({
          questionId,
          note: {
            text: 'Inwestor ustanawia inspektora.',
            updatedAt: '2026-11-24T10:00:00.000Z',
            refersToEarlierWording: false,
          },
        })
  })
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

const details = Schema.decodeSync(OralQuestionDetails)({
  questionId,
  oralRevisionId: '31000000-0000-4000-8000-000000000002',
  body: { content: paragraphs('Omów obowiązki kierownika budowy.'), assets: [] },
  answer: { content: paragraphs('Kierownik budowy prowadzi dziennik budowy.'), assets: [] },
  references: [
    {
      document: {
        code: 'prawo-budowlane',
        abbreviation: 'PB',
        title: 'Ustawa z dnia 7 lipca 1994 r. — Prawo budowlane',
      },
      address: 'art:22',
      page: null,
      kind: 'direct_basis',
      isCritical: true,
      isLinked: true,
      fragment: null,
    },
  ],
  isFavorite: false,
  note: null,
})

const renderDetails = async () => {
  queryClient.setQueryData(
    oralQuestionDetailsQueryOptions(apiHttpClient, userId, {
      params: { qualificationPathId: pathId, questionId },
    }).queryKey,
    details,
  )

  const rootRoute = createRootRoute({ component: Outlet })
  const app = createRoute({ getParentRoute: () => rootRoute, id: '(app)' })
  const authenticated = createRoute({ getParentRoute: () => app, id: '_authenticated' })

  const onboarded = createRoute({
    getParentRoute: () => authenticated,
    id: '_onboarded',
    beforeLoad: () => ({ selectedPath: { id: pathId }, session: { user: { id: userId } } }),
  })

  const oralValid = createRoute({ getParentRoute: () => onboarded, id: '_oralValid' })

  const page = createRoute({
    getParentRoute: () => oralValid,
    path: 'ustny/pytanie/$questionId',
    component: OralQuestionDetailsSection,
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([
      app.addChildren([
        authenticated.addChildren([onboarded.addChildren([oralValid.addChildren([page])])]),
      ]),
    ]),
    history: createMemoryHistory({ initialEntries: [`/ustny/pytanie/${questionId}`] }),
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

const button = (name: string) =>
  [...document.body.querySelectorAll('button')].find(candidate =>
    candidate.textContent?.includes(name),
  )

test('oral question details show the question, the prepared answer and the chips', async () => {
  await renderDetails()

  expect(container.querySelector('h1')?.textContent).toBe('Omów obowiązki kierownika budowy.')
  expect(container.querySelector('[aria-label="Przygotowana odpowiedź"]')?.textContent).toBe(
    'Przygotowana odpowiedźKierownik budowy prowadzi dziennik budowy.',
  )
  expect(
    container.querySelector('section[aria-label="Podstawa: PB art. 22"] a')?.getAttribute('href'),
  ).toBe('/zrodla/prawo-budowlane?jednostka=art%3A22')
})

test('an oral favourite mark is added from the question details', async () => {
  await renderDetails()

  await act(async () => button('Dodaj do ulubionych')?.click())

  await vi.waitFor(() =>
    expect(button('Usuń z ulubionych')?.getAttribute('aria-pressed')).toBe('true'),
  )
  expect(sent).toEqual([
    {
      method: 'PUT',
      path: `/api/v1/study/paths/${pathId}/oral/favorites/${questionId}`,
      body: null,
    },
  ])
})

test('an oral note is saved from the question details', async () => {
  await renderDetails()

  await act(async () => button('Dodaj notatkę')?.click())

  const textarea = await vi.waitFor(() => {
    const field = document.body.querySelector('textarea')

    expect(field).not.toBeNull()

    return field!
  })

  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set?.call(
      textarea,
      ' Inwestor ustanawia inspektora. ',
    )
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(async () => button('Zapisz notatkę')?.click())

  await vi.waitFor(() => expect(button('Edytuj notatkę')).toBeDefined())
  expect(sent).toEqual([
    {
      method: 'PUT',
      path: `/api/v1/study/paths/${pathId}/oral/notes/${questionId}`,
      body: { text: 'Inwestor ustanawia inspektora.' },
    },
  ])
})
