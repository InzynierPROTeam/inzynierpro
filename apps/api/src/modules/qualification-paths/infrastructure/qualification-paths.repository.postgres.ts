import { Effect, Layer } from 'effect'
import { SqlClient } from 'effect/sql'
import { QualificationPathsWriteError } from '~api/modules/qualification-paths/application/errors.js'
import { QualificationPathsRepository } from '~api/modules/qualification-paths/application/qualification-paths.repository.js'

export const QualificationPathsRepositoryLive = Layer.effect(
  QualificationPathsRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    return QualificationPathsRepository.of({
      lock: Effect.fn('QualificationPathsRepository.lock')(function* (id) {
        return yield* sql`SELECT p.id FROM qualification_paths p JOIN specializations s ON s.id=p.specialization_id WHERE p.id=${id} LIMIT 1 FOR SHARE OF p,s`.pipe(
          Effect.asVoid,
          Effect.mapError(cause => new QualificationPathsWriteError({ cause })),
        )
      }),
      lockExclusively: Effect.fn('QualificationPathsRepository.lockExclusively')(function* (id) {
        return yield* sql`SELECT id FROM qualification_paths WHERE id=${id} LIMIT 1 FOR NO KEY UPDATE`.pipe(
          Effect.asVoid,
          Effect.mapError(cause => new QualificationPathsWriteError({ cause })),
        )
      }),
    })
  }),
)
