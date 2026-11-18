import {
  SessionQuestion,
  StudySession,
} from '@inzpro/api-contracts/modules/written-study/responses'
// @vitest-environment jsdom
import { UserId } from '@inzpro/domain/modules/identity/user'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import {
  sessionQueryOptions,
  sessionQuestionQueryOptions,
} from '@inzpro/queries/modules/written-study/queries'
import { paragraphs } from '@inzpro/rich-content/rich-content'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
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
import { apiHttpClient } from '~platform/lib/api-client'

import { SessionAnswerForm } from './SessionAnswerForm'

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

const pathId = QualificationPathId.make('10000000-0000-4000-8000-000000000002')

const question = Schema.decodeSync(SessionQuestion)({
  sessionId: '10000000-0000-4000-8000-000000000003',
  position: 1,
  questionId: '10000000-0000-4000-8000-000000000004',
  questionRevisionId: '10000000-0000-4000-8000-000000000005',
  body: 'Kto prowadzi dziennik budowy?',
  explanation: { content: paragraphs('Explanation'), assets: [] },
  answers: [
    { id: '10000000-0000-4000-8000-000000000006', text: 'Kierownik budowy', isCorrect: true },
  ],
  isWithdrawn: false,
  explanationOpenedAt: null,
  noteOpenedAt: null,
  answer: null,
  isFavorite: false,
  note: null,
})

const session = Schema.decodeSync(StudySession)({
  id: question.sessionId,
  kind: 'study',
  status: 'active',
  progress: { total: 2, answered: 0, skipped: 0, percent: 0, currentQuestion: 1 },
  createdAt: '2026-11-13T12:00:00.000Z',
  endedAt: null,
})

const params = {
  qualificationPathId: pathId,
  sessionId: question.sessionId,
  position: question.position,
}

const questionOptions = sessionQuestionQueryOptions(apiHttpClient, userId, { params })

const sessionOptions = sessionQueryOptions(apiHttpClient, userId, {
  params: { qualificationPathId: pathId, sessionId: session.id },
})

const AnswerForm = () => {
  const { data } = useQuery(questionOptions)

  return data == null ? null : <SessionAnswerForm question={data} />
}

const renderForm = async () => {
  queryClient.setQueryData(questionOptions.queryKey, question)
  queryClient.setQueryData(sessionOptions.queryKey, session)
  const rootRoute = createRootRoute({ component: Outlet })
  const app = createRoute({ getParentRoute: () => rootRoute, id: '(app)' })
  const authenticated = createRoute({ getParentRoute: () => app, id: '_authenticated' })

  const onboarded = createRoute({
    getParentRoute: () => authenticated,
    id: '_onboarded',
    beforeLoad: () => ({ selectedPath: { id: pathId }, session: { user: { id: userId } } }),
  })

  const index = createRoute({ getParentRoute: () => onboarded, path: '/', component: AnswerForm })

  const router = createRouter({
    routeTree: rootRoute.addChildren([
      app.addChildren([authenticated.addChildren([onboarded.addChildren([index])])]),
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

let responseXp = 0

test.each([0, 3])(
  'submitting an answer shows feedback only for positive XP: %s',
  async awardedXp => {
    responseXp = awardedXp
    vi.stubGlobal('fetch', async () =>
      Response.json({
        question: {
          ...question,
          answer: {
            answerId: question.answers[0]!.id,
            isCorrect: true,
            isAssisted: false,
            answeredAt: '2026-11-13T12:00:00.000Z',
          },
        },
        session,
        awardedXp: responseXp,
        rewards: { roundReward: null, badges: [] },
      }),
    )
    await renderForm()
    expect(container.querySelector('[role="status"]')).toBeNull()
    await act(async () => {
      container.querySelector<HTMLButtonElement>('[role="radio"]')!.click()
    })
    await act(async () => {
      container
        .querySelector('form')!
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
    await vi.waitFor(() =>
      expect(queryClient.getQueryData(questionOptions.queryKey)?.answer).not.toBeNull(),
    )
    await vi.waitFor(() => expect(queryClient.isMutating()).toBe(0))
    await vi.waitFor(() => {
      if (awardedXp === 0) {
        expect(container.querySelector('[role="status"]')).toBeNull()
      } else {
        expect(container.querySelector('[role="status"]')?.textContent).toBe('+3 XP')
      }
    })
  },
)
