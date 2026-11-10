import { Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import { Uuid } from './id.js'

it('keeps a validated identifier as JSON-compatible plain data', () => {
  const value = Schema.decodeSync(Uuid)('550e8400-e29b-41d4-a716-446655440000')

  expect(JSON.parse(JSON.stringify({ id: value }))).toEqual({ id: value })
})

describe('identifier validation', () => {
  it.each(['invalid', '', 42])('rejects an invalid identifier: %s', value => {
    expect(() => Schema.decodeUnknownSync(Uuid)(value)).toThrow()
  })
})
