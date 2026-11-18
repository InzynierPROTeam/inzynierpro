// @vitest-environment jsdom
import { DailyPlanSettingsConflict } from '@inzpro/api-contracts/modules/daily-plan/errors'
import { DailyPlan } from '@inzpro/api-contracts/modules/daily-plan/responses'
import { UserId } from '@inzpro/domain/modules/identity/user'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { dailyPlanQueryOptions } from '@inzpro/queries/modules/written-study/queries'
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
import { DateTime, Schema } from 'effect'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { apiHttpClient } from '~platform/lib/api-client'

import { WrittenDailyPlanSettings } from './WrittenDailyPlanSettings'

const userId = UserId.make('10000000-0000-4000-8000-000000000001')
const pathId = QualificationPathId.make('10000000-0000-4000-8000-000000000002')

const plannedWith = (settings: typeof DailyPlan.Encoded.settings) =>
  Schema.decodeSync(DailyPlan)({
    status: 'planned',
    settings,
    examDate: '2027-05-20T22:00:00.000Z',
    targetDate: '2027-05-13T22:00:00.000Z',
    daysUntilExam: 189,
    targetQuestionCount: 2,
    completedQuestionCount: 0,
    questionsBehindPace: 0,
  })

const defaultPlan = plannedWith({ version: 1, preference: { mode: 'default' } })

const countPlan = plannedWith({
  version: 3,
  preference: { mode: 'daily_count', dailyQuestionCount: 15 },
})

let requests: Array<{ readonly method: string | undefined; readonly body: unknown }>
let respond: () => Response
let root: Root
let container: HTMLDivElement
let queryClient: QueryClient

beforeEach(() => {
  vi.useFakeTimers({
    toFake: ['Date'],
    now: DateTime.toEpochMillis(DateTime.makeUnsafe('2026-11-13T12:00:00.000Z')),
  })
  requests = []
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init)
    const body = await request.text()

    requests.push({ method: request.method, body: body === '' ? undefined : JSON.parse(body) })

    return respond()
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
  vi.useRealTimers()
})

const planQuery = dailyPlanQueryOptions(apiHttpClient, userId, {
  params: { qualificationPathId: pathId },
})

const renderSettings = async (plan: DailyPlan) => {
  queryClient.setQueryData(planQuery.queryKey, plan)

  const rootRoute = createRootRoute({ component: Outlet })
  const app = createRoute({ getParentRoute: () => rootRoute, id: '(app)' })
  const authenticated = createRoute({ getParentRoute: () => app, id: '_authenticated' })

  const onboarded = createRoute({
    getParentRoute: () => authenticated,
    id: '_onboarded',
    beforeLoad: () => ({ selectedPath: { id: pathId }, session: { user: { id: userId } } }),
  })

  const page = createRoute({
    getParentRoute: () => onboarded,
    path: '/',
    component: () => <WrittenDailyPlanSettings plan={plan} />,
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([
      app.addChildren([authenticated.addChildren([onboarded.addChildren([page])])]),
    ]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
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
  await act(async () => button('Zmień plan').click())
}

const button = (name: string) => {
  const element = [...document.querySelectorAll('button')].find(
    button => button.textContent === name,
  )

  if (element === undefined) {
    throw new Error(`Missing button: ${name}`)
  }

  return element
}

const labelled = (name: string) => {
  const element = document.querySelector<HTMLElement>(`[aria-label="${name}"]`)

  if (element === null) {
    throw new Error(`Missing element: ${name}`)
  }

  return element
}

const choose = (label: string) =>
  act(async () =>
    [...document.querySelectorAll('label')].find(element => element.textContent === label)?.click(),
  )

const press = (element: Element, key: string) =>
  act(async () => {
    element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  })

const pickDay = async (day: string) => {
  await act(async () => labelled('Dzień zakończenia przygotowań').click())

  const dayButton = await vi.waitFor(() => {
    const element = document.querySelector<HTMLButtonElement>(`button[data-day="${day}"]`)

    if (element === null) {
      throw new Error(`Missing day: ${day}`)
    }

    return element
  })

  await act(async () => dayButton.click())
}

const submit = async (name: string) => {
  await act(async () => button(name).click())
  await act(async () => {
    await vi.waitFor(() => expect(requests.length).toBeGreaterThan(0))
  })
}

it('saves a fixed daily count with the current settings version and shows the returned plan', async () => {
  const changed = plannedWith({
    version: 2,
    preference: { mode: 'daily_count', dailyQuestionCount: 4 },
  })

  respond = () => Response.json(Schema.encodeSync(DailyPlan)(changed))
  await renderSettings(defaultPlan)
  await choose('Stała liczba pytań dziennie')

  const slider = document.querySelector('input[type="range"]')

  if (slider === null) {
    throw new Error('Missing slider')
  }

  for (const key of ['Home', 'ArrowRight', 'ArrowRight', 'ArrowRight']) {
    await press(slider, key)
  }

  expect(document.body.textContent).toContain('4 dziennie')

  await submit('Zapisz')

  expect(requests).toEqual([
    {
      method: 'PUT',
      body: {
        preference: { mode: 'daily_count', dailyQuestionCount: 4 },
        expectedVersion: 1,
      },
    },
  ])
  await vi.waitFor(() => expect(queryClient.getQueryData(planQuery.queryKey)).toEqual(changed))
})

it('sends an own end date as the start of that day in Warsaw', async () => {
  respond = () => Response.json(Schema.encodeSync(DailyPlan)(defaultPlan))
  await renderSettings(defaultPlan)
  await pickDay('23-11-2026')
  await submit('Zapisz')

  expect(requests[0]?.body).toEqual({
    preference: { mode: 'target_date', targetDate: '2026-11-22T23:00:00.000Z' },
    expectedVersion: 1,
  })
})

it('restores the default plan, which is unavailable while the default is in place', async () => {
  respond = () => Response.json(Schema.encodeSync(DailyPlan)(defaultPlan))
  await renderSettings(countPlan)

  expect(document.body.textContent).toContain('Stała liczba pytań: 15 dziennie.')

  await submit('Przywróć domyślny')

  expect(requests[0]?.body).toEqual({ preference: { mode: 'default' }, expectedVersion: 3 })

  await act(async () => root.unmount())
  root = createRoot(container)
  await renderSettings(defaultPlan)

  expect(button('Przywróć domyślny').disabled).toBe(true)
})

it('asks for an end date before saving', async () => {
  await renderSettings(defaultPlan)
  await act(async () => button('Zapisz').click())

  await vi.waitFor(() =>
    expect(document.body.textContent).toContain('Wybierz dzień zakończenia przygotowań.'),
  )
  expect(requests).toEqual([])
})

it('explains a conflict with settings changed elsewhere', async () => {
  respond = () =>
    Response.json(
      Schema.encodeSync(DailyPlanSettingsConflict)(
        new DailyPlanSettingsConflict({ type: 'daily_plan_settings_conflict', message: 'Stale' }),
      ),
      { status: 409 },
    )
  await renderSettings(countPlan)
  await submit('Przywróć domyślny')

  await vi.waitFor(() =>
    expect(document.body.textContent).toContain(
      'Ustawienia planu zmieniły się w międzyczasie. Sprawdź je i zapisz ponownie.',
    ),
  )
})
