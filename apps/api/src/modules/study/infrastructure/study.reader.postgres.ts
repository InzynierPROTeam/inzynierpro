import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { Uuid } from '@inzpro/domain/common/id'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import {
  QuestionRevisionId,
  WrittenQuestionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import {
  SessionQuestionPosition,
  StudySessionId,
  unansweredQuestions,
} from '@inzpro/domain/modules/study/study-session'
import { Array as Arr, Effect, Layer, Option, Schema } from 'effect'
import { SqlClient, type Statement } from 'effect/sql'
import { makeCursorPaginator, mapCursorPage } from '~api/lib/cursor-pagination.js'
import { StudyReadError } from '~api/modules/study/application/errors.js'
import { StudyReader } from '~api/modules/study/application/study.reader.js'
import { DocumentQuestionPool } from '~api/modules/study/domain/study-document.model.js'
import {
  type SessionCandidate,
  type SessionQuestion,
  type SessionQuestionResult,
  StudySession,
  StudySessionResultCounts,
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
  isWithdrawn: Schema.Boolean,
  explanationOpenedAt: Schema.OptionFromNullOr(DateTimeUtc),
  // The submitted answer's columns are all null until the question is answered.
  submittedAnswerId: Schema.NullOr(QuestionAnswerId),
  submittedIsCorrect: Schema.NullOr(Schema.Boolean),
  submittedIsAssisted: Schema.NullOr(Schema.Boolean),
  submittedAt: Schema.NullOr(DateTimeUtc),
})

// A session question with its result; the answer columns are null until it is answered.
const SessionQuestionResultRow = Schema.Struct({
  position: SessionQuestionPosition,
  isCorrect: Schema.NullOr(Schema.Boolean),
  isAssisted: Schema.NullOr(Schema.Boolean),
  isWithdrawn: Schema.Boolean,
})

