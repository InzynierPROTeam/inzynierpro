import { DocumentSectionAddress } from '@inzpro/domain/modules/learning-content/document-section-address'
import { Option } from 'effect'
import { expect, test } from 'vitest'

import {
  inDocumentOrder,
  unitInDocumentOrder,
  withSiblingPositions,
} from './document-section.rules.js'
import type { DocumentSection } from './reference-document.model.js'

const unit = (address: string, parentAddress?: string): DocumentSection => ({
  address: DocumentSectionAddress.make(address),
  parentAddress: Option.map(Option.fromNullishOr(parentAddress), parent =>
    DocumentSectionAddress.make(parent),
  ),
  title: Option.none(),
  content: Option.none(),
})

test('units read in document order: each unit followed by its descendants, siblings in position order', () => {
  const ordered = inDocumentOrder([
    unit('rozdz:1'),
    unit('rozdz:2'),
    unit('art:1', 'rozdz:1'),
    unit('art:3', 'rozdz:2'),
    unit('art:2', 'rozdz:1'),
    unit('art:1/ust:1', 'art:1'),
    unit('art:1/ust:1/pkt:1', 'art:1/ust:1'),
    unit('art:1/ust:2', 'art:1'),
  ])

  expect(ordered.map(section => section.address)).toEqual([
    'rozdz:1',
    'art:1',
    'art:1/ust:1',
    'art:1/ust:1/pkt:1',
    'art:1/ust:2',
    'art:2',
    'rozdz:2',
    'art:3',
  ])
})

test('each unit is numbered among the units that share its parent, in the order given', () => {
  const positioned = withSiblingPositions([
    { address: 'rozdz:1', parentAddress: null },
    { address: 'art:1', parentAddress: 'rozdz:1' },
    { address: 'art:1/ust:1', parentAddress: 'art:1' },
    { address: 'art:1/ust:2', parentAddress: 'art:1' },
    { address: 'art:2', parentAddress: 'rozdz:1' },
    { address: 'rozdz:2' },
    { address: 'art:3', parentAddress: 'rozdz:2' },
  ])

  expect(positioned.map(({ address, position }) => [address, position])).toEqual([
    ['rozdz:1', 1],
    ['art:1', 1],
    ['art:1/ust:1', 1],
    ['art:1/ust:2', 2],
    ['art:2', 2],
    ['rozdz:2', 2],
    ['art:3', 1],
  ])
})

test('a unit reads with its descendants in document order, without its parent or siblings', () => {
  const ordered = unitInDocumentOrder(DocumentSectionAddress.make('art:1/ust:1'), [
    unit('art:1/ust:1', 'art:1'),
    unit('art:1/ust:1/pkt:2', 'art:1/ust:1'),
    unit('art:1/ust:2', 'art:1'),
    unit('art:1/ust:1/pkt:1', 'art:1/ust:1'),
  ])

  expect(ordered.map(section => section.address)).toEqual([
    'art:1/ust:1',
    'art:1/ust:1/pkt:2',
    'art:1/ust:1/pkt:1',
  ])
})
