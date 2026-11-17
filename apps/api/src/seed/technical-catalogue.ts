import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

import { seedOralCatalogue } from './oral-catalogue.js'
import { seedQualificationCatalogue } from './qualification-catalogue-seed.js'
import { seedWrittenCatalogue } from './written-catalogue.js'

export const seedTechnicalCatalogue = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql.withTransaction(
    Effect.gen(function* () {
      const pathIds = yield* seedQualificationCatalogue
      yield* seedWrittenCatalogue(pathIds)
      yield* seedOralCatalogue(pathIds)
    }),
  )
})
