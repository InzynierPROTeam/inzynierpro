// @vitest-environment jsdom
import { ReferenceDocument } from '@inzpro/api-contracts/modules/learning-content/responses'
import { Schema } from 'effect'
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ReferenceDocumentDetails } from './ReferenceDocumentDetails'

let root: Root
let container: HTMLDivElement

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

const standard = Schema.decodeSync(ReferenceDocument)({
  id: '20000000-0000-4000-8000-000000000003',
  code: 'pn-en-1990',
  kind: 'standard',
  abbreviation: 'PN-EN 1990',
  title: 'Eurokod. Podstawy projektowania konstrukcji',
  description: 'Pełny tekst normy można nabyć w Polskim Komitecie Normalizacyjnym.',
  edition: {
    id: '21000000-0000-4000-8000-000000000003',
    label: 'PN-EN 1990:2004',
    textKind: 'original',
    effectiveFrom: '2004-10-31T23:00:00.000Z',
    externalUrl: 'https://www.pkn.pl/',
    availability: 'metadata_only',
    downloadable: false,
  },
})

const renderDocument = (document: ReferenceDocument) =>
  act(async () => root.render(<ReferenceDocumentDetails document={document} />))

test('a metadata-only standard shows its description and external link', async () => {
  await renderDocument(standard)

  expect(container.textContent).toContain(
    'Pełny tekst normy można nabyć w Polskim Komitecie Normalizacyjnym.',
  )
  expect(container.textContent).toContain('Norma')
  expect(container.textContent).toContain('Tekst pierwotny')
  expect(container.textContent).toContain('1 listopada 2004')
  expect(container.querySelector('a')?.getAttribute('href')).toBe('https://www.pkn.pl/')
})
