import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { Uuid } from '@inzpro/domain/common/id'
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
import { QuestionNoteText } from '@inzpro/domain/modules/study/question-note'
import {
  regularStudySession,
  SessionQuestionPosition,
  StudySessionId,
  uncoveredQuestions,
} from '@inzpro/domain/modules/study/study-session'
import { Array as Arr, DateTime, Effect, Layer, Option, Schema } from 'effect'
import { SqlClient, type Statement } from 'effect/sql'
import { makeCursorPaginator, mapCursorPage } from '~api/lib/cursor-pagination.js'
import { StudyReadError } from '~api/modules/study/application/errors.js'
import { StudyReader } from '~api/modules/study/application/study.reader.js'
import {
  type LearningRoundNumber,
  LearningRoundProgress,
} from '~api/modules/study/domain/learning-round.model.js'
import { ReviewQueue } from '~api/modules/study/domain/review-session.model.js'
import { ReviewCard } from '~api/modules/study/domain/review-state.model.js'
import { studyDayOf } from '~api/modules/study/domain/review-state.rules.js'
import {
  DocumentQuestionPool,
  SessionDocument,
} from '~api/modules/study/domain/study-document.model.js'
import {
  type SessionCandidate,
  type SessionQuestion,
  type SessionQuestionResult,
  StudySession,
  StudySessionResultCounts,
} from '~api/modules/study/domain/study-session.model.js'

