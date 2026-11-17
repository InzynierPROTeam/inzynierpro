import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import type { DistrictChamberId } from '@inzpro/domain/modules/exam-calendar/district-chamber'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import {
  OralQuestionId,
  OralRevisionId,
} from '@inzpro/domain/modules/learning-content/oral-question'
import { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Array as Arr, DateTime, Effect, Option, Schema } from 'effect'
import { SqlClient, type Statement } from 'effect/sql'
import { ReviewQueue } from '~api/modules/learning/domain/review-queue.model.js'
import { ReviewCard } from '~api/modules/learning/domain/review-state.model.js'
import { studyDayOf } from '~api/modules/learning/domain/study-day.rules.js'
import { StudyReadError } from '~api/modules/oral-study/application/errors.js'
import { OralStudySession } from '~api/modules/oral-study/domain/oral-study-session.model.js'

const CandidateRow = Schema.Struct({ questionId: OralQuestionId, oralRevisionId: OralRevisionId })

export const oralReviewReader = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  const reportedInChamber = (reportedIn: Option.Option<DistrictChamberId>) =>
    Option.match(reportedIn, {
      onNone: () => sql`TRUE`,
      onSome: id =>
        sql`EXISTS (SELECT 1 FROM oral_question_regional_links l WHERE l.question_id=q.id AND l.district_chamber_id=${id})`,
    })

  const findSession = (
    userId: UserId,
    pathId: QualificationPathId,
    conditions: ReadonlyArray<Statement.Fragment>,
  ) =>
    sql`SELECT s.id,s.kind,s.category_id,c.name AS category_name,s.user_exam_goal_version AS goal_version,s.question_count,s.current_position,
 (SELECT count(*)::integer FROM oral_study_self_assessments a WHERE a.study_session_id=s.id) AS answered_count,
 (SELECT count(*)::integer FROM oral_study_session_questions sq JOIN oral_revisions r ON r.id=sq.oral_revision_id WHERE sq.study_session_id=s.id AND r.withdrawn_at<coalesce(s.ended_at,'infinity') AND NOT EXISTS (SELECT 1 FROM oral_study_self_assessments a WHERE a.study_session_id=sq.study_session_id AND a.position=sq.position)) AS skipped_count,
 s.created_at,s.ended_at
 FROM oral_study_sessions s LEFT JOIN oral_question_categories c ON c.id=s.category_id
 WHERE ${sql.and([sql`s.user_id=${userId}`, sql`s.qualification_path_id=${pathId}`, ...conditions])}
 ORDER BY s.last_activity_at DESC,s.id DESC LIMIT 1`.pipe(
      Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(OralStudySession))),
      Effect.map(Arr.head),
      Effect.mapError(cause => new StudyReadError({ cause })),
    )

  const reviewStates = (
    userId: UserId,
    pathId: QualificationPathId,
    categoryId: Option.Option<OralQuestionCategoryId>,
    now: DateTimeUtc,
    reportedIn: Option.Option<DistrictChamberId>,
  ) => {
    const today = studyDayOf(now)
    const start = DateTime.formatIso(today.start)
    const end = DateTime.formatIso(today.end)

    return sql`FROM oral_review_states s
 JOIN path_oral_questions pq ON pq.question_id=s.question_id AND pq.qualification_path_id=s.qualification_path_id
 JOIN oral_questions q ON q.id=s.question_id
 JOIN oral_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL AND r.substantive_revision_id=s.substantive_revision_id
 CROSS JOIN LATERAL (SELECT CASE WHEN EXISTS (SELECT 1 FROM oral_learning_events e
 JOIN oral_revisions er ON er.id=e.oral_revision_id AND er.substantive_revision_id=s.substantive_revision_id
 WHERE e.user_id=s.user_id AND e.qualification_path_id=s.qualification_path_id AND e.question_id=s.question_id AND e.answered_at>=${start} AND e.answered_at<${end})
 THEN greatest(s.due_at,${end}::timestamptz) ELSE s.due_at END AS available_at) v
 WHERE s.user_id=${userId} AND s.qualification_path_id=${pathId}
 AND ${Option.match(categoryId, { onNone: () => sql`TRUE`, onSome: id => sql`q.category_id=${id}` })}
 AND ${reportedInChamber(reportedIn)}`
  }

  return {
    reviewQueue: Effect.fn('OralStudyReader.reviewQueue')(
      function* (userId, pathId, categoryId, now, reportedIn) {
        const at = DateTime.formatIso(now)

        const rows =
          yield* sql`SELECT count(*) FILTER (WHERE v.available_at<=${at})::integer AS due_count,min(v.available_at) FILTER (WHERE v.available_at>${at}) AS next_due_at ${reviewStates(userId, pathId, categoryId, now, reportedIn)}`

        const [queue] = yield* Schema.decodeUnknownEffect(Schema.Tuple([ReviewQueue]))(rows)

        return queue
      },
      Effect.mapError(cause => new StudyReadError({ cause })),
    ),
    reviewCandidates: Effect.fn('OralStudyReader.reviewCandidates')(
      function* (userId, pathId, categoryId, now, limit, reportedIn) {
        const at = DateTime.formatIso(now)

        const rows =
          yield* sql`SELECT q.id AS question_id,r.id AS oral_revision_id ${reviewStates(userId, pathId, categoryId, now, reportedIn)} AND v.available_at<=${at} ORDER BY s.due_at,q.id LIMIT ${limit}`

        return yield* Schema.decodeUnknownEffect(Schema.Array(CandidateRow))(rows)
      },
      Effect.mapError(cause => new StudyReadError({ cause })),
    ),
    unfinishedReviewSession: Effect.fn('OralStudyReader.unfinishedReviewSession')(
      (userId, pathId, categoryId) =>
        findSession(userId, pathId, [
          sql`s.kind='review'`,
          sql`s.ended_at IS NULL`,
          Option.match(categoryId, {
            onNone: () => sql`s.category_id IS NULL`,
            onSome: id => sql`s.category_id=${id}`,
          }),
        ]),
    ),
    reviewState: Effect.fn('OralStudyReader.reviewState')(
      function* (userId, pathId, questionId) {
        const rows =
          yield* sql`SELECT s.due_at,s.last_review_at,s.stability,s.stability_fast,s.difficulty,s.state,s.schedule_status,s.reps,s.lapses,s.scheduled_days,s.learning_step
 FROM oral_review_states s JOIN oral_questions q ON q.id=s.question_id JOIN oral_revisions r ON r.id=q.current_revision_id
 WHERE s.user_id=${userId} AND s.qualification_path_id=${pathId} AND s.question_id=${questionId} AND s.substantive_revision_id=r.substantive_revision_id
 LIMIT 1`

        return Arr.head(yield* Schema.decodeUnknownEffect(Schema.Array(ReviewCard))(rows))
      },
      Effect.mapError(cause => new StudyReadError({ cause })),
    ),
    carriesCurrentContent: Effect.fn('OralStudyReader.carriesCurrentContent')(
      function* (oralRevisionId) {
        const rows =
          yield* sql`SELECT r.substantive_revision_id=cr.substantive_revision_id AS is_current
 FROM oral_revisions r JOIN oral_questions q ON q.id=r.question_id JOIN oral_revisions cr ON cr.id=q.current_revision_id
 WHERE r.id=${oralRevisionId} LIMIT 1`

        const [{ isCurrent }] = yield* Schema.decodeUnknownEffect(
          Schema.Tuple([Schema.Struct({ isCurrent: Schema.Boolean })]),
        )(rows)

        return isCurrent
      },
      Effect.mapError(cause => new StudyReadError({ cause })),
    ),
    answeredContentOnStudyDay: Effect.fn('OralStudyReader.answeredContentOnStudyDay')(
      function* (userId, pathId, oralRevisionId, day) {
        const start = DateTime.formatIso(day.start)
        const end = DateTime.formatIso(day.end)

        const rows = yield* sql`SELECT EXISTS (SELECT 1 FROM oral_revisions ar
 JOIN oral_learning_events e ON e.user_id=${userId} AND e.qualification_path_id=${pathId} AND e.question_id=ar.question_id AND e.answered_at>=${start} AND e.answered_at<${end}
 JOIN oral_revisions er ON er.id=e.oral_revision_id AND er.substantive_revision_id=ar.substantive_revision_id
 WHERE ar.id=${oralRevisionId}) AS answered`

        const [{ answered }] = yield* Schema.decodeUnknownEffect(
          Schema.Tuple([Schema.Struct({ answered: Schema.Boolean })]),
        )(rows)

        return answered
      },
      Effect.mapError(cause => new StudyReadError({ cause })),
    ),
  }
})
