// @vitest-environment jsdom
import { MockExamAttemptNotInProgress } from '@inzpro/api-contracts/modules/mock-exams/errors'
import { MockExamAttempt } from '@inzpro/api-contracts/modules/mock-exams/responses'
import { InternalServerError } from '@inzpro/api-contracts/utils/api-error'
import { UserId } from '@inzpro/domain/modules/identity/user'
import {
  AttemptQuestionPosition,
  MockExamAttemptId,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { mockExamAttemptQueryOptions } from '@inzpro/queries/modules/mock-exams/queries'
import { Toaster } from '@inzpro/ui/components/toast'
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

import { AbandonAttemptButton } from './AbandonAttemptButton'

const userId = UserId.make('10000000-0000-4000-8000-000000000001')
const pathId = QualificationPathId.make('10000000-0000-4000-8000-000000000002')

const attempt = Schema.decodeSync(MockExamAttempt)({
  id: '10000000-0000-4000-8000-000000000003',
  status: 'paused',
  startedAt: '2026-11-17T12:00:00.000Z',
  finishedAt: null,
  deadline: '2026-11-17T12:10:00.000Z',
  serverTime: '2026-11-17T12:00:00.000Z',
  endReason: null,
  durationMinutes: 10,
  passThreshold: 1,
  questionCount: 1,
  pauseCount: 0,
  pauseSeconds: 0,
  sections: [{ position: 1, name: 'Prawo budowlane', questionCount: 1 }],
  questions: [{ position: 1, isAnswered: false, isFlagged: false }],
  result: null,
})

let respond: typeof fetch
let root: Root
let container: HTMLDivElement
let queryClient: QueryClient

beforeEach(() => {
  vi.stubGlobal('fetch', (...args: Parameters<typeof fetch>) => respond(...args))
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

const renderRoute = async (component: () => React.JSX.Element | null) => {
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
        <Toaster>
          <RouterProvider router={router} />
        </Toaster>
      </QueryClientProvider>,
    ),
  )
}

const attemptOptions = mockExamAttemptQueryOptions(apiHttpClient, userId, {
  params: { qualificationPathId: pathId, attemptId: attempt.id },
})

const button = (name: string) => {
  const element = [...document.querySelectorAll('button')].find(
    button => button.textContent === name,
  )

  if (element === undefined) {
    throw new Error(`Missing button: ${name}`)
  }

  return element
}

it('prevents duplicate abandonment while pending and allows retry after a failed request', async () => {
  queryClient.setQueryData(attemptOptions.queryKey, attempt)
  const response = Promise.withResolvers<Response>()
  respond = () => response.promise
  await renderRoute(AbandonAttemptButton)
  await act(async () => button('Porzuć egzamin').click())
  await act(async () => button('Porzuć bez wyniku').click())
  await vi.waitFor(() => expect(button('Porzuć bez wyniku').disabled).toBe(true))

  await act(async () =>
    response.resolve(
      Response.json(
        Schema.encodeSync(InternalServerError)(
          new InternalServerError({ type: 'internal_server_error', message: 'Failure' }),
        ),
        { status: 500 },
      ),
    ),
  )
  await act(async () => {
    await vi.waitFor(() => expect(button('Porzuć bez wyniku').disabled).toBe(false))
  })
  expect(button('Porzuć egzamin')).toBeDefined()
  expect(document.body.textContent).toContain('Nie udało się porzucić egzaminu. Spróbuj ponownie.')
})

it('reconciles a finish conflict and removes the abandonment action after refetching', async () => {
  queryClient.setQueryData(attemptOptions.queryKey, attempt)
  respond = (_input, init) =>
    Promise.resolve(
      init?.method === 'POST'
        ? Response.json(
            Schema.encodeSync(MockExamAttemptNotInProgress)(
              new MockExamAttemptNotInProgress({
                type: 'mock_exam_attempt_not_in_progress',
                message: 'Finished',
              }),
            ),
            { status: 409 },
          )
        : Response.json({ ...attempt, status: 'finished' }),
    )
  await renderRoute(AbandonAttemptButton)
  await act(async () => button('Porzuć egzamin').click())
  await act(async () => button('Porzuć bez wyniku').click())
  await act(async () => {
    await vi.waitFor(() => expect(container.textContent).not.toContain('Porzuć egzamin'))
  })
})
