import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import { type ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import {
  QuestionRevisionId,
  WrittenQuestionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Array as Arr, DateTime, Effect, Option, Schema } from 'effect'
import { SqlClient, type Statement } from 'effect/sql'
import { ReviewQueue } from '~api/modules/learning/domain/review-queue.model.js'
import { ReviewCard } from '~api/modules/learning/domain/review-state.model.js'
import { studyDayOf } from '~api/modules/learning/domain/study-day.rules.js'
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

export const writtenReviewReader = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

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

  return {
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

        const rows = yield* sql`SELECT c.question_id,c.question_revision_id,a.id AS answer_id FROM (
 SELECT q.id AS question_id,r.id AS question_revision_id,s.due_at ${reviewStates(userId, pathId, documentId, now, [sql`v.available_at<=${at}`])}
 ORDER BY s.due_at,q.id LIMIT ${limit}
 ) c JOIN question_answers a ON a.question_revision_id=c.question_revision_id
 ORDER BY c.due_at,c.question_id,a.created_at,a.id`

        return toCandidates(yield* Schema.decodeUnknownEffect(Schema.Array(CandidateRow))(rows))
      },
      Effect.mapError(cause => new StudyReadError({ cause })),
    ),
    reviewState: Effect.fn('StudyReader.reviewState')(
      function* (userId, pathId, questionId) {
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
  }
})
