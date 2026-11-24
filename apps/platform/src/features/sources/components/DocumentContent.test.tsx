// @vitest-environment jsdom
import { DocumentSection } from '@inzpro/api-contracts/modules/learning-content/responses'
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
import { DocumentContent } from './DocumentContent'

let root: Root
let container: HTMLDivElement
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
})

afterEach(async () => {
  await act(async () => root.unmount())
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
  const onboarded = createRoute({ getParentRoute: () => authenticated, id: '_onboarded' })

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
  await act(async () => root.render(<RouterProvider router={router} />))

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

  expect(unit('art:17/pkt:2')?.textContent).toBe('pkt 2inspektor nadzoru inwestorskiego;')
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
