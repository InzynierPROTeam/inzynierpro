import type { DocumentPackageCandidate } from '@inzpro/api-contracts/modules/learning-content/responses'
// @vitest-environment jsdom
import { UserId } from '@inzpro/domain/modules/identity/user'
import { ByteSize } from '@inzpro/domain/modules/learning-content/content-asset'
import { DocumentPageCount } from '@inzpro/domain/modules/learning-content/document-edition'
import type { PackageAvailability } from '@inzpro/domain/modules/learning-content/document-package'
import {
  ReferenceDocumentCode,
  ReferenceDocumentId,
  type ReferenceDocumentKind,
} from '@inzpro/domain/modules/learning-content/reference-document'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { formatDate, getCurrentUtcIsoDateTime } from '@inzpro/utils/date'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import type { PackageWorkerResponse } from '../lib/package-worker'
import { packagePathName } from '../utils'
import { PackageBuilder } from './PackageBuilder'

let root: Root
let container: HTMLDivElement

const userId = UserId.make('10000000-0000-4000-8000-000000000002')

const pathId = QualificationPathId.make('10000000-0000-4000-8000-000000000001')

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  localStorage.clear()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

const candidate = (
  code: string,
  abbreviation: string,
  kind: ReferenceDocumentKind,
  availability: PackageAvailability,
  pageCount: number | null,
): DocumentPackageCandidate => ({
  id: ReferenceDocumentId.make(crypto.randomUUID()),
  code: ReferenceDocumentCode.make(code),
  kind,
  abbreviation,
  title: `Dokument ${abbreviation}`,
  editionLabel: `Wydanie ${abbreviation}`,
  textKind: 'official_consolidated',
  availability,
  pdf:
    pageCount === null
      ? null
      : {
          pageCount: DocumentPageCount.make(pageCount),
          size: ByteSize.make(pageCount * 100_000),
        },
})

const seededCandidates = [
  candidate('pn-en-1990', 'PN-EN 1990', 'standard', 'metadata_only', null),
  candidate('prawo-budowlane', 'PB', 'statute', 'included', 8),
  candidate('samorzady-zawodowe', 'USZ', 'statute', 'included', 6),
  candidate('warunki-techniczne', 'WT', 'regulation', 'download_not_allowed', 3),
]

const selectedPath = {
  id: pathId,
  specialization: { code: 'konstrukcyjno-budowlana', name: 'Konstrukcyjno-budowlana' },
  qualificationKind: { code: 'projektowanie', name: 'Projektowanie' },
  qualificationScope: { code: 'bez-ograniczen', name: 'Bez ograniczeń' },
}

const renderBuilder = async (candidates: ReadonlyArray<DocumentPackageCandidate>) => {
  const rootRoute = createRootRoute({ component: Outlet })
  const app = createRoute({ getParentRoute: () => rootRoute, id: '(app)' })
  const authenticated = createRoute({ getParentRoute: () => app, id: '_authenticated' })

  const onboarded = createRoute({
    getParentRoute: () => authenticated,
    id: '_onboarded',
    beforeLoad: () => ({
      selectedPath,
      session: { user: { id: userId } },
    }),
  })

  const documentPackage = createRoute({
    getParentRoute: () => onboarded,
    path: 'zrodla/pakiet',
    component: () => <PackageBuilder candidates={candidates} />,
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([
      app.addChildren([authenticated.addChildren([onboarded.addChildren([documentPackage])])]),
    ]),
    history: createMemoryHistory({ initialEntries: ['/zrodla/pakiet'] }),
  })

  const queryClient = new QueryClient()
  const included = candidates.filter(document => document.availability === 'included')
  const selections = [included, included.toReversed(), ...included.map(document => [document])]

  for (const documents of selections) {
    queryClient.setQueryData(
      [
        'document-package',
        userId,
        pathId,
        documents,
        {
          pathName: packagePathName(selectedPath),
          generationDate: formatDate(getCurrentUtcIsoDateTime()),
        },
      ],
      documents.reduce(
        (total, document) => total + (document.pdf?.pageCount ?? 0),
        2 + documents.length,
      ),
    )
  }

  await router.load()

  await act(async () =>
    root.render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  )
}

const reload = async (candidates: ReadonlyArray<DocumentPackageCandidate>) => {
  await act(async () => root.unmount())
  root = createRoot(container)
  await renderBuilder(candidates)
}

const option = (abbreviation: string) =>
  [...container.querySelectorAll('[data-slot=item]')].find(
    item =>
      item.querySelector('[data-slot=checkbox]') !== null &&
      item.textContent.includes(`Dokument ${abbreviation}`),
  )

const checkbox = (abbreviation: string) =>
  option(abbreviation)?.querySelector<HTMLElement>('[data-slot=checkbox]')

const packageOrder = () =>
  [
    ...container.querySelectorAll(
      'ol[aria-label="Kolejność dokumentów w pakiecie"] [data-slot=badge]',
    ),
  ].map(badge => badge.textContent)

const button = (name: string) =>
  [...container.querySelectorAll('button')].find(
    element => element.getAttribute('aria-label') === name || element.textContent === name,
  )

test('every included document is selected by default and unavailable ones show their reason', async () => {
  await renderBuilder(seededCandidates)

  expect(checkbox('PB')?.getAttribute('aria-checked')).toBe('true')
  expect(checkbox('USZ')?.getAttribute('aria-checked')).toBe('true')
  expect(checkbox('WT')?.getAttribute('aria-disabled')).toBe('true')
  expect(checkbox('PN-EN 1990')?.getAttribute('aria-disabled')).toBe('true')
  expect(option('WT')?.textContent).toContain('Tego dokumentu nie można pobrać.')
  expect(option('PN-EN 1990')?.textContent).toContain('Dostępny jest tylko opis tego dokumentu.')
  expect(packageOrder()).toEqual(['PB', 'USZ'])
  expect(container.textContent).not.toMatch(/Rozmiar|\bKB\b|\bMB\b/)
  expect(container.textContent).toContain('Dokumenty: 2 · Liczba stron: 18')
})

