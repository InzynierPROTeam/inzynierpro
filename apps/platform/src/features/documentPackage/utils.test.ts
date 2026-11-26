import type { DocumentPackageCandidate } from '@inzpro/api-contracts/modules/learning-content/responses'
import { ByteSize } from '@inzpro/domain/modules/learning-content/content-asset'
import { DocumentPageCount } from '@inzpro/domain/modules/learning-content/document-edition'
import type { PackageAvailability } from '@inzpro/domain/modules/learning-content/document-package'
import {
  ReferenceDocumentCode,
  ReferenceDocumentId,
  type ReferenceDocumentKind,
} from '@inzpro/domain/modules/learning-content/reference-document'
import { DateTime } from 'effect'
import { expect, test } from 'vitest'

import {
  candidatesByKind,
  defaultPackageSelection,
  movePackageDocument,
  packageFileName,
  reconcilePackageSelection,
  restoreDefaultOrder,
  selectedCandidates,
  togglePackageDocument,
} from './utils'

const code = (value: string) => ReferenceDocumentCode.make(value)

const candidate = (
  value: string,
  kind: ReferenceDocumentKind,
  availability: PackageAvailability,
  pageCount: number | null = 10,
): DocumentPackageCandidate => ({
  id: ReferenceDocumentId.make(crypto.randomUUID()),
  code: code(value),
  kind,
  abbreviation: value.toUpperCase(),
  title: `Dokument ${value}`,
  editionLabel: `Wydanie ${value}`,
  textKind: 'official_consolidated',
  availability,
  pdf:
    pageCount === null
      ? null
      : { pageCount: DocumentPageCount.make(pageCount), size: ByteSize.make(pageCount * 1000) },
})

const candidates = [
  candidate('norma', 'standard', 'metadata_only', null),
  candidate('pb', 'statute', 'included', 8),
  candidate('usz', 'statute', 'included', 6),
  candidate('wt', 'regulation', 'download_not_allowed', 3),
  candidate('zp', 'regulation', 'included', 2),
]

test('every included document is selected by default in path order', () => {
  expect(defaultPackageSelection(candidates)).toEqual({
    selected: [code('pb'), code('usz'), code('zp')],
    excluded: [],
  })
})

test('candidates are grouped by document kind, keeping path order within a group', () => {
  expect(
    candidatesByKind(candidates).map(group => ({
      kind: group.kind,
      codes: group.candidates.map(item => item.code),
    })),
  ).toEqual([
    { kind: 'statute', codes: ['pb', 'usz'] },
    { kind: 'regulation', codes: ['wt', 'zp'] },
    { kind: 'standard', codes: ['norma'] },
  ])
})

test('a stored selection keeps its order and exclusions, drops stale entries and adds new included documents', () => {
  expect(
    reconcilePackageSelection(
      {
        selected: [code('usz'), code('wt'), code('gone'), code('pb'), code('usz')],
        excluded: [code('norma'), code('zp')],
      },
      [...candidates, candidate('nowy', 'statute', 'included')],
    ),
  ).toEqual({
    selected: [code('usz'), code('pb'), code('nowy')],
    excluded: [code('zp')],
  })
})

test('deselecting excludes a document and selecting it again appends it to the order', () => {
  const deselected = togglePackageDocument(defaultPackageSelection(candidates), code('pb'))

  expect(deselected).toEqual({ selected: [code('usz'), code('zp')], excluded: [code('pb')] })
  expect(togglePackageDocument(deselected, code('pb'))).toEqual({
    selected: [code('usz'), code('zp'), code('pb')],
    excluded: [],
  })
})

test('a document moves to a new position, and moves past either end are ignored', () => {
  const selection = defaultPackageSelection(candidates)

  expect(movePackageDocument(selection, 0, 2).selected).toEqual([
    code('usz'),
    code('zp'),
    code('pb'),
  ])
  expect(movePackageDocument(selection, 2, 1).selected).toEqual([
    code('pb'),
    code('zp'),
    code('usz'),
  ])
  expect(movePackageDocument(selection, 0, -1)).toBe(selection)
  expect(movePackageDocument(selection, 2, 3)).toBe(selection)
})

test('restoring the default order sorts the selection by path order and keeps exclusions', () => {
  const reordered = togglePackageDocument(
    movePackageDocument(defaultPackageSelection(candidates), 0, 2),
    code('usz'),
  )

  expect(restoreDefaultOrder(reordered, candidates)).toEqual({
    selected: [code('pb'), code('zp')],
    excluded: [code('usz')],
  })
})

test('selected documents follow the selected order', () => {
  const selected = selectedCandidates(
    { selected: [code('zp'), code('pb')], excluded: [] },
    candidates,
  )

  expect(selected.map(item => item.code)).toEqual(['zp', 'pb'])
})

test('the package file is named after the specialization, qualification kind and scope and the Warsaw date', () => {
  expect(
    packageFileName(
      {
        specialization: { code: 'konstrukcyjno-budowlana' },
        qualificationKind: { code: 'projektowanie' },
        qualificationScope: { code: 'bez-ograniczen' },
      },
      DateTime.makeUnsafe('2026-11-24T23:30:00.000Z'),
    ),
  ).toBe('InzynierPRO-KB-P-BO-2026-11-25.pdf')
})
