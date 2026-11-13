import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { Uuid } from '@inzpro/domain/common/id'
import { Cursor } from '@inzpro/domain/common/pagination'
import { Effect, Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import { decodeCursor, encodeCursor, makeCursorPage, mapCursorPage } from './cursor-pagination.js'

const Key = Schema.Struct({ at: DateTimeUtc, id: Uuid })

const key = {
  at: Schema.decodeSync(DateTimeUtc)('2026-05-01T08:00:00.000Z'),
  id: Schema.decodeSync(Uuid)('550e8400-e29b-41d4-a716-446655440000'),
}

describe('cursor codec', () => {
  it('writes an opaque URL-safe token that decodes back to the key', async () => {
    const cursor = encodeCursor(Key)(key)

    expect(cursor).toMatch(/^[\w-]+$/)
    expect(await Effect.runPromise(decodeCursor(Key, cursor))).toEqual(key)
  })

  it('reads an absent cursor as the first page', async () => {
    expect(await Effect.runPromise(decodeCursor(Key, undefined))).toBeUndefined()
  })

  it.each([
    'not-base64!',
    Buffer.from('not json').toString('base64url'),
    Buffer.from(JSON.stringify({ id: 'invalid' })).toString('base64url'),
  ])('rejects a malformed cursor: %s', async value => {
    const result = await Effect.runPromise(
      Effect.flip(decodeCursor(Key, Schema.decodeSync(Cursor)(value))),
    )

    expect(result._tag).toBe('InvalidCursor')
  })
})

describe('cursor page', () => {
  const cursorOf = (row: number) => Schema.decodeSync(Cursor)(`c${row}`)

  it('drops the look-ahead row and points the cursor at the last returned row', () => {
    expect(makeCursorPage([1, 2, 3], 2, cursorOf)).toEqual({
      data: [1, 2],
      meta: { hasMore: true, nextCursor: 'c2' },
    })
  })

  it('ends without a cursor when no look-ahead row exists', () => {
    expect(makeCursorPage([1, 2], 2, cursorOf)).toEqual({
      data: [1, 2],
      meta: { hasMore: false, nextCursor: undefined },
    })
  })

  it('maps items and keeps the page metadata', () => {
    expect(mapCursorPage(makeCursorPage([1, 2, 3], 2, cursorOf), String)).toEqual({
      data: ['1', '2'],
      meta: { hasMore: true, nextCursor: 'c2' },
    })
  })
})
