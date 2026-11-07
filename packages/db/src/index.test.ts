import { databaseLayerFromConfig } from '@inzpro/db'
import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'
import { expect, test } from 'vitest'

test('test database layer connects to the dedicated PostgreSQL database', async () => {
  const rows = await Effect.runPromise(
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient

      return yield* sql`SELECT current_database() AS database`
    }).pipe(Effect.provide(databaseLayerFromConfig), Effect.scoped),
  )

  expect(rows).toEqual([{ database: 'inzpro_test' }])
})
