// @vitest-environment jsdom
import { QuestionDetails } from '@inzpro/api-contracts/modules/written-study/responses'
import { UserId } from '@inzpro/domain/modules/identity/user'
import { WrittenQuestionId } from '@inzpro/domain/modules/learning-content/written-question'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { questionDetailsQueryOptions } from '@inzpro/queries/modules/written-study/queries'
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

import { QuestionDetailsSection } from './QuestionDetailsSection'

const userId = UserId.make('10000000-0000-4000-8000-000000000001')
const pathId = QualificationPathId.make('10000000-0000-4000-8000-000000000002')
const questionId = WrittenQuestionId.make('30000000-0000-4000-8000-000000000001')

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

const details = Schema.decodeSync(QuestionDetails)({
  questionId,
  questionRevisionId: '31000000-0000-4000-8000-000000000001',
  body: 'Kto ustanawia inspektora nadzoru inwestorskiego?',
  answers: [
    { id: '32000000-0000-4000-8000-000000000001', text: 'Kierownik budowy', isCorrect: false },
    { id: '32000000-0000-4000-8000-000000000002', text: 'Inwestor', isCorrect: true },
    { id: '32000000-0000-4000-8000-000000000003', text: 'Projektant', isCorrect: false },
  ],
  explanation: { content: paragraphs('Inwestor zapewnia nadzór inwestorski.'), assets: [] },
  references: [
    {
      document: {
        code: 'prawo-budowlane',
        abbreviation: 'PB',
        title: 'Ustawa z dnia 7 lipca 1994 r. — Prawo budowlane',
      },
      address: 'art:18/ust:1/pkt:5',
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
    questionDetailsQueryOptions(apiHttpClient, userId, {
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

  const writtenValid = createRoute({ getParentRoute: () => onboarded, id: '_writtenValid' })

  const page = createRoute({
    getParentRoute: () => writtenValid,
    path: 'nauka/pytanie/$questionId',
    component: QuestionDetailsSection,
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([
      app.addChildren([
        authenticated.addChildren([onboarded.addChildren([writtenValid.addChildren([page])])]),
      ]),
    ]),
    history: createMemoryHistory({ initialEntries: [`/nauka/pytanie/${questionId}`] }),
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

test('question details show the question, every answer with the correct one marked, the explanation and the chips', async () => {
  await renderDetails()

  expect(container.querySelector('h1')?.textContent).toBe(
    'Kto ustanawia inspektora nadzoru inwestorskiego?',
  )
  expect(
    [...container.querySelectorAll('[data-slot="answer-option"]')].map(option => [
      option.textContent,
      option.getAttribute('data-tone'),
    ]),
  ).toEqual([
    ['AKierownik budowy', 'neutral'],
    ['Inwestor · Poprawna odpowiedź', 'correct'],
    ['CProjektant', 'neutral'],
  ])
  expect(container.querySelector('[aria-label="Wyjaśnienie"]')?.textContent).toBe(
    'WyjaśnienieInwestor zapewnia nadzór inwestorski.',
  )
  expect(
    container
      .querySelector('section[aria-label="Podstawa: PB art. 18 ust. 1 pkt 5"] a')
      ?.getAttribute('href'),
  ).toBe('/zrodla/prawo-budowlane?jednostka=art%3A18%2Fust%3A1%2Fpkt%3A5')
})

test('a favourite mark is added from the question details', async () => {
  await renderDetails()

  await act(async () => button('Dodaj do ulubionych')?.click())

  await vi.waitFor(() =>
    expect(button('Usuń z ulubionych')?.getAttribute('aria-pressed')).toBe('true'),
  )
  expect(sent).toEqual([
    {
      method: 'PUT',
      path: `/api/v1/study/paths/${pathId}/favorites/${questionId}`,
      body: null,
    },
  ])
})

test('a note is saved from the question details', async () => {
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
      path: `/api/v1/study/paths/${pathId}/notes/${questionId}`,
      body: { text: 'Inwestor ustanawia inspektora.' },
    },
  ])
})
