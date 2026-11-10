import { Effect, Layer } from 'effect'
import { SqlClient } from 'effect/sql'
import { QualificationPathsWriteError } from '~api/modules/qualification-paths/errors.js'

import { QualificationPathsRepository } from './qualification-paths.repository.js'

export const QualificationPathsRepositoryLive = Layer.effect(
  QualificationPathsRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    return QualificationPathsRepository.of({
      createScope: scope =>
        sql`INSERT INTO qualification_scopes (id,name) VALUES (${scope.id},${scope.name})`.pipe(
          Effect.asVoid,
          Effect.mapError(cause => new QualificationPathsWriteError({ cause })),
        ),
      createPath: path =>
        sql`INSERT INTO qualification_paths (id,name,specialization_id,qualification_kind_id,qualification_scope_id,published) VALUES (${path.id},${path.name},${path.specializationId},${path.qualificationKindId},${path.qualificationScopeId},true)`.pipe(
          Effect.asVoid,
          Effect.mapError(cause => new QualificationPathsWriteError({ cause })),
        ),

      lock: id =>
        sql`SELECT p.id FROM qualification_paths p JOIN specializations s ON s.id=p.specialization_id WHERE p.id=${id} LIMIT 1 FOR SHARE OF p,s`.pipe(
          Effect.asVoid,
          Effect.mapError(cause => new QualificationPathsWriteError({ cause })),
        ),
    })
  }),
)
