import type { OralRevisionId } from '@inzpro/domain/modules/learning-content/oral-question'
import { Effect, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import { StudyReadError } from '~api/modules/oral-study/application/errors.js'
import { OralSelfAssessmentStatistics } from '~api/modules/oral-study/domain/oral-statistics.model.js'

export const oralStatisticsReader = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  return {
    selfAssessmentStatistics: Effect.fn('OralStudyReader.selfAssessmentStatistics')(
      function* (oralRevisionId: OralRevisionId) {
        const rows =
          yield* sql`SELECT study_day,self_assessment,assessment_count FROM oral_self_assessment_statistics
 WHERE oral_revision_id=${oralRevisionId} ORDER BY study_day,self_assessment`

        return yield* Schema.decodeUnknownEffect(Schema.Array(OralSelfAssessmentStatistics))(rows)
      },
      Effect.mapError(cause => new StudyReadError({ cause })),
    ),
  }
})