test('documents reorder with the arrow buttons and the default order can be restored', async () => {
  await renderBuilder(seededCandidates)

  await act(async () => button('Przesuń niżej: PB')?.click())

  expect(packageOrder()).toEqual(['USZ', 'PB'])
  expect(button('Przesuń wyżej: USZ')?.disabled).toBe(true)

  await act(async () => button('Przywróć domyślną kolejność')?.click())

  expect(packageOrder()).toEqual(['PB', 'USZ'])
})

test('the selection and order survive a reload, and entries no longer included are dropped', async () => {
  await renderBuilder(seededCandidates)

  await act(async () => button('Przesuń wyżej: USZ')?.click())
  await act(async () => checkbox('PB')?.click())

  expect(packageOrder()).toEqual(['USZ'])

  await reload(seededCandidates)

  expect(packageOrder()).toEqual(['USZ'])
  expect(checkbox('PB')?.getAttribute('aria-checked')).toBe('false')

  await act(async () => checkbox('PB')?.click())
  await reload(seededCandidates)

  expect(packageOrder()).toEqual(['USZ', 'PB'])

  await reload(
    seededCandidates.map(item =>
      item.abbreviation === 'USZ' ? { ...item, availability: 'download_not_allowed' } : item,
    ),
  )

  expect(packageOrder()).toEqual(['PB'])
})

test('the large package warning includes generated pages', async () => {
  await renderBuilder([candidate('duzy', 'DUZY', 'statute', 'included', 1998)])

  expect(container.querySelector('[role=alert]')?.textContent).toContain('Duży pakiet')
})

test('deselecting documents updates the complete package count and an empty selection has no pages', async () => {
  await renderBuilder(seededCandidates)
  await act(async () => checkbox('PB')?.click())

  expect(container.textContent).toContain('Dokumenty: 1 · Liczba stron: 9')

  await act(async () => checkbox('USZ')?.click())

  expect(container.textContent).toContain('Dokumenty: 0 · Liczba stron: 0')
})

class DownloadWorker extends EventTarget {
  constructor() {
    super()
    downloadWorkers.push(this)
  }

  postMessage() {}
  terminate() {}

  respond(data: PackageWorkerResponse) {
    this.dispatchEvent(new MessageEvent('message', { data }))
  }
}

const downloadWorkers: Array<DownloadWorker> = []

const stubDownloads = () => {
  downloadWorkers.length = 0
  vi.stubGlobal('Worker', DownloadWorker)
  vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
    const url = input instanceof Request ? input.url : String(input)

    if (url.endsWith('/pdf/download')) {
      return Response.json({ url: 'https://example.com/document.pdf' })
    }

    const document = seededCandidates.find(item => url.endsWith(item.code))!

    return Response.json({
      document: {
        ...document,
        description: null,
        edition: {
          id: '10000000-0000-4000-8000-000000000003',
          label: document.editionLabel,
          textKind: document.textKind,
          effectiveFrom: '2026-01-01T00:00:00.000Z',
          externalUrl: 'https://example.com/source',
          availability: 'full_content',
          downloadable: true,
        },
      },
    })
  })
}

const startDownload = async () => {
  await act(async () => button('Pobierz pakiet PDF')?.click())
  await act(async () => vi.waitFor(() => expect(downloadWorkers).toHaveLength(1)))

  return downloadWorkers[0]!
}

test('a failed package shows the document, keeps the selection and can retry or cancel', async () => {
  stubDownloads()
  await renderBuilder(seededCandidates)
  const worker = await startDownload()
  await act(async () => worker.respond({ type: 'failed', documentIndex: 0 }))
  await vi.waitFor(async () => {
    await act(async () => {})
    expect(button('Usuń z pakietu')).toBeDefined()
  })
  expect(container.querySelector('[role=alert]')?.textContent).toContain('Dokument PB')
  expect(container.querySelector('[role=alert]')?.textContent).toContain('Nie zapisano pliku.')
  expect(checkbox('PB')?.getAttribute('aria-checked')).toBe('true')
  expect(checkbox('USZ')?.getAttribute('aria-checked')).toBe('true')
  await act(async () => button('Spróbuj ponownie')?.click())
  await act(async () => vi.waitFor(() => expect(downloadWorkers).toHaveLength(2)))
  await act(async () => button('Anuluj przygotowanie')?.click())
  expect(container.textContent).toContain('Przygotowanie pakietu zostało anulowane.')
  await vi.waitFor(async () => {
    await act(async () => {})
    expect(button('Pobierz pakiet PDF')?.disabled).toBe(false)
  })
  expect(checkbox('PB')?.getAttribute('aria-checked')).toBe('true')
})

test('removing the failed document changes only that document and does not restart assembly', async () => {
  stubDownloads()
  await renderBuilder(seededCandidates)
  const worker = await startDownload()
  await act(async () => worker.respond({ type: 'failed', documentIndex: 0 }))
  await vi.waitFor(async () => {
    await act(async () => {})
    expect(button('Usuń z pakietu')).toBeDefined()
  })
  await act(async () => button('Usuń z pakietu')?.click())
  expect(checkbox('PB')?.getAttribute('aria-checked')).toBe('false')
  expect(checkbox('USZ')?.getAttribute('aria-checked')).toBe('true')
  expect(packageOrder()).toEqual(['USZ'])
  expect(container.querySelector('[role=alert]')).toBeNull()
  expect(button('Anuluj przygotowanie')).toBeUndefined()
})
