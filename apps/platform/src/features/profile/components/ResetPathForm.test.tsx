// @vitest-environment jsdom
import { PathResetConflict } from '@inzpro/api-contracts/modules/path-reset/errors'
import { UserQualificationPath } from '@inzpro/api-contracts/modules/preparation/responses'
import { InternalServerError } from '@inzpro/api-contracts/utils/api-error'
import { UserId } from '@inzpro/domain/modules/identity/user'
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
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { ResetPathForm } from './ResetPathForm'

const userId = UserId.make('10000000-0000-4000-8000-000000000001')

const path = Schema.decodeSync(UserQualificationPath)({
  id: '10000000-0000-4000-8000-000000000002',
  name: 'Konstrukcyjno-budowlana — kierowanie robotami bez ograniczeń',
  specialization: {
    id: '60000000-0000-4000-8000-000000000001',
    code: 'konstrukcyjno-budowlana',
    name: 'Konstrukcyjno-budowlana',
    description: null,
  },
  qualificationKind: {
    id: '70000000-0000-4000-8000-000000000001',
    code: 'kierowanie',
    name: 'Do kierowania robotami budowlanymi',
  },
  qualificationScope: {
    id: '80000000-0000-4000-8000-000000000001',
    code: 'bez-ograniczen',
    name: 'Bez ograniczeń',
  },
  accessScope: 'both',
  version: 3,
  archived: false,
  districtChamber: null,
  goal: {
    version: 1,
    examSessionId: '90000000-0000-4000-8000-000000000001',
    sessionName: 'Sesja jesienna 2026',
    sessionIsConfirmed: true,
    writtenAt: '2026-11-27T08:00:00.000Z',
    oralPlanningAt: '2026-12-10T08:00:00.000Z',
    oralExamDate: null,
    accessScope: 'both',
  },
})

type SentReset = {
  readonly confirmation: string
  readonly expectedVersion: number
}

let respond: () => Response
let sent: Array<SentReset>
let done: ReturnType<typeof vi.fn<() => void>>
let root: Root
let container: HTMLDivElement
let queryClient: QueryClient

beforeEach(() => {
  sent = []
  done = vi.fn<() => void>()
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init)

    if (request.method === 'POST') {
      sent.push(await request.json())
    }

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
})

const renderForm = async () => {
  const rootRoute = createRootRoute({ component: Outlet })
  const app = createRoute({ getParentRoute: () => rootRoute, id: '(app)' })

  const authenticated = createRoute({
    getParentRoute: () => app,
    id: '_authenticated',
    beforeLoad: () => ({ session: { user: { id: userId } } }),
  })

  const profile = createRoute({
    getParentRoute: () => authenticated,
    path: 'profil',
    component: () => (
      <ResetPathForm
        path={path}
        onDone={done}
      />
    ),
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([app.addChildren([authenticated.addChildren([profile])])]),
    history: createMemoryHistory({ initialEntries: ['/profil'] }),
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

const typeConfirmation = async (value: string) => {
  const input = container.querySelector('input')

  if (input === null) {
    throw new Error('Missing confirmation input')
  }

  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

const submit = async () => {
  const button = [...container.querySelectorAll('button')].find(
    candidate => candidate.textContent === 'Resetuj postęp',
  )

  if (button === undefined) {
    throw new Error('Missing submit button')
  }

  await act(async () => button.click())
}

const reset = { qualificationPathId: path.id, version: 4 }

it('sends nothing until the confirmation word is typed', async () => {
  respond = () => Response.json(reset)
  await renderForm()
  await typeConfirmation('resetuj postęp')
  await submit()

  expect(container.textContent).toContain('Wpisz RESETUJ, aby potwierdzić.')
  expect(sent).toEqual([])
  expect(done).not.toHaveBeenCalled()
})

it('resets with the assignment version and can be retried after a failure', async () => {
  respond = () =>
    Response.json(
      Schema.encodeSync(InternalServerError)(
        new InternalServerError({ type: 'internal_server_error', message: 'Failure' }),
      ),
      { status: 500 },
    )
  await renderForm()
  await typeConfirmation('RESETUJ')
  await submit()
  await vi.waitFor(() =>
    expect(document.body.textContent).toContain(
      'Nie udało się zresetować postępu. Spróbuj ponownie.',
    ),
  )

  respond = () => Response.json(reset)
  await submit()
  await vi.waitFor(() => expect(done).toHaveBeenCalledOnce())

  expect(sent).toHaveLength(2)
  expect(sent[0]).toEqual({
    confirmation: 'RESETUJ',
    expectedVersion: 3,
  })
  expect(sent[1]).toEqual(sent[0])
})

it('explains a path changed elsewhere', async () => {
  respond = () =>
    Response.json(
      Schema.encodeSync(PathResetConflict)(
        new PathResetConflict({ type: 'path_reset_conflict', message: 'Changed' }),
      ),
      { status: 409 },
    )
  await renderForm()
  await typeConfirmation('RESETUJ')
  await submit()

  await vi.waitFor(() =>
    expect(document.body.textContent).toContain(
      'Ścieżka zmieniła się w innym miejscu. Sprawdź ją i spróbuj ponownie.',
    ),
  )
  expect(done).not.toHaveBeenCalled()
})
