// @vitest-environment jsdom
import {
  DocumentQuestionCountsResponse,
  DocumentSection,
  LinkedOralQuestionsResponse,
  LinkedWrittenQuestionsResponse,
} from '@inzpro/api-contracts/modules/learning-content/responses'
import { UserId } from '@inzpro/domain/modules/identity/user'
import { DocumentSectionAddress } from '@inzpro/domain/modules/learning-content/document-section-address'
import { ReferenceDocumentCode } from '@inzpro/domain/modules/learning-content/reference-document'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import {
  documentQuestionCountsQueryOptions,
  linkedOralQuestionsInfiniteQueryOptions,
  linkedWrittenQuestionsInfiniteQueryOptions,
} from '@inzpro/queries/modules/learning-content/queries'
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

import { ReferenceDocumentSearch } from '../validation'
import { DocumentContent } from './DocumentContent'

const userId = UserId.make('10000000-0000-4000-8000-000000000001')
const pathId = QualificationPathId.make('10000000-0000-4000-8000-000000000002')
const code = ReferenceDocumentCode.make('prawo-budowlane')

let root: Root
let container: HTMLDivElement
let queryClient: QueryClient
let scrolledTo: Array<string>

beforeEach(() => {
  scrolledTo = []
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('scrollTo', () => undefined)
  Element.prototype.scrollIntoView = function (this: Element) {
    scrolledTo.push(this.id)
  }

  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  queryClient.setQueryData(
    documentQuestionCountsQueryOptions(apiHttpClient, userId, {
      params: { qualificationPathId: pathId, code },
    }).queryKey,
    Schema.decodeSync(DocumentQuestionCountsResponse)({
      units: [{ address: 'art:17/pkt:2', writtenQuestionCount: 2, oralQuestionCount: 1 }],
    }),
  )
})

afterEach(async () => {
  await act(async () => root.unmount())
  queryClient.clear()
  container.remove()
  vi.unstubAllGlobals()
})

const text = (value: string) => ({
  content: {
    version: 1,
    doc: {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: value }] }],
    },
  },
  assets: [],
})

