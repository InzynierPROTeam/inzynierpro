// @vitest-environment jsdom
import {
  MockExamAttempt,
  AttemptQuestion,
} from '@inzpro/api-contracts/modules/mock-exams/responses'
import { UserId } from '@inzpro/domain/modules/identity/user'
import {
  AttemptQuestionPosition,
  MockExamAttemptId,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import {
  attemptQuestionQueryOptions,
  mockExamAttemptQueryOptions,
  mockExamHistoryInfiniteQueryOptions,
} from '@inzpro/queries/modules/mock-exams/queries'
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
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { apiHttpClient } from '~platform/lib/api-client'

import { AttemptQuestionCard } from './AttemptQuestionCard'
import { AttemptResultCard } from './AttemptResultCard'
import { MockExamHistorySection } from './MockExamHistorySection'

const userId = UserId.make('10000000-0000-4000-8000-000000000001')
const pathId = QualificationPathId.make('10000000-0000-4000-8000-000000000002')

const attempt = Schema.decodeSync(MockExamAttempt)({
  id: '10000000-0000-4000-8000-000000000003',
  status: 'finished',
  startedAt: '2026-11-17T12:00:00.000Z',
  finishedAt: '2026-11-17T12:01:00.000Z',
  deadline: '2026-11-17T12:10:00.000Z',
  serverTime: '2026-11-17T12:01:00.000Z',
  endReason: 'submitted',
  durationMinutes: 10,
  passThreshold: 2,
  questionCount: 3,
  sections: [{ position: 1, name: 'Prawo budowlane', questionCount: 3 }],
  questions: [1, 2, 3].map(position => ({
    position,
    isAnswered: position === 1,
    isFlagged: false,
  })),
  result: {
    correct: 1,
    incorrect: 1,
    unanswered: 1,
    percent: 50,
    passed: null,
    activeSeconds: 60,
    pauseCount: 0,
    pauseSeconds: 0,
    sections: [{ position: 1, name: 'Prawo budowlane', questionCount: 2, correct: 1 }],
  },
})

const question = Schema.decodeSync(AttemptQuestion)({
  position: 1,
  section: 1,
  questionId: '10000000-0000-4000-8000-000000000004',
  questionRevisionId: '10000000-0000-4000-8000-000000000005',
  body: 'Kto prowadzi dziennik budowy?',
  isWithdrawn: true,
  selectedAnswerId: null,
  isFlagged: false,
  version: 1,
  answers: [
    { id: '10000000-0000-4000-8000-000000000006', text: 'Kierownik budowy' },
    { id: '10000000-0000-4000-8000-000000000007', text: 'Inwestor' },
    { id: '10000000-0000-4000-8000-000000000008', text: 'Projektant' },
  ],
})

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

const renderRoute = async (component: () => React.JSX.Element) => {
  const rootRoute = createRootRoute({ component: Outlet })
  const app = createRoute({ getParentRoute: () => rootRoute, id: '(app)' })
  const authenticated = createRoute({ getParentRoute: () => app, id: '_authenticated' })

  const onboarded = createRoute({
    getParentRoute: () => authenticated,
    id: '_onboarded',
    beforeLoad: () => ({ selectedPath: { id: pathId }, session: { user: { id: userId } } }),
  })

  const written = createRoute({ getParentRoute: () => onboarded, id: '_writtenValid' })

  const page = createRoute({
    getParentRoute: () => written,
    path: 'egzamin-probny/podejscie/$attemptId/$questionNumber',
    component,
    params: {
      parse: params => ({
        attemptId: MockExamAttemptId.make(params.attemptId),
        questionNumber: AttemptQuestionPosition.make(Number(params.questionNumber)),
      }),
    },
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([
      app.addChildren([
        authenticated.addChildren([onboarded.addChildren([written.addChildren([page])])]),
      ]),
    ]),
    history: createMemoryHistory({ initialEntries: [`/egzamin-probny/podejscie/${attempt.id}/1`] }),
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

it('shows withdrawal in the attempt and prevents selecting or saving an answer', async () => {
  const activeAttempt: MockExamAttempt = {
    ...attempt,
    status: 'in-progress',
    result: null,
    finishedAt: null,
    endReason: null,
  }

  queryClient.setQueryData(
    mockExamAttemptQueryOptions(apiHttpClient, userId, {
      params: { qualificationPathId: pathId, attemptId: attempt.id },
    }).queryKey,
    activeAttempt,
  )
  queryClient.setQueryData(
    attemptQuestionQueryOptions(apiHttpClient, userId, {
      params: { qualificationPathId: pathId, attemptId: attempt.id, position: question.position },
    }).queryKey,
    question,
  )
  await renderRoute(AttemptQuestionCard)
  expect(container.textContent).toContain(
    'To pytanie zostało wycofane i nie można już na nie odpowiedzieć.',
  )
  const radios = [...container.querySelectorAll('[role="radio"]')]
  expect(radios).toHaveLength(3)
  expect(radios.every(radio => radio.getAttribute('aria-disabled') === 'true')).toBe(true)
  expect(container.querySelector('button[type="submit"]')).toBeNull()
})

it('explains an incomplete result and uses only valid questions in summary totals', async () => {
  const result = attempt.result

  if (result === null) {
    throw new Error('Missing fixture result')
  }

  await act(async () =>
    root.render(
      <AttemptResultCard
        attempt={attempt}
        result={result}
      />,
    ),
  )
  expect(container.textContent).toContain('Wynik: niepełny')
  expect(container.textContent).toContain(
    'Egzamin zawiera wycofane pytanie i nie ma oceny zaliczenia.',
  )
  expect(container.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe(
    'Wynik 50%: 1 poprawnych z 2 pytań, odpowiedziano na 1',
  )
  expect(container.textContent).toContain('1 z 2')
  expect(container.textContent).toContain('1 / 2')
})

it('shows an incomplete result in attempt history without pass or fail', async () => {
  queryClient.setQueryData(
    mockExamHistoryInfiniteQueryOptions(apiHttpClient, userId, {
      params: { qualificationPathId: pathId },
      query: {},
    }).queryKey,
    {
      pages: [{ data: [attempt], meta: { hasMore: false } }],
      pageParams: [undefined],
    },
  )
  await renderRoute(MockExamHistorySection)
  expect(container.textContent).toContain('1 poprawnych · 50% · Wynik niepełny')
  expect(container.textContent).not.toMatch(/Zaliczony|Niezaliczony/)
  expect(container.querySelector('a')?.textContent).toBe('Zobacz podsumowanie')
})
