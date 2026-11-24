import { Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import { ExternalUrl } from './external-url.js'

describe('ExternalUrl', () => {
  it.each(['https://isap.sejm.gov.pl/', 'http://www.pkn.pl/'])('accepts %s', value => {
    expect(Schema.is(ExternalUrl)(value)).toBe(true)
  })

  it.each(['', 'https://', 'isap.sejm.gov.pl', 'ftp://example.com', 'javascript:alert(1)'])(
    'rejects "%s"',
    value => {
      expect(Schema.is(ExternalUrl)(value)).toBe(false)
    },
  )
})
