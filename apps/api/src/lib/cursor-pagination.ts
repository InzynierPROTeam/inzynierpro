import { Cursor, defaultPageLimit, type PageLimit } from '@inzpro/domain/common/pagination'
import { type Array as Arr, Data, Effect, Schema } from 'effect'
import type { Statement } from 'effect/sql'

export type CursorPageRequest = {
  readonly cursor?: Cursor | undefined
  readonly limit?: PageLimit | undefined
}

export type CursorPage<A> = {
  readonly data: ReadonlyArray<A>
  readonly meta: { readonly hasMore: boolean; readonly nextCursor?: Cursor | undefined }
}

export class InvalidCursor extends Data.TaggedError('InvalidCursor') {}

type CursorKey = Schema.Top & {
  readonly DecodingServices: never
  readonly EncodingServices: never
}

export const cursorCodec = <S extends CursorKey>(key: S) =>
  Schema.StringFromBase64Url.pipe(Schema.decodeTo(Schema.fromJsonString(key)))

export const encodeCursor =
  <S extends CursorKey>(key: S) =>
  (value: S['Type']): Cursor =>
    Schema.decodeSync(Cursor)(Schema.encodeSync(cursorCodec(key))(value))

export const decodeCursor = <S extends CursorKey>(key: S, cursor: Cursor | undefined) =>
  cursor === undefined
    ? Effect.undefined
    : Schema.decodeEffect(cursorCodec(key))(cursor).pipe(Effect.mapError(() => new InvalidCursor()))

export const makeCursorPage = <A>(
  rows: ReadonlyArray<A>,
  limit: number,
  cursorOf: (row: A) => Cursor,
): CursorPage<A> => {
  const hasMore = rows.length > limit
  const data = hasMore ? rows.slice(0, limit) : rows
  const last = data[data.length - 1]

  return {
    data,
    meta: { hasMore, nextCursor: hasMore && last !== undefined ? cursorOf(last) : undefined },
  }
}

export const mapCursorPage = <A, B>(page: CursorPage<A>, f: (item: A) => B): CursorPage<B> => ({
  ...page,
  data: page.data.map(f),
})

export type SortDirection = 'asc' | 'desc'

type KeyFields = {
  readonly [field: string]: Schema.Top & {
    readonly DecodingServices: never
    readonly EncodingServices: never
  }
}

export type KeysetColumn<F extends KeyFields> = readonly [
  field: Extract<keyof Schema.Struct.Encoded<F>, string>,
  expression: Statement.Fragment,
  direction: SortDirection,
]

export type KeysetWindow = {
  readonly after: Statement.Fragment
  readonly orderBy: Statement.Fragment
  readonly limit: number
}

export const makeCursorPaginator = <F extends KeyFields>(
  sql: Statement.Constructor,
  key: Schema.Struct<F>,
  columns: Arr.NonEmptyReadonlyArray<KeysetColumn<F>>,
) => {
  const writeCursor = encodeCursor(key)
  const encodeKey = Schema.encodeSync(key)
  const [, , firstDirection] = columns[0]
  const sameDirection = columns.every(([, , direction]) => direction === firstDirection)
  const comparison = (direction: SortDirection) => sql.literal(direction === 'asc' ? '>' : '<')

  const orderBy = sql.csv(
    columns.map(
      ([, expression, direction]) =>
        sql`${expression} ${sql.literal(direction === 'asc' ? 'ASC' : 'DESC')}`,
    ),
  )

  const after = (cursor: Schema.Struct.Encoded<F>) => {
    const values = columns.map(([field]) => cursor[field])

    if (columns.length === 1) {
      const [[, expression, direction]] = columns

      return sql`${expression} ${comparison(direction)} ${values[0]}`
    }

    if (sameDirection) {
      return sql`(${sql.csv(columns.map(([, expression]) => expression))}) ${comparison(firstDirection)} (${sql.csv(values.map(value => sql`${value}`))})`
    }

    return sql.or(
      columns.map(([, expression, direction], index) =>
        sql.and([
          ...columns
            .slice(0, index)
            .map(([, previous], previousIndex) => sql`${previous} = ${values[previousIndex]}`),
          sql`${expression} ${comparison(direction)} ${values[index]}`,
        ]),
      ),
    )
  }

  return <Row, E, R>(
    page: CursorPageRequest,
    select: (window: KeysetWindow) => Effect.Effect<ReadonlyArray<Row>, E, R>,
    keyOf: (row: Row) => Schema.Struct.Type<F>,
  ): Effect.Effect<CursorPage<Row>, E | InvalidCursor, R> =>
    Effect.gen(function* () {
      const limit = page.limit ?? defaultPageLimit
      const cursor = yield* decodeCursor(key, page.cursor)

      const rows = yield* select({
        after: cursor === undefined ? sql`true` : after(encodeKey(cursor)),
        orderBy,
        limit: limit + 1,
      })

      return makeCursorPage(rows, limit, row => writeCursor(keyOf(row)))
    })
}
