import type { UserId } from '@inzpro/domain/modules/identity/user'
import {
  OralQuestionId,
  OralRevisionId,
} from '@inzpro/domain/modules/learning-content/oral-question'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import { StudyReadError } from '~api/modules/oral-study/application/errors.js'

const CandidateRow = Schema.Struct({ questionId: OralQuestionId, oralRevisionId: OralRevisionId })

export const oralFavoritesReader = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  const favoriteQuestions = (
    userId: UserId,
    pathId: QualificationPathId,
  ) => sql`FROM oral_favorite_questions f
 JOIN path_oral_questions pq ON pq.question_id=f.question_id AND pq.qualification_path_id=${pathId}
 JOIN oral_questions q ON q.id=f.question_id
 JOIN oral_question_categories c ON c.id=q.category_id
 JOIN oral_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL
 WHERE f.user_id=${userId}`

  return {
    favoriteQuestionCount: Effect.fn('OralStudyReader.favoriteQuestionCount')(
      function* (userId, pathId) {
        const rows =
          yield* sql`SELECT count(*)::integer AS count ${favoriteQuestions(userId, pathId)}`

        const [row] = yield* Schema.decodeUnknownEffect(
          Schema.Tuple([Schema.Struct({ count: QuestionCount })]),
        )(rows)

        return row.count
      },
      Effect.mapError(cause => new StudyReadError({ cause })),
    ),
    favoriteCandidates: Effect.fn('OralStudyReader.favoriteCandidates')(
      function* (userId, pathId, limit) {
        const rows =
          yield* sql`SELECT q.id AS question_id,r.id AS oral_revision_id ${favoriteQuestions(userId, pathId)} ORDER BY c.sort_order,c.id,q.category_position,q.id LIMIT ${limit}`

        return yield* Schema.decodeUnknownEffect(Schema.Array(CandidateRow))(rows)
      },
      Effect.mapError(cause => new StudyReadError({ cause })),
    ),
  }
})
