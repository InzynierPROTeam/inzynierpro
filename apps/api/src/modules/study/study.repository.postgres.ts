import { Effect, Layer } from 'effect'
import { SqlClient } from 'effect/sql'

import { StudyWriteError } from './errors.js'
import { StudyRepository } from './study.repository.js'

export const StudyRepositoryLive = Layer.effect(
  StudyRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    return StudyRepository.of({
      recordCoverage: (userId, pathId, questionId, revisionId) =>
        sql`INSERT INTO written_question_coverage (user_id,qualification_path_id,question_id,question_revision_id) VALUES (${userId},${pathId},${questionId},${revisionId}) ON CONFLICT (user_id,qualification_path_id,question_id) DO UPDATE SET question_revision_id=EXCLUDED.question_revision_id,covered_at=clock_timestamp()`.pipe(
          Effect.asVoid,
          Effect.mapError(cause => new StudyWriteError({ cause })),
        ),
    })
  }),
)
