import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import {
  QuestionRevisionId,
  WrittenQuestionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import { QuestionNoteText } from '@inzpro/domain/modules/learning/question-note'
import {
  regularStudySession,
  SessionQuestionPosition,
  StudySessionId,
} from '@inzpro/domain/modules/learning/study-session'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { RichContent } from '@inzpro/rich-content/rich-content'
import { Array as Arr, Effect, Option, Schema } from 'effect'
import { SqlClient, type Statement } from 'effect/sql'
import { makeCursorPaginator, mapCursorPage } from '~api/lib/cursor-pagination.js'
import { StudyReadError } from '~api/modules/written-study/application/errors.js'
import {
  type SessionQuestion,
  type SessionQuestionResult,
  StudySession,
  StudySessionResultCounts,
} from '~api/modules/written-study/domain/study-session.model.js'

const SessionQuestionRow = Schema.Struct({
  sessionId: StudySessionId,
  position: SessionQuestionPosition,
  questionId: WrittenQuestionId,
  questionRevisionId: QuestionRevisionId,
  body: Schema.NonEmptyString,
  explanation: RichContent,
  answerId: QuestionAnswerId,
  answerText: Schema.NonEmptyString,
  answerIsCorrect: Schema.Boolean,
  isWithdrawn: Schema.Boolean,
  explanationOpenedAt: Schema.OptionFromNullOr(DateTimeUtc),
  noteOpenedAt: Schema.OptionFromNullOr(DateTimeUtc),
  noteText: Schema.NullOr(QuestionNoteText),
  noteUpdatedAt: Schema.NullOr(DateTimeUtc),
  noteRefersToEarlierWording: Schema.NullOr(Schema.Boolean),
  submittedAnswerId: Schema.NullOr(QuestionAnswerId),
  submittedIsCorrect: Schema.NullOr(Schema.Boolean),
  submittedIsAssisted: Schema.NullOr(Schema.Boolean),
  submittedAt: Schema.NullOr(DateTimeUtc),
  isFavorite: Schema.Boolean,
})

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
    isFavorite: first.isFavorite,
    note:
      first.noteText === null ||
      first.noteUpdatedAt === null ||
      first.noteRefersToEarlierWording === null
        ? Option.none()
        : Option.some({
            text: first.noteText,
            updatedAt: first.noteUpdatedAt,
            refersToEarlierWording: first.noteRefersToEarlierWording,
          }),
    explanationOpenedAt: first.explanationOpenedAt,
    noteOpenedAt: first.noteOpenedAt,
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

export const writtenSessionReader = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  const findLatestSession = (
    userId: UserId,
    pathId: QualificationPathId,
    conditions: ReadonlyArray<Statement.Fragment>,
  ) =>
    sql`SELECT s.id,s.kind,s.document_id,d.title AS document_title,s.user_exam_goal_version AS goal_version,s.question_count,s.current_position,(SELECT count(*)::integer FROM written_study_answers a WHERE a.study_session_id=s.id) AS answered_count,
 (SELECT count(*)::integer FROM written_study_session_questions sq JOIN question_revisions r ON r.id=sq.question_revision_id WHERE sq.study_session_id=s.id AND r.withdrawn_at<coalesce(s.ended_at,'infinity') AND NOT EXISTS (SELECT 1 FROM written_study_answers a WHERE a.study_session_id=sq.study_session_id AND a.position=sq.position)) AS skipped_count,s.created_at,s.ended_at
 FROM written_study_sessions s LEFT JOIN reference_documents d ON d.id=s.document_id
 WHERE ${sql.and([sql`s.user_id=${userId}`, sql`s.qualification_path_id=${pathId}`, ...conditions])}
 ORDER BY s.last_activity_at DESC,s.id DESC LIMIT 1`.pipe(
      Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(StudySession))),
      Effect.map(Arr.head),
      Effect.mapError(cause => new StudyReadError({ cause })),
    )

  const resultsPage = makeCursorPaginator(
    sql,
    Schema.Struct({ position: SessionQuestionPosition }),
    [['position', sql`sq.position`, 'asc']],
  )

  return {
    unfinishedSession: Effect.fn('StudyReader.unfinishedSession')(
      (userId, pathId, kind, documentId) =>
        findLatestSession(userId, pathId, [
          sql`s.kind=${kind}`,
          Option.match(documentId, {
            onNone: () => sql`s.document_id IS NULL`,
            onSome: id => sql`s.document_id=${id}`,
          }),
          sql`s.ended_at IS NULL`,
        ]),
    ),
    latestSession: Effect.fn('StudyReader.latestSession')((userId, pathId, documentId) =>
      findLatestSession(userId, pathId, [
        sql`s.kind=${regularStudySession}`,
        ...Option.match(documentId, {
          onNone: () => [],
          onSome: id => [sql`s.document_id=${id}`],
        }),
      ]),
    ),
    latestUnfinishedSession: Effect.fn('StudyReader.latestUnfinishedSession')((userId, pathId) =>
      findLatestSession(userId, pathId, [
        sql`s.kind=${regularStudySession}`,
        sql`s.ended_at IS NULL`,
      ]),
    ),
    session: Effect.fn('StudyReader.session')((userId, pathId, sessionId) =>
      findLatestSession(userId, pathId, [sql`s.id=${sessionId}`]),
    ),
    sessionQuestion: Effect.fn('StudyReader.sessionQuestion')(
      function* (userId, pathId, sessionId, position) {
        const rows =
          yield* sql`SELECT s.id AS session_id,sq.position,sq.question_id,sq.question_revision_id,r.body,r.explanation,a.id AS answer_id,a.text AS answer_text,a.is_correct AS answer_is_correct,
 r.withdrawn_at IS NOT NULL AS is_withdrawn,sq.explanation_opened_at,sq.note_opened_at,
 sa.question_answer_id AS submitted_answer_id,sa.is_correct AS submitted_is_correct,sa.is_assisted AS submitted_is_assisted,sa.created_at AS submitted_at,
 EXISTS (SELECT 1 FROM written_favorite_questions f WHERE f.user_id=${userId} AND f.question_id=sq.question_id) AS is_favorite,
 n.body AS note_text,n.updated_at AS note_updated_at,
 CASE WHEN n.user_id IS NOT NULL THEN COALESCE(nr.substantive_revision_id<>cr.substantive_revision_id,false) END AS note_refers_to_earlier_wording
 FROM written_study_sessions s JOIN written_study_session_questions sq ON sq.study_session_id=s.id
 JOIN question_revisions r ON r.id=sq.question_revision_id
 JOIN written_questions q ON q.id=sq.question_id
 LEFT JOIN question_revisions cr ON cr.id=q.current_revision_id
 LEFT JOIN written_question_notes n ON n.user_id=${userId} AND n.question_id=sq.question_id
 LEFT JOIN question_revisions nr ON nr.id=n.question_revision_id
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
  }
})
