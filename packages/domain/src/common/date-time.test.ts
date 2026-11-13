import { DateTime, Option, Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import {
  DateTimeUtc,
  UtcIsoDateTime,
  dateTimeUtcToUtcIsoDateTime,
  utcIsoDateTimeToDateTimeUtc,
} from './date-time.js'

describe('date representations', () => {
  const iso = '2026-07-15T10:30:00.000Z'

  it('keeps the public value a canonical ISO string', () => {
    expect(Schema.decodeSync(UtcIsoDateTime)(iso)).toBe(iso)
    expect(Schema.encodeSync(UtcIsoDateTime)(Schema.decodeSync(UtcIsoDateTime)(iso))).toBe(iso)
  })

  it.each([
    '2026-07-15T10:30:00Z',
    '2026-07-15T12:30:00.000+02:00',
    '2026-02-30T12:00:00.000Z',
    'invalid',
  ])('rejects noncanonical timestamp %s', value => {
    expect(Option.isNone(Schema.decodeOption(UtcIsoDateTime)(value))).toBe(true)
  })

  it('reports invalid internal input as a schema failure', () => {
    expect(Option.isNone(Schema.decodeOption(DateTimeUtc)('invalid'))).toBe(true)
  })

  it('decodes SQL dates and ISO into the same Effect instant and encodes ISO', () => {
    const expected = DateTime.makeUnsafe(iso)
    const fromSql = Schema.decodeSync(DateTimeUtc)(DateTime.toDateUtc(expected))
    const fromHttp = Schema.decodeSync(DateTimeUtc)(iso)
    expect(DateTime.isDateTime(fromSql)).toBe(true)
    expect(DateTime.formatIso(fromSql)).toBe(iso)
    expect(DateTime.formatIso(fromHttp)).toBe(iso)
    expect(Schema.encodeSync(DateTimeUtc)(fromSql)).toBe(iso)
    expect(
      DateTime.formatIso(utcIsoDateTimeToDateTimeUtc(dateTimeUtcToUtcIsoDateTime(expected))),
    ).toBe(iso)
  })
})
