import { Data, Effect, Schema } from 'effect'

export const defaultPageLimit = 20
export const maximumPageLimit = 100

export const PageLimit = Schema.Int.check(
  Schema.isBetween({ minimum: 1, maximum: maximumPageLimit }),
).pipe(Schema.brand('PageLimit'))

export const PageNumber = Schema.Int.check(Schema.isGreaterThan(0)).pipe(Schema.brand('PageNumber'))

export const Cursor = Schema.NonEmptyString.check(Schema.isMaxLength(512)).pipe(
  Schema.brand('Cursor'),
)

export type Cursor = typeof Cursor.Type

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

export class InvalidCursor extends Data.TaggedError('InvalidCursor') {}

export const resolveCursorPagination = (req: CursorPagination) => ({
  cursor: req.cursor,
  limit: req.limit ?? defaultPageLimit,
})

export const resolveOffsetPagination = (req: OffsetPagination) => {
  const page = req.page ?? 1
  const limit = req.limit ?? defaultPageLimit

  return { page, limit, offset: (page - 1) * limit }
}

export const decodeCursor = <S extends Schema.Top & { readonly DecodingServices: never }>(
  key: S,
  cursor: Cursor | undefined,
) =>
  cursor === undefined
    ? Effect.undefined
    : Schema.decodeEffect(key)(cursor).pipe(Effect.mapError(() => new InvalidCursor()))

export const makeCursorPage = <A>(
  rows: ReadonlyArray<A>,
  limit: number,
  cursorOf: (row: A) => string,
): CursorPage<A> => {
  const hasMore = rows.length > limit
  const data = hasMore ? rows.slice(0, limit) : rows
  const last = data[data.length - 1]

  return {
    data,
    meta: {
      hasMore,
      nextCursor:
        hasMore && last !== undefined ? Schema.decodeSync(Cursor)(cursorOf(last)) : undefined,
    },
  }
}

export const makeOffsetPage = <A>(data: ReadonlyArray<A>, total: number, req: OffsetPagination) => {
  const pagination = resolveOffsetPagination(req)

  return { data, meta: Schema.decodeSync(OffsetPaginationMeta)({ ...pagination, total }) }
}
