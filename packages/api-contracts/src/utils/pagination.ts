import { Cursor, PageLimit, PageNumber } from '@inzpro/domain/common/pagination'
import { Schema } from 'effect'

export const CursorPagination = Schema.Struct({
  cursor: Schema.optional(Cursor),
  limit: Schema.optional(Schema.FiniteFromString.pipe(Schema.decodeTo(PageLimit))),
})

export type CursorPagination = typeof CursorPagination.Type

export const OffsetPagination = Schema.Struct({
  page: Schema.optional(Schema.FiniteFromString.pipe(Schema.decodeTo(PageNumber))),
  limit: CursorPagination.fields.limit,
})

export type OffsetPagination = typeof OffsetPagination.Type

export const CursorPaginationMeta = Schema.Struct({
  nextCursor: Schema.optional(Cursor),
  hasMore: Schema.Boolean,
})

export const OffsetPaginationMeta = Schema.Struct({
  total: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  page: PageNumber,
  limit: PageLimit,
  offset: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
})

export const CursorPaginatedResponse = <S extends Schema.Top>(item: S) =>
  Schema.Struct({ data: Schema.Array(item), meta: CursorPaginationMeta })

export const OffsetPaginatedResponse = <S extends Schema.Top>(item: S) =>
  Schema.Struct({ data: Schema.Array(item), meta: OffsetPaginationMeta })

export type CursorPage<A> = {
  readonly data: ReadonlyArray<A>
  readonly meta: typeof CursorPaginationMeta.Type
}
