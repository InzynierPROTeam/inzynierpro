import type { QuestionRevisionId } from '@inzpro/domain/modules/learning-content/written-question'
import { Effect, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import { StudyReadError } from '~api/modules/written-study/application/errors.js'
import {
  WrittenAnswerOptionStatistics,
  WrittenQuestionStatistics,
} from '~api/modules/written-study/domain/written-statistics.model.js'

export const writtenStatisticsReader = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  return {
    questionStatistics: Effect.fn('StudyReader.questionStatistics')(
      function* (questionRevisionId: QuestionRevisionId) {
        const rows =
          yield* sql`SELECT mode,assistance,study_day,answer_count,correct_count FROM written_question_statistics
 WHERE question_revision_id=${questionRevisionId} ORDER BY study_day,mode,assistance`

        return yield* Schema.decodeUnknownEffect(Schema.Array(WrittenQuestionStatistics))(rows)
      },
      Effect.mapError(cause => new StudyReadError({ cause })),
    ),
    answerOptionStatistics: Effect.fn('StudyReader.answerOptionStatistics')(
      function* (questionRevisionId: QuestionRevisionId) {
        const rows =
          yield* sql`SELECT question_answer_id AS answer_id,mode,assistance,study_day,selection_count FROM written_answer_option_statistics
 WHERE question_revision_id=${questionRevisionId} ORDER BY study_day,mode,assistance,question_answer_id`

        return yield* Schema.decodeUnknownEffect(Schema.Array(WrittenAnswerOptionStatistics))(rows)
      },
      Effect.mapError(cause => new StudyReadError({ cause })),
    ),
  }
})