const toSessionQuestionResult = (
  row: typeof SessionQuestionResultRow.Type,
): SessionQuestionResult => ({
  position: row.position,
  answer:
    row.isCorrect === null || row.isAssisted === null
      ? Option.none()
      : Option.some({ isCorrect: row.isCorrect, isAssisted: row.isAssisted }),
  isWithdrawn: row.isWithdrawn,
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
    isWithdrawn: first.isWithdrawn,
    explanationOpenedAt: first.explanationOpenedAt,
    answer:
      first.submittedAnswerId === null ||
      first.submittedIsCorrect === null ||
      first.submittedIsAssisted === null ||
      first.submittedAt === null
        ? Option.none()
        : Option.some({
            answerId: first.submittedAnswerId,
            isCorrect: first.submittedIsCorrect,
            isAssisted: first.submittedIsAssisted,
            answeredAt: first.submittedAt,
          }),
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

    // The most recently used of the user's sessions on the path that meet the conditions.
    const findLatestSession = (
      userId: UserId,
      pathId: QualificationPathId,
      conditions: ReadonlyArray<Statement.Fragment>,
    ) =>
      sql`SELECT s.id,s.document_id,d.title AS document_title,s.user_exam_goal_version AS goal_version,s.question_count,s.current_position,(SELECT count(*)::integer FROM written_study_answers a WHERE a.study_session_id=s.id) AS answered_count,s.created_at,s.ended_at
 FROM written_study_sessions s JOIN reference_documents d ON d.id=s.document_id
 WHERE ${sql.and([sql`s.user_id=${userId}`, sql`s.qualification_path_id=${pathId}`, ...conditions])}
 ORDER BY s.last_activity_at DESC,s.id DESC LIMIT 1`.pipe(
        Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(StudySession))),
        Effect.map(Arr.head),
        Effect.mapError(cause => new StudyReadError({ cause })),
      )

    const documentsPage = makeCursorPaginator(sql, Schema.Struct({ id: Uuid }), [
      ['id', sql`d.id`, 'asc'],
    ])

    const resultsPage = makeCursorPaginator(
      sql,
      Schema.Struct({ position: SessionQuestionPosition }),
      [['position', sql`sq.position`, 'asc']],
    )

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
        function* (userId, pathId, fromDocumentId) {
          const isAnswered = sql`count(r.id)<=count(c.question_id)`

          // Documents with unanswered questions come first, from the starting document on. Among
          // answered ones the starting document comes last, so a fully answered path moves on in
          // order. Both wrap around to the documents before the start.
          const order = sql.csv([
            isAnswered,
            ...Option.match(fromDocumentId, {
              onNone: () => [],
              onSome: id => [sql`CASE WHEN ${isAnswered} THEN d.id<=${id} ELSE d.id<${id} END`],
            }),
            sql`d.id`,
          ])

          const rows =
            yield* sql`SELECT ${columns} FROM path_documents pd JOIN reference_documents d ON d.id=pd.document_id
 LEFT JOIN path_questions pq ON pq.qualification_path_id=pd.qualification_path_id AND pq.document_id=d.id
 LEFT JOIN written_questions q ON q.id=pq.question_id
 LEFT JOIN question_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL
 LEFT JOIN written_question_coverage c ON c.user_id=${userId} AND c.qualification_path_id=pd.qualification_path_id AND c.question_id=q.id AND c.question_revision_id=r.id
 WHERE pd.qualification_path_id=${pathId} GROUP BY d.id,d.title HAVING count(r.id)>0 ORDER BY ${order} LIMIT 1`

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
      unfinishedSession: Effect.fn('StudyReader.unfinishedSession')((userId, pathId, documentId) =>
        findLatestSession(userId, pathId, [
          sql`s.document_id=${documentId}`,
          sql`s.ended_at IS NULL`,
        ]),
      ),
      latestSession: Effect.fn('StudyReader.latestSession')((userId, pathId, documentId) =>
        findLatestSession(
          userId,
          pathId,
          Option.match(documentId, { onNone: () => [], onSome: id => [sql`s.document_id=${id}`] }),
        ),
      ),
      session: Effect.fn('StudyReader.session')((userId, pathId, sessionId) =>
        findLatestSession(userId, pathId, [sql`s.id=${sessionId}`]),
      ),
      sessionQuestion: Effect.fn('StudyReader.sessionQuestion')(
        function* (userId, pathId, sessionId, position) {
          const rows =
            yield* sql`SELECT s.id AS session_id,sq.position,sq.question_id,sq.question_revision_id,r.body,r.explanation,a.id AS answer_id,a.text AS answer_text,a.is_correct AS answer_is_correct,
 r.withdrawn_at IS NOT NULL AS is_withdrawn,sq.explanation_opened_at,
 sa.question_answer_id AS submitted_answer_id,sa.is_correct AS submitted_is_correct,sa.is_assisted AS submitted_is_assisted,sa.created_at AS submitted_at
 FROM written_study_sessions s JOIN written_study_session_questions sq ON sq.study_session_id=s.id
 JOIN question_revisions r ON r.id=sq.question_revision_id
 JOIN written_study_session_answer_options o ON o.study_session_id=sq.study_session_id AND o.position=sq.position
 JOIN question_answers a ON a.id=o.question_answer_id
 LEFT JOIN written_study_answers sa ON sa.study_session_id=sq.study_session_id AND sa.position=sq.position
 WHERE s.id=${sessionId} AND s.user_id=${userId} AND s.qualification_path_id=${pathId} AND sq.position=${position}
 ORDER BY o.option_position LIMIT 3`

          return toSessionQuestion(
            yield* Schema.decodeUnknownEffect(Schema.Array(SessionQuestionRow))(rows),
          )
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
      sessionCandidates: Effect.fn('StudyReader.sessionCandidates')(
        function* (userId, pathId, documentId, selection, limit) {
          // Coverage of the current revision means the question was answered in regular study.
          const unanswered =
            selection === unansweredQuestions
              ? sql`NOT EXISTS (SELECT 1 FROM written_question_coverage c WHERE c.user_id=${userId} AND c.qualification_path_id=pq.qualification_path_id AND c.question_id=q.id AND c.question_revision_id=r.id)`
              : sql`true`

          const rows =
            yield* sql`SELECT c.question_id,c.question_revision_id,a.id AS answer_id FROM (
 SELECT q.id AS question_id,r.id AS question_revision_id,q.created_at FROM path_questions pq
 JOIN written_questions q ON q.id=pq.question_id
 JOIN question_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL
 WHERE pq.qualification_path_id=${pathId} AND pq.document_id=${documentId} AND ${unanswered} ORDER BY q.created_at,q.id LIMIT ${limit}
 ) c JOIN question_answers a ON a.question_revision_id=c.question_revision_id
 ORDER BY c.created_at,c.question_id,a.created_at,a.id`

          return toCandidates(yield* Schema.decodeUnknownEffect(Schema.Array(CandidateRow))(rows))
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
      nextOpenPosition: Effect.fn('StudyReader.nextOpenPosition')(
        function* (sessionId, position) {
          const rows =
            yield* sql`SELECT sq.position FROM written_study_session_questions sq JOIN question_revisions r ON r.id=sq.question_revision_id
 LEFT JOIN written_study_answers a ON a.study_session_id=sq.study_session_id AND a.position=sq.position
 WHERE sq.study_session_id=${sessionId} AND a.position IS NULL AND r.withdrawn_at IS NULL
 ORDER BY sq.position<=${position},sq.position LIMIT 1`

          const data = yield* Schema.decodeUnknownEffect(
            Schema.Array(Schema.Struct({ position: SessionQuestionPosition })),
          )(rows)

          return Option.map(Arr.head(data), ({ position: next }) => next)
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
      sessionResultCounts: Effect.fn('StudyReader.sessionResultCounts')(
        function* (sessionId) {
          const rows =
            yield* sql`SELECT count(*) FILTER (WHERE is_correct)::integer AS correct,count(*) FILTER (WHERE NOT is_correct)::integer AS incorrect,count(*) FILTER (WHERE is_assisted)::integer AS assisted
 FROM written_study_answers WHERE study_session_id=${sessionId}`

          const [counts] = yield* Schema.decodeUnknownEffect(
            Schema.Tuple([StudySessionResultCounts]),
          )(rows)

          return counts
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
      sessionResults: Effect.fn('StudyReader.sessionResults')(
        function* (userId, pathId, sessionId, req) {
          const page = yield* resultsPage(
            req,
            window =>
              sql`SELECT sq.position,a.is_correct,a.is_assisted,r.withdrawn_at IS NOT NULL AS is_withdrawn
 FROM written_study_sessions s JOIN written_study_session_questions sq ON sq.study_session_id=s.id
 JOIN question_revisions r ON r.id=sq.question_revision_id
 LEFT JOIN written_study_answers a ON a.study_session_id=sq.study_session_id AND a.position=sq.position
 WHERE s.id=${sessionId} AND s.user_id=${userId} AND s.qualification_path_id=${pathId} AND ${window.after}
 ORDER BY ${window.orderBy} LIMIT ${window.limit}`.pipe(
                Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(SessionQuestionResultRow))),
              ),
            row => ({ position: row.position }),
          )

          return mapCursorPage(page, toSessionQuestionResult)
        },
        Effect.catchTags({
          SqlError: cause => Effect.fail(new StudyReadError({ cause })),
          SchemaError: cause => Effect.fail(new StudyReadError({ cause })),
        }),
      ),
    })
  }),
)
