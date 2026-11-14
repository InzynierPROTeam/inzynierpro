import { Uuid } from '@inzpro/domain/common/id'
import { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import {
  QuestionRevisionId,
  WrittenQuestionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import { SessionQuestionPosition, StudySessionId } from '@inzpro/domain/modules/study/study-session'
import { Array as Arr, Effect, Layer, Option, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import { makeCursorPaginator } from '~api/lib/cursor-pagination.js'
import { StudyReadError } from '~api/modules/study/application/errors.js'
import { StudyReader } from '~api/modules/study/application/study.reader.js'
import { DocumentQuestionPool } from '~api/modules/study/domain/study-document.model.js'
import {
  type SessionCandidate,
  type SessionQuestion,
  StudySession,
} from '~api/modules/study/domain/study-session.model.js'

// One row per answer option of a candidate question; options are grouped in TypeScript.
const CandidateRow = Schema.Struct({
  questionId: WrittenQuestionId,
  questionRevisionId: QuestionRevisionId,
  answerId: QuestionAnswerId,
})

// One row per answer option of a session question, in the session's stored option order.
const SessionQuestionRow = Schema.Struct({
  sessionId: StudySessionId,
  position: SessionQuestionPosition,
  questionId: WrittenQuestionId,
  questionRevisionId: QuestionRevisionId,
  body: Schema.NonEmptyString,
  explanation: Schema.NonEmptyString,
  answerId: QuestionAnswerId,
  answerText: Schema.NonEmptyString,
  answerIsCorrect: Schema.Boolean,
})

const toSessionQuestion = (
  rows: ReadonlyArray<typeof SessionQuestionRow.Type>,
): Option.Option<SessionQuestion> =>
  Option.map(Arr.head(rows), first => ({
    sessionId: first.sessionId,
    position: first.position,
    questionId: first.questionId,
    questionRevisionId: first.questionRevisionId,
    body: first.body,
    explanation: first.explanation,
    answers: rows.map(row => ({
      id: row.answerId,
      text: row.answerText,
      isCorrect: row.answerIsCorrect,
    })),
  }))

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

export const StudyReaderLive = Layer.effect(
  StudyReader,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const columns = sql`d.id,d.title,count(r.id)::integer AS available_question_count,count(c.question_id)::integer AS completed_question_count`

    // Answers are not recorded yet (#8), so no session has answered questions.
    const sessionColumns = sql`s.id,s.document_id,d.title AS document_title,s.question_count,s.current_position,0 AS answered_count,s.created_at,s.ended_at`

    const documentsPage = makeCursorPaginator(sql, Schema.Struct({ id: Uuid }), [
      ['id', sql`d.id`, 'asc'],
    ])

    return StudyReader.of({
      documents: Effect.fn('StudyReader.documents')(
        function* (userId, pathId, req) {
          return yield* documentsPage(
            req,
            page =>
              sql`SELECT ${columns} FROM path_documents pd JOIN reference_documents d ON d.id=pd.document_id
 LEFT JOIN path_questions pq ON pq.qualification_path_id=pd.qualification_path_id AND pq.document_id=d.id
 LEFT JOIN written_questions q ON q.id=pq.question_id
 LEFT JOIN question_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL
 LEFT JOIN written_question_coverage c ON c.user_id=${userId} AND c.qualification_path_id=pd.qualification_path_id AND c.question_id=q.id AND c.question_revision_id=r.id
 WHERE pd.qualification_path_id=${pathId} AND ${page.after} GROUP BY d.id,d.title ORDER BY ${page.orderBy} LIMIT ${page.limit}`.pipe(
                Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(DocumentQuestionPool))),
              ),
            row => ({ id: row.id }),
          )
        },
        Effect.catchTags({
          SqlError: cause => Effect.fail(new StudyReadError({ cause })),
          SchemaError: cause => Effect.fail(new StudyReadError({ cause })),
        }),
      ),
      nextDocument: Effect.fn('StudyReader.nextDocument')(
        function* (userId, pathId, afterDocumentId) {
          const after = Option.match(afterDocumentId, {
            onNone: () => sql`true`,
            onSome: id => sql`d.id > ${id}`,
          })

          const rows =
            yield* sql`SELECT ${columns} FROM path_documents pd JOIN reference_documents d ON d.id=pd.document_id
 LEFT JOIN path_questions pq ON pq.qualification_path_id=pd.qualification_path_id AND pq.document_id=d.id
 LEFT JOIN written_questions q ON q.id=pq.question_id
 LEFT JOIN question_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL
 LEFT JOIN written_question_coverage c ON c.user_id=${userId} AND c.qualification_path_id=pd.qualification_path_id AND c.question_id=q.id AND c.question_revision_id=r.id
 WHERE pd.qualification_path_id=${pathId} AND ${after} GROUP BY d.id,d.title HAVING count(r.id)>0 ORDER BY d.id LIMIT 1`

          const data = yield* Schema.decodeUnknownEffect(Schema.Array(DocumentQuestionPool))(rows)

          return Option.fromNullishOr(data[0])
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
      document: Effect.fn('StudyReader.document')(
        function* (userId, pathId, documentId) {
          const rows =
            yield* sql`SELECT ${columns} FROM path_documents pd JOIN reference_documents d ON d.id=pd.document_id
 LEFT JOIN path_questions pq ON pq.qualification_path_id=pd.qualification_path_id AND pq.document_id=d.id
 LEFT JOIN written_questions q ON q.id=pq.question_id
 LEFT JOIN question_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL
 LEFT JOIN written_question_coverage c ON c.user_id=${userId} AND c.qualification_path_id=pd.qualification_path_id AND c.question_id=q.id AND c.question_revision_id=r.id
 WHERE pd.qualification_path_id=${pathId} AND d.id=${documentId} GROUP BY d.id,d.title LIMIT 1`

          const data = yield* Schema.decodeUnknownEffect(Schema.Array(DocumentQuestionPool))(rows)

          return Option.fromNullishOr(data[0])
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
      unfinishedSession: Effect.fn('StudyReader.unfinishedSession')(
        function* (userId, pathId, documentId) {
          const rows =
            yield* sql`SELECT ${sessionColumns} FROM written_study_sessions s JOIN reference_documents d ON d.id=s.document_id
 WHERE s.user_id=${userId} AND s.qualification_path_id=${pathId} AND s.document_id=${documentId} AND s.ended_at IS NULL LIMIT 1`

          return Arr.head(yield* Schema.decodeUnknownEffect(Schema.Array(StudySession))(rows))
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
      latestSession: Effect.fn('StudyReader.latestSession')(
        function* (userId, pathId, documentId) {
          const rows =
            yield* sql`SELECT ${sessionColumns} FROM written_study_sessions s JOIN reference_documents d ON d.id=s.document_id
 WHERE ${sql.and([
   sql`s.user_id=${userId}`,
   sql`s.qualification_path_id=${pathId}`,
   ...Option.match(documentId, { onNone: () => [], onSome: id => [sql`s.document_id=${id}`] }),
 ])} ORDER BY s.created_at DESC,s.id DESC LIMIT 1`

          return Arr.head(yield* Schema.decodeUnknownEffect(Schema.Array(StudySession))(rows))
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
      session: Effect.fn('StudyReader.session')(
        function* (userId, pathId, sessionId) {
          const rows =
            yield* sql`SELECT ${sessionColumns} FROM written_study_sessions s JOIN reference_documents d ON d.id=s.document_id
 WHERE s.id=${sessionId} AND s.user_id=${userId} AND s.qualification_path_id=${pathId} LIMIT 1`

          return Arr.head(yield* Schema.decodeUnknownEffect(Schema.Array(StudySession))(rows))
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
      sessionQuestion: Effect.fn('StudyReader.sessionQuestion')(
        function* (userId, pathId, sessionId, position) {
          const rows =
            yield* sql`SELECT s.id AS session_id,sq.position,sq.question_id,sq.question_revision_id,r.body,r.explanation,a.id AS answer_id,a.text AS answer_text,a.is_correct AS answer_is_correct
 FROM written_study_sessions s JOIN written_study_session_questions sq ON sq.study_session_id=s.id
 JOIN question_revisions r ON r.id=sq.question_revision_id
 JOIN written_study_session_answer_options o ON o.study_session_id=sq.study_session_id AND o.position=sq.position
 JOIN question_answers a ON a.id=o.question_answer_id
 WHERE s.id=${sessionId} AND s.user_id=${userId} AND s.qualification_path_id=${pathId} AND sq.position=${position}
 ORDER BY o.option_position LIMIT 3`

          return toSessionQuestion(
            yield* Schema.decodeUnknownEffect(Schema.Array(SessionQuestionRow))(rows),
          )
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
      sessionCandidates: Effect.fn('StudyReader.sessionCandidates')(
        function* (pathId, documentId, limit) {
          const rows =
            yield* sql`SELECT c.question_id,c.question_revision_id,a.id AS answer_id FROM (
 SELECT q.id AS question_id,r.id AS question_revision_id,q.created_at FROM path_questions pq
 JOIN written_questions q ON q.id=pq.question_id
 JOIN question_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL
 WHERE pq.qualification_path_id=${pathId} AND pq.document_id=${documentId} ORDER BY q.created_at,q.id LIMIT ${limit}
 ) c JOIN question_answers a ON a.question_revision_id=c.question_revision_id
 ORDER BY c.created_at,c.question_id,a.created_at,a.id`

          return toCandidates(yield* Schema.decodeUnknownEffect(Schema.Array(CandidateRow))(rows))
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
    })
  }),
)
