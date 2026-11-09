import { Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import { Email } from './email.js'

describe('Email', () => {
  it.each(['kandydat@example.com', 'jan.kowalski+egzamin@poczta.pl'])('accepts %s', value => {
    expect(Schema.is(Email)(value)).toBe(true)
  })

  it.each(['', 'kandydat', 'kandydat@', '@example.com', 'jan kowalski@example.com'])(
    'rejects "%s"',
    value => {
      expect(Schema.is(Email)(value)).toBe(false)
    },
  )
})
