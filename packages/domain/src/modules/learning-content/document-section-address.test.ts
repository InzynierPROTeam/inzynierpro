import { Option, Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import {
  DocumentSectionAddress,
  documentSectionLabel,
  documentUnitLabel,
  enclosingUnitAddress,
} from './document-section-address.js'

const address = Schema.decodeSync(DocumentSectionAddress)

describe('DocumentSectionAddress', () => {
  it.each([
    ['cz:1', 'cz. 1'],
    ['rozdz:2', 'rozdz. 2'],
    ['cz:1/rozdz:3', 'cz. 1 rozdz. 3'],
    ['art:5', 'art. 5'],
    ['art:5/ust:1/pkt:2', 'art. 5 ust. 1 pkt 2'],
    ['art:29a/pkt:4/lit:b', 'art. 29a pkt 4 lit. b'],
    ['par:12/ust:3', '§ 12 ust. 3'],
    ['tab:3', 'tab. 3'],
    ['zal:1', 'zał. nr 1'],
    ['zal:1/tab:2', 'zał. nr 1 tab. 2'],
  ])('labels %s as "%s"', (normalized, label) => {
    expect(documentSectionLabel(address(normalized))).toBe(label)
  })

  it.each([
    '',
    'art',
    'art:',
    'art:0',
    'art:05',
    'ART:5',
    'art:5/',
    'art:5//ust:1',
    'ust:1',
    'pkt:2',
    'lit:a',
    'art:5/lit:a',
    'art:5/ust:1/ust:2',
    'art:5/par:1',
    'rozdz:2/art:5',
    'tab:3/pkt:1',
    'lit:1',
    'art:5/pkt:2/lit:4',
    'ust:1/art:5',
    'foo:1',
  ])('rejects the normalized address "%s"', value => {
    expect(Schema.is(DocumentSectionAddress)(value)).toBe(false)
  })
})

describe('documentUnitLabel', () => {
  it.each([
    ['rozdz:5a', 'rozdz. 5a'],
    ['art:62/ust:1/pkt:1/lit:a', 'lit. a'],
    ['par:12/ust:3', 'ust. 3'],
    ['zal:2', 'zał. nr 2'],
  ])('labels the last unit of %s as "%s"', (normalized, label) => {
    expect(documentUnitLabel(address(normalized))).toBe(label)
  })
})

describe('enclosingUnitAddress', () => {
  it.each([
    ['art:62/ust:1/pkt:1/lit:a', Option.some('art:62/ust:1/pkt:1')],
    ['zal:1/tab:2', Option.some('zal:1')],
    ['art:62', Option.none()],
    ['rozdz:2', Option.none()],
  ])('finds the unit that %s is part of', (normalized, enclosing) => {
    expect(enclosingUnitAddress(address(normalized))).toEqual(enclosing)
  })
})