const CandidateRow = Schema.Struct({
  questionId: WrittenQuestionId,
  questionRevisionId: QuestionRevisionId,
  answerId: QuestionAnswerId,
})

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
  noteOpenedAt: Schema.OptionFromNullOr(DateTimeUtc),
  // The note's columns are all null without a saved note.
  noteText: Schema.NullOr(QuestionNoteText),
  noteUpdatedAt: Schema.NullOr(DateTimeUtc),
  noteRefersToEarlierWording: Schema.NullOr(Schema.Boolean),
  // The submitted answer's columns are all null until the question is answered.
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
    const columns = sql`d.id,d.title,count(r.id)::integer AS available_question_count,count(cr.id)::integer AS completed_question_count`

    // Joins the user's coverage of the current revision `r` of question `q` on path question `pq`
    // in the round: `cr` is set only when the covered revision carries the current substantive
    // content, so a substantive revision uncovers the question and a cosmetic one does not.
    const roundCoverage = (userId: UserId, round: LearningRoundNumber | Statement.Fragment) =>
      sql`LEFT JOIN written_question_coverage c ON c.user_id=${userId} AND c.qualification_path_id=pq.qualification_path_id AND c.question_id=q.id AND c.round_number=${round}
 LEFT JOIN question_revisions cr ON cr.id=c.question_revision_id AND cr.substantive_revision_id=r.substantive_revision_id`

    const documentPools = (
      userId: UserId,
      pathId: QualificationPathId,
      round: LearningRoundNumber,
    ) =>
      sql`FROM path_documents pd JOIN reference_documents d ON d.id=pd.document_id
 LEFT JOIN path_questions pq ON pq.qualification_path_id=pd.qualification_path_id AND pq.document_id=d.id
 LEFT JOIN written_questions q ON q.id=pq.question_id
 LEFT JOIN question_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL
 ${roundCoverage(userId, round)}
 WHERE pd.qualification_path_id=${pathId}`

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

    // The learner's UserReviewStates on the path that a review may draw: the question is still on
    // the path, optionally in one document, its current revision is published and not withdrawn,
    // and the state belongs to that revision's substantive content. A state built on replaced
    // content reads as a new card, which is never due. `v.available_at` is when a review may
    // draw it: its due time, but not before the next study day once its content was answered on
    // the study day of `now`, because a later answer that day would not rate it (ADR-0005).
    const reviewStates = (
      userId: UserId,
      pathId: QualificationPathId,
      documentId: Option.Option<ReferenceDocumentId>,
      now: DateTimeUtc,
      conditions: ReadonlyArray<Statement.Fragment> = [],
    ) => {
      const today = studyDayOf(now)
      const start = DateTime.formatIso(today.start)
      const end = DateTime.formatIso(today.end)

      return sql`FROM written_review_states s
 JOIN path_questions pq ON pq.qualification_path_id=s.qualification_path_id AND pq.question_id=s.question_id
 JOIN written_questions q ON q.id=s.question_id
 JOIN question_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL AND r.substantive_revision_id=s.substantive_revision_id
 CROSS JOIN LATERAL (SELECT CASE WHEN EXISTS (SELECT 1 FROM written_learning_events e
 JOIN question_revisions er ON er.id=e.question_revision_id AND er.substantive_revision_id=s.substantive_revision_id
 WHERE e.user_id=s.user_id AND e.qualification_path_id=s.qualification_path_id AND e.question_id=s.question_id AND e.answered_at>=${start} AND e.answered_at<${end})
 THEN greatest(s.due_at,${end}::timestamptz) ELSE s.due_at END AS available_at) v
 WHERE ${sql.and([
   sql`s.user_id=${userId}`,
   sql`s.qualification_path_id=${pathId}`,
   ...Option.match(documentId, { onNone: () => [], onSome: id => [sql`pq.document_id=${id}`] }),
   ...conditions,
 ])}`
    }

    const favoriteQuestions = (
      userId: UserId,
      pathId: QualificationPathId,
      documentId: Option.Option<ReferenceDocumentId>,
    ) =>
      sql`FROM written_favorite_questions f
 JOIN path_questions pq ON pq.qualification_path_id=${pathId} AND pq.question_id=f.question_id
 JOIN written_questions q ON q.id=f.question_id
 JOIN question_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL
 WHERE ${sql.and([
   sql`f.user_id=${userId}`,
   ...Option.match(documentId, { onNone: () => [], onSome: id => [sql`pq.document_id=${id}`] }),
 ])}`

    const documentsPage = makeCursorPaginator(sql, Schema.Struct({ id: Uuid }), [
      ['id', sql`d.id`, 'asc'],
    ])

    const resultsPage = makeCursorPaginator(
      sql,
      Schema.Struct({ position: SessionQuestionPosition }),
      [['position', sql`sq.position`, 'asc']],
    )

    return StudyReader.of({
      learningRound: Effect.fn('StudyReader.learningRound')(
        function* (userId, pathId) {
          const rows =
            yield* sql`WITH lr AS (SELECT coalesce((SELECT round_number FROM written_learning_rounds WHERE user_id=${userId} AND qualification_path_id=${pathId} LIMIT 1),1) AS round)
 SELECT lr.round,count(r.id)::integer AS question_count,count(cr.id)::integer AS covered_question_count
 FROM lr LEFT JOIN path_questions pq ON pq.qualification_path_id=${pathId}
 LEFT JOIN written_questions q ON q.id=pq.question_id
 LEFT JOIN question_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL
 ${roundCoverage(userId, sql`lr.round`)}
 GROUP BY lr.round`

          const [progress] = yield* Schema.decodeUnknownEffect(
            Schema.Tuple([LearningRoundProgress]),
          )(rows)

          return progress
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
      documents: Effect.fn('StudyReader.documents')(
        function* (userId, pathId, round, req) {
          return yield* documentsPage(
            req,
            page =>
              sql`SELECT ${columns} ${documentPools(userId, pathId, round)} AND ${page.after} GROUP BY d.id,d.title ORDER BY ${page.orderBy} LIMIT ${page.limit}`.pipe(
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
        function* (userId, pathId, { round, fromDocumentId, skipsStartDocument }) {
          const isCovered = sql`count(r.id)<=count(cr.id)`

          // Documents with uncovered questions come first, from the starting document on, or from
          // the one after it in a new round. Among covered ones the starting document comes last.
          // Both wrap around to the documents before the start.
          const order = sql.csv([
            isCovered,
            ...Option.match(fromDocumentId, {
              onNone: () => [],
              onSome: id => [
                skipsStartDocument
                  ? sql`d.id<=${id}`
                  : sql`CASE WHEN ${isCovered} THEN d.id<=${id} ELSE d.id<${id} END`,
              ],
            }),
            sql`d.id`,
          ])

          const rows =
            yield* sql`SELECT ${columns} ${documentPools(userId, pathId, round)} GROUP BY d.id,d.title HAVING count(r.id)>0 ORDER BY ${order} LIMIT 1`

          const data = yield* Schema.decodeUnknownEffect(Schema.Array(DocumentQuestionPool))(rows)

          return Option.fromNullishOr(data[0])
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
      document: Effect.fn('StudyReader.document')(
        function* (userId, pathId, round, documentId) {
          const rows =
            yield* sql`SELECT ${columns} ${documentPools(userId, pathId, round)} AND d.id=${documentId} GROUP BY d.id,d.title LIMIT 1`

          const data = yield* Schema.decodeUnknownEffect(Schema.Array(DocumentQuestionPool))(rows)

          return Option.fromNullishOr(data[0])
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
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
      pathDocument: Effect.fn('StudyReader.pathDocument')(
        function* (pathId, documentId) {
          const rows =
            yield* sql`SELECT d.id,d.title FROM path_documents pd JOIN reference_documents d ON d.id=pd.document_id
 WHERE pd.qualification_path_id=${pathId} AND pd.document_id=${documentId} LIMIT 1`

          return Arr.head(yield* Schema.decodeUnknownEffect(Schema.Array(SessionDocument))(rows))
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
      reviewQueue: Effect.fn('StudyReader.reviewQueue')(
        function* (userId, pathId, documentId, now) {
          const at = DateTime.formatIso(now)

          const rows =
            yield* sql`SELECT count(*) FILTER (WHERE v.available_at<=${at})::integer AS due_count,min(v.available_at) FILTER (WHERE v.available_at>${at}) AS next_due_at
 ${reviewStates(userId, pathId, documentId, now)}`

          const [queue] = yield* Schema.decodeUnknownEffect(Schema.Tuple([ReviewQueue]))(rows)

          return queue
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
      reviewCandidates: Effect.fn('StudyReader.reviewCandidates')(
        function* (userId, pathId, documentId, now, limit) {
          const at = DateTime.formatIso(now)

          const rows =
            yield* sql`SELECT c.question_id,c.question_revision_id,a.id AS answer_id FROM (
 SELECT q.id AS question_id,r.id AS question_revision_id,s.due_at ${reviewStates(userId, pathId, documentId, now, [sql`v.available_at<=${at}`])}
 ORDER BY s.due_at,q.id LIMIT ${limit}
 ) c JOIN question_answers a ON a.question_revision_id=c.question_revision_id
 ORDER BY c.due_at,c.question_id,a.created_at,a.id`

          return toCandidates(yield* Schema.decodeUnknownEffect(Schema.Array(CandidateRow))(rows))
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
      isPathQuestion: Effect.fn('StudyReader.isPathQuestion')(
        function* (pathId, questionId) {
          const rows =
            yield* sql`SELECT EXISTS (SELECT 1 FROM path_questions WHERE qualification_path_id=${pathId} AND question_id=${questionId}) AS is_on_path`

          const [{ isOnPath }] = yield* Schema.decodeUnknownEffect(
            Schema.Tuple([Schema.Struct({ isOnPath: Schema.Boolean })]),
          )(rows)

          return isOnPath
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
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
          const rows =
            yield* sql`SELECT c.question_id,c.question_revision_id,a.id AS answer_id FROM (
 SELECT q.id AS question_id,r.id AS question_revision_id,pq.document_id,q.created_at ${favoriteQuestions(userId, pathId, documentId)}
 ORDER BY pq.document_id,q.created_at,q.id LIMIT ${limit}
 ) c JOIN question_answers a ON a.question_revision_id=c.question_revision_id
 ORDER BY c.document_id,c.created_at,c.question_id,a.created_at,a.id`

          return toCandidates(yield* Schema.decodeUnknownEffect(Schema.Array(CandidateRow))(rows))
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
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
      sessionCandidates: Effect.fn('StudyReader.sessionCandidates')(
        function* (userId, pathId, round, documentId, selection, limit) {
          // Covered in the round by a revision carrying the current substantive content.
          const uncovered =
            selection === uncoveredQuestions
              ? sql`NOT EXISTS (SELECT 1 FROM written_question_coverage c JOIN question_revisions cr ON cr.id=c.question_revision_id
 WHERE c.user_id=${userId} AND c.qualification_path_id=pq.qualification_path_id AND c.question_id=q.id AND c.round_number=${round} AND cr.substantive_revision_id=r.substantive_revision_id)`
              : sql`true`

          const rows =
            yield* sql`SELECT c.question_id,c.question_revision_id,a.id AS answer_id FROM (
 SELECT q.id AS question_id,r.id AS question_revision_id,q.created_at FROM path_questions pq
 JOIN written_questions q ON q.id=pq.question_id
 JOIN question_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL
 WHERE pq.qualification_path_id=${pathId} AND pq.document_id=${documentId} AND ${uncovered} ORDER BY q.created_at,q.id LIMIT ${limit}
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
      reviewState: Effect.fn('StudyReader.reviewState')(
        function* (userId, pathId, questionId) {
          // A state built on other substantive content than the current revision's is reset.
          const rows =
            yield* sql`SELECT s.due_at,s.last_review_at,s.stability,s.stability_fast,s.difficulty,s.state,s.schedule_status,s.reps,s.lapses,s.scheduled_days,s.learning_step
 FROM written_review_states s JOIN written_questions q ON q.id=s.question_id JOIN question_revisions r ON r.id=q.current_revision_id
 WHERE s.user_id=${userId} AND s.qualification_path_id=${pathId} AND s.question_id=${questionId} AND s.substantive_revision_id=r.substantive_revision_id
 LIMIT 1`

          return Arr.head(yield* Schema.decodeUnknownEffect(Schema.Array(ReviewCard))(rows))
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
      carriesCurrentContent: Effect.fn('StudyReader.carriesCurrentContent')(
        function* (questionRevisionId) {
          const rows =
            yield* sql`SELECT r.substantive_revision_id=cr.substantive_revision_id AS is_current
 FROM question_revisions r JOIN written_questions q ON q.id=r.question_id JOIN question_revisions cr ON cr.id=q.current_revision_id
 WHERE r.id=${questionRevisionId}`

          const [{ isCurrent }] = yield* Schema.decodeUnknownEffect(
            Schema.Tuple([Schema.Struct({ isCurrent: Schema.Boolean })]),
          )(rows)

          return isCurrent
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
      answeredContentOnStudyDay: Effect.fn('StudyReader.answeredContentOnStudyDay')(
        function* (userId, pathId, questionRevisionId, day) {
          const start = DateTime.formatIso(day.start)
          const end = DateTime.formatIso(day.end)

          // Events of the same question whose revision carries the same substantive content.
          const rows = yield* sql`SELECT EXISTS (SELECT 1 FROM question_revisions ar
 JOIN written_learning_events e ON e.user_id=${userId} AND e.qualification_path_id=${pathId} AND e.question_id=ar.question_id AND e.answered_at>=${start} AND e.answered_at<${end}
 JOIN question_revisions er ON er.id=e.question_revision_id AND er.substantive_revision_id=ar.substantive_revision_id
 WHERE ar.id=${questionRevisionId}) AS answered`

          const [{ answered }] = yield* Schema.decodeUnknownEffect(
            Schema.Tuple([Schema.Struct({ answered: Schema.Boolean })]),
          )(rows)

          return answered
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
