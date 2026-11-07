import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

// Establish the migration ledger without creating tables for future domain features.
export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql`SELECT 1`
})
