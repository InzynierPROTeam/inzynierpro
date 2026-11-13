import {
  type CursorPage,
  type CursorPagination,
  type InvalidCursor,
  decodeCursor,
  encodeCursor,
  makeCursorPage,
  resolveCursorPagination,
} from '@inzpro/domain/common/pagination'
import { type Array as Arr, Effect, Schema } from 'effect'
import type { Statement } from 'effect/sql'

export type SortDirection = 'asc' | 'desc'

type KeyFields = {
  readonly [field: string]: Schema.Top & {
    readonly DecodingServices: never
    readonly EncodingServices: never
  }
}

/** One sort column: the cursor key field, the SQL expression it is read from and its direction. */
export type KeysetColumn<F extends KeyFields> = readonly [
  field: Extract<keyof Schema.Struct.Encoded<F>, string>,
  expression: Statement.Fragment,
  direction: SortDirection,
]

/** The SQL a reader interpolates into its SELECT for the requested page. */
export type KeysetWindow = {
  /** `true` on the first page, otherwise the keyset predicate for rows after the cursor. */
  readonly after: Statement.Fragment
  readonly orderBy: Statement.Fragment
  /** One row more than the page, so the page knows whether another exists. */
  readonly limit: number
}

/**
 * Keyset (seek) pagination over an ordered SELECT. The sort columns are declared once and drive
 * ORDER BY, the predicate after the cursor and the opaque cursor written from the last row, so the
 * three cannot drift apart.
 *
 * The columns must be NOT NULL and end with a unique column (usually the id) for a total order.
 *
 * @example
 * const documentsPage = makeCursorPaginator(sql, Schema.Struct({ id: Uuid }), [
 *   ['id', sql`d.id`, 'asc'],
 * ])
 *
 * documentsPage(req, page => sql`SELECT ... WHERE ${page.after} ORDER BY ${page.orderBy} LIMIT ${page.limit}`, row => ({ id: row.id }))
 */
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

    // A row comparison keeps one index range scan when every column sorts the same way.
    if (sameDirection) {
      return sql`(${sql.csv(columns.map(([, expression]) => expression))}) ${comparison(firstDirection)} (${sql.csv(values.map(value => sql`${value}`))})`
    }

    // Mixed directions: (a > x) OR (a = x AND b < y) OR ...
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
    page: CursorPagination,
    select: (window: KeysetWindow) => Effect.Effect<ReadonlyArray<Row>, E, R>,
    keyOf: (row: Row) => Schema.Struct.Type<F>,
  ): Effect.Effect<CursorPage<Row>, E | InvalidCursor, R> =>
    Effect.gen(function* () {
      const { limit } = resolveCursorPagination(page)
      const cursor = yield* decodeCursor(key, page.cursor)

      const rows = yield* select({
        after: cursor === undefined ? sql`true` : after(encodeKey(cursor)),
        orderBy,
        limit: limit + 1,
      })

      return makeCursorPage(rows, limit, row => writeCursor(keyOf(row)))
    })
}
