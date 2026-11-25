import type { UserId } from '@inzpro/domain/modules/identity/user'
import { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import {
  QuestionCount,
  type ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import {
  QuestionRevisionId,
  WrittenQuestionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import { StudyReadError } from '~api/modules/written-study/application/errors.js'
import { type SessionCandidate } from '~api/modules/written-study/domain/study-session.model.js'

const CandidateRow = Schema.Struct({
  questionId: WrittenQuestionId,
  questionRevisionId: QuestionRevisionId,
  answerId: QuestionAnswerId,
})

const toCandidates = (
  rows: ReadonlyArray<typeof CandidateRow.Type>,
): ReadonlyArray<SessionCandidate> => {
  const candidates = new Map<string, SessionCandidate & { answerIds: Array<QuestionAnswerId> }>()

  for (const row of rows) {
    const candidate = candidates.get(row.questionRevisionId) ?? {
      questionId: row.questionId,
      questionRevisionId: row.questionRevisionId,
      answerIds: [],
    }

    candidate.answerIds.push(row.answerId)
    candidates.set(row.questionRevisionId, candidate)
  }

  return [...candidates.values()]
}

export const writtenFavoritesReader = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  const favoriteQuestions = (
    userId: UserId,
    pathId: QualificationPathId,
    documentId: Option.Option<ReferenceDocumentId>,
  ) =>
    sql`FROM written_favorite_questions f
 JOIN path_questions pq ON pq.qualification_path_id=${pathId} AND pq.question_id=f.question_id
 JOIN path_documents pd ON pd.qualification_path_id=pq.qualification_path_id AND pd.document_id=pq.document_id
 JOIN written_questions q ON q.id=f.question_id
 JOIN question_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL
 WHERE ${sql.and([
   sql`f.user_id=${userId}`,
   ...Option.match(documentId, { onNone: () => [], onSome: id => [sql`pq.document_id=${id}`] }),
 ])}`

  return {
    favoriteQuestionCount: Effect.fn('StudyReader.favoriteQuestionCount')(
      function* (userId, pathId, documentId) {
        const rows =
          yield* sql`SELECT count(*)::integer AS favorite_question_count ${favoriteQuestions(userId, pathId, documentId)}`

        const [{ favoriteQuestionCount }] = yield* Schema.decodeUnknownEffect(
          Schema.Tuple([Schema.Struct({ favoriteQuestionCount: QuestionCount })]),
        )(rows)

        return favoriteQuestionCount
      },
      Effect.mapError(cause => new StudyReadError({ cause })),
    ),
    favoriteCandidates: Effect.fn('StudyReader.favoriteCandidates')(
      function* (userId, pathId, documentId, limit) {
        const rows = yield* sql`SELECT c.question_id,c.question_revision_id,a.id AS answer_id FROM (
 SELECT q.id AS question_id,r.id AS question_revision_id,pd.position,q.created_at ${favoriteQuestions(userId, pathId, documentId)}
 ORDER BY pd.position,q.created_at,q.id LIMIT ${limit}
 ) c JOIN question_answers a ON a.question_revision_id=c.question_revision_id
 ORDER BY c.position,c.created_at,c.question_id,a.created_at,a.id`

        return toCandidates(yield* Schema.decodeUnknownEffect(Schema.Array(CandidateRow))(rows))
      },
      Effect.mapError(cause => new StudyReadError({ cause })),
    ),
  }
})