const sections = Schema.decodeSync(Schema.Array(DocumentSection))([
  {
    address: 'rozdz:2',
    parentAddress: null,
    title: 'Uczestnicy procesu budowlanego',
    content: null,
  },
  {
    address: 'art:17',
    parentAddress: 'rozdz:2',
    title: null,
    content: text('Uczestnikami procesu budowlanego są:'),
  },
  { address: 'art:17/pkt:1', parentAddress: 'art:17', title: null, content: text('inwestor;') },
  {
    address: 'art:17/pkt:2',
    parentAddress: 'art:17',
    title: null,
    content: text('inspektor nadzoru inwestorskiego;'),
  },
  {
    address: 'par:68',
    parentAddress: null,
    title: null,
    content: {
      content: {
        version: 1,
        doc: {
          type: 'doc',
          content: [
            {
              type: 'table',
              content: [
                {
                  type: 'tableRow',
                  content: [
                    {
                      type: 'tableHeader',
                      content: [
                        { type: 'paragraph', content: [{ type: 'text', text: 'Budynek' }] },
                      ],
                    },
                  ],
                },
                {
                  type: 'tableRow',
                  content: [
                    {
                      type: 'tableCell',
                      content: [
                        { type: 'paragraph', content: [{ type: 'text', text: 'Jednorodzinny' }] },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              type: 'image',
              attrs: {
                assetId: '28000000-0000-4000-8000-000000000001',
                alt: 'Przekrój schodów',
                caption: null,
              },
            },
          ],
        },
      },
      assets: [
        { id: '28000000-0000-4000-8000-000000000001', url: 'https://files.example/stairs.png' },
      ],
    },
  },
])

const renderContent = async (initialEntry = '/zrodla/prawo-budowlane') => {
  const rootRoute = createRootRoute({ component: Outlet })
  const app = createRoute({ getParentRoute: () => rootRoute, id: '(app)' })
  const authenticated = createRoute({ getParentRoute: () => app, id: '_authenticated' })

  const onboarded = createRoute({
    getParentRoute: () => authenticated,
    id: '_onboarded',
    beforeLoad: () => ({ selectedPath: { id: pathId }, session: { user: { id: userId } } }),
  })

  const document = createRoute({
    getParentRoute: () => onboarded,
    path: 'zrodla/$code',
    validateSearch: Schema.toStandardSchemaV1(ReferenceDocumentSearch),
    component: () => <DocumentContent sections={sections} />,
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([
      app.addChildren([authenticated.addChildren([onboarded.addChildren([document])])]),
    ]),
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  })

  await router.load()
  await act(async () =>
    root.render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  )

  return router
}

const unit = (address: string) => container.ownerDocument.getElementById(`jednostka-${address}`)

const highlighted = () =>
  [...container.querySelectorAll('[data-highlighted="true"]')].map(element => element.id)

test('the reader shows a table of contents tree and the full text with an anchor per unit', async () => {
  await renderContent()

  const outline = container.querySelector('nav[aria-label="Spis treści"]')
  const chapter = outline?.querySelector(':scope > ul > li')

  expect(chapter?.querySelector(':scope > a')?.textContent).toBe(
    'rozdz. 2 Uczestnicy procesu budowlanego',
  )
  expect(chapter?.querySelector(':scope > ul > li > a')?.getAttribute('href')).toBe(
    '/zrodla/prawo-budowlane?jednostka=art%3A17',
  )
  expect([...(outline?.querySelectorAll('a') ?? [])].map(link => link.textContent)).toEqual([
    'rozdz. 2 Uczestnicy procesu budowlanego',
    'art. 17',
    '§ 68',
  ])

  expect(unit('art:17/pkt:2')?.textContent).toBe(
    'pkt 2inspektor nadzoru inwestorskiego;Pytania na Twojej ścieżce (3): art. 17 pkt 2',
  )
  expect(unit('art:17')?.contains(unit('art:17/pkt:1'))).toBe(true)
  expect(unit('par:68')?.querySelector('th')?.textContent).toBe('Budynek')
  expect(unit('par:68')?.querySelector('td')?.textContent).toBe('Jednorodzinny')
  expect(unit('par:68')?.querySelector('img')?.getAttribute('src')).toBe(
    'https://files.example/stairs.png',
  )
  expect(highlighted()).toEqual([])
})

test('a fragment link scrolls to its unit and highlights it', async () => {
  await renderContent('/zrodla/prawo-budowlane?jednostka=art%3A17%2Fpkt%3A2')

  expect(highlighted()).toEqual(['jednostka-art:17/pkt:2'])
  expect(scrolledTo).toEqual(['jednostka-art:17/pkt:2'])
})

test('a fragment link to a unit missing from this edition says so', async () => {
  await renderContent('/zrodla/prawo-budowlane?jednostka=art%3A57')

  expect(container.textContent).toContain('W tym wydaniu nie ma jednostki art. 57.')
  expect(highlighted()).toEqual([])
  expect(scrolledTo).toEqual([])
})

test('a unit linked to questions on the path offers them with their count', async () => {
  await renderContent()

  const buttons = [...container.querySelectorAll('article button')].map(button => [
    button.closest('[id^="jednostka-"]')?.id,
    button.textContent,
  ])

  expect(buttons).toEqual([
    ['jednostka-art:17/pkt:2', 'Pytania na Twojej ścieżce (3): art. 17 pkt 2'],
  ])
})

test('the questions of a unit open grouped into written and oral, each linking to its details page', async () => {
  const request = {
    params: { qualificationPathId: pathId, code },
    query: { address: DocumentSectionAddress.make('art:17/pkt:2') },
  }

  queryClient.setQueryData(
    linkedWrittenQuestionsInfiniteQueryOptions(apiHttpClient, userId, request).queryKey,
    {
      pages: [
        Schema.decodeSync(LinkedWrittenQuestionsResponse)({
          data: [
            {
              questionId: '30000000-0000-4000-8000-000000000001',
              body: 'Kto ustanawia inspektora nadzoru inwestorskiego?',
            },
          ],
          meta: { hasMore: false },
        }),
      ],
      pageParams: [undefined],
    },
  )
  queryClient.setQueryData(
    linkedOralQuestionsInfiniteQueryOptions(apiHttpClient, userId, request).queryKey,
    {
      pages: [
        Schema.decodeSync(LinkedOralQuestionsResponse)({
          data: [
            {
              questionId: '30000000-0000-4000-8000-000000000002',
              body: text('Omów obowiązki inspektora nadzoru.'),
            },
          ],
          meta: { hasMore: false },
        }),
      ],
      pageParams: [undefined],
    },
  )

  await renderContent()

  await act(async () => container.querySelector<HTMLButtonElement>('article button')?.click())

  const sheet = await vi.waitFor(() => {
    const dialog = document.body.querySelector('[role="dialog"]')

    expect(dialog).not.toBeNull()

    return dialog!
  })

  const groups = [...sheet.querySelectorAll('section[aria-labelledby]')].map(group => [
    group.querySelector('h3')?.textContent,
    [...group.querySelectorAll('a')].map(link => [link.textContent, link.getAttribute('href')]),
  ])

  expect(groups).toEqual([
    [
      'Pytania pisemne (2)',
      [
        [
          'Kto ustanawia inspektora nadzoru inwestorskiego?',
          '/nauka/pytanie/30000000-0000-4000-8000-000000000001',
        ],
      ],
    ],
    [
      'Pytania ustne (1)',
      [
        [
          'Omów obowiązki inspektora nadzoru.',
          '/ustny/pytanie/30000000-0000-4000-8000-000000000002',
        ],
      ],
    ],
  ])
})
