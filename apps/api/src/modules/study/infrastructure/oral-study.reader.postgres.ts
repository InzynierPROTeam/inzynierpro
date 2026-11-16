import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { Uuid } from '@inzpro/domain/common/id'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import {
  OralQuestionId,
  OralRevisionId,
} from '@inzpro/domain/modules/learning-content/oral-question'
import {
  OralQuestionCategoryId,
  OralQuestionCategorySortOrder,
} from '@inzpro/domain/modules/learning-content/oral-question-category'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import {
  OralSelfAssessment,
  OralStudySessionId,
} from '@inzpro/domain/modules/study/oral-study-session'
import { SessionQuestionPosition } from '@inzpro/domain/modules/study/study-session'
import { RichContent } from '@inzpro/rich-content/rich-content'
import { Array as Arr, DateTime, Effect, Layer, Option, Schema } from 'effect'
import { SqlClient, type Statement } from 'effect/sql'
import { makeCursorPaginator, mapCursorPage } from '~api/lib/cursor-pagination.js'
import { StudyReadError } from '~api/modules/study/application/errors.js'
import { OralStudyReader } from '~api/modules/study/application/oral-study.reader.js'
import {
  type LearningRoundNumber,
  LearningRoundProgress,
} from '~api/modules/study/domain/learning-round.model.js'
import type { OralCategoryQuestionPool } from '~api/modules/study/domain/oral-category.model.js'
import {
  type OralSessionQuestion,
  OralSessionResultCounts,
  OralStudySession,
} from '~api/modules/study/domain/oral-study-session.model.js'
import { ReviewCard } from '~api/modules/study/domain/review-state.model.js'

const OralCategoryRow = Schema.Struct({
  id: OralQuestionCategoryId,
  name: Schema.NonEmptyString,
  sortOrder: OralQuestionCategorySortOrder,
  availableQuestionCount: QuestionCount,
  completedQuestionCount: QuestionCount,
})

const toCategoryPool = ({
  sortOrder: _sortOrder,
  ...pool
}: typeof OralCategoryRow.Type): OralCategoryQuestionPool => pool

const CandidateRow = Schema.Struct({ questionId: OralQuestionId, oralRevisionId: OralRevisionId })

const SessionQuestionRow = Schema.Struct({
  sessionId: OralStudySessionId,
  position: SessionQuestionPosition,
  questionId: OralQuestionId,
  oralRevisionId: OralRevisionId,
  body: RichContent,
  answer: RichContent,
  isWithdrawn: Schema.Boolean,
  selfAssessment: Schema.NullOr(OralSelfAssessment),
  assessedAt: Schema.NullOr(DateTimeUtc),
})

const toSessionQuestion = ({
  selfAssessment,
  assessedAt,
  ...question
}: typeof SessionQuestionRow.Type): OralSessionQuestion => ({
  ...question,
  selfAssessment:
    selfAssessment === null || assessedAt === null
      ? Option.none()
      : Option.some({ value: selfAssessment, assessedAt }),
})

const SessionQuestionResultRow = Schema.Struct({
  position: SessionQuestionPosition,
  selfAssessment: Schema.OptionFromNullOr(OralSelfAssessment),
  isWithdrawn: Schema.Boolean,
})

export const OralStudyReaderLive = Layer.effect(
  OralStudyReader,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const roundCoverage = (userId: UserId, round: LearningRoundNumber | Statement.Fragment) =>
      sql`LEFT JOIN oral_question_coverage cv ON cv.user_id=${userId} AND cv.qualification_path_id=pq.qualification_path_id AND cv.question_id=q.id AND cv.round_number=${round}
 LEFT JOIN oral_revisions cr ON cr.id=cv.oral_revision_id AND cr.substantive_revision_id=r.substantive_revision_id`

    const pathQuestions = (
      userId: UserId,
      pathId: QualificationPathId,
      round: LearningRoundNumber,
    ) =>
      sql`FROM path_oral_questions pq
 JOIN oral_questions q ON q.id=pq.question_id
 JOIN oral_question_categories c ON c.id=q.category_id
 JOIN oral_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL
 ${roundCoverage(userId, round)}
 WHERE pq.qualification_path_id=${pathId}`

    const categoryColumns = sql`c.id,c.name,c.sort_order,count(r.id)::integer AS available_question_count,count(cr.id)::integer AS completed_question_count`

    const findSession = (
      userId: UserId,
      pathId: QualificationPathId,
      conditions: ReadonlyArray<Statement.Fragment>,
    ) =>
      sql`SELECT s.id,s.category_id,c.name AS category_name,s.user_exam_goal_version AS goal_version,s.question_count,s.current_position,
 (SELECT count(*)::integer FROM oral_study_self_assessments a WHERE a.study_session_id=s.id) AS answered_count,
 (SELECT count(*)::integer FROM oral_study_session_questions sq JOIN oral_revisions r ON r.id=sq.oral_revision_id WHERE sq.study_session_id=s.id AND r.withdrawn_at<coalesce(s.ended_at,'infinity') AND NOT EXISTS (SELECT 1 FROM oral_study_self_assessments a WHERE a.study_session_id=sq.study_session_id AND a.position=sq.position)) AS skipped_count,
 s.created_at,s.ended_at
 FROM oral_study_sessions s JOIN oral_question_categories c ON c.id=s.category_id
 WHERE ${sql.and([sql`s.user_id=${userId}`, sql`s.qualification_path_id=${pathId}`, ...conditions])}
 ORDER BY s.last_activity_at DESC,s.id DESC LIMIT 1`.pipe(
        Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(OralStudySession))),
        Effect.map(Arr.head),
        Effect.mapError(cause => new StudyReadError({ cause })),
      )

    const categoriesPage = makeCursorPaginator(
      sql,
      Schema.Struct({ sortOrder: OralQuestionCategorySortOrder, id: Uuid }),
      [
        ['sortOrder', sql`c.sort_order`, 'asc'],
        ['id', sql`c.id`, 'asc'],
      ],
    )

    const resultsPage = makeCursorPaginator(
      sql,
      Schema.Struct({ position: SessionQuestionPosition }),
      [['position', sql`sq.position`, 'asc']],
    )

    return OralStudyReader.of({
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

      learningRound: Effect.fn('OralStudyReader.learningRound')(
        function* (userId, pathId) {
          const rows =
            yield* sql`WITH lr AS (SELECT coalesce((SELECT round_number FROM oral_learning_rounds WHERE user_id=${userId} AND qualification_path_id=${pathId} LIMIT 1),1) AS round)
 SELECT lr.round,count(r.id)::integer AS question_count,count(cr.id)::integer AS covered_question_count
 FROM lr LEFT JOIN path_oral_questions pq ON pq.qualification_path_id=${pathId}
 LEFT JOIN oral_questions q ON q.id=pq.question_id
 LEFT JOIN oral_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL
 ${roundCoverage(userId, sql`lr.round`)}
 GROUP BY lr.round`

          const [progress] = yield* Schema.decodeUnknownEffect(
            Schema.Tuple([LearningRoundProgress]),
          )(rows)

          return progress
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
      categories: Effect.fn('OralStudyReader.categories')(
        function* (userId, pathId, round, req) {
          const page = yield* categoriesPage(
            req,
            window =>
              sql`SELECT ${categoryColumns} ${pathQuestions(userId, pathId, round)} AND ${window.after}
 GROUP BY c.id ORDER BY ${window.orderBy} LIMIT ${window.limit}`.pipe(
                Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(OralCategoryRow))),
              ),
            row => ({ sortOrder: row.sortOrder, id: row.id }),
          )

          return mapCursorPage(page, toCategoryPool)
        },
        Effect.catchTags({
          SqlError: cause => Effect.fail(new StudyReadError({ cause })),
          SchemaError: cause => Effect.fail(new StudyReadError({ cause })),
        }),
      ),
      category: Effect.fn('OralStudyReader.category')(
        function* (userId, pathId, round, categoryId) {
          const rows =
            yield* sql`SELECT ${categoryColumns} ${pathQuestions(userId, pathId, round)} AND c.id=${categoryId} GROUP BY c.id LIMIT 1`

          const data = yield* Schema.decodeUnknownEffect(Schema.Array(OralCategoryRow))(rows)

          return Option.map(Arr.head(data), toCategoryPool)
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
      nextCategory: Effect.fn('OralStudyReader.nextCategory')(
        function* (userId, pathId, { round, fromCategoryId, skipsStartCategory }) {
          const isCovered = sql`count(r.id)<=count(cr.id)`

          const order = sql.csv([
            isCovered,
            ...Option.match(fromCategoryId, {
              onNone: () => [],
              onSome: id => {
                const start = sql`((SELECT sort_order FROM oral_question_categories WHERE id=${id}),${id}::uuid)`
                const atOrBefore = sql`(c.sort_order,c.id)<=${start}`

                return [
                  skipsStartCategory
                    ? atOrBefore
                    : sql`CASE WHEN ${isCovered} THEN ${atOrBefore} ELSE (c.sort_order,c.id)<${start} END`,
                ]
              },
            }),
            sql`c.sort_order`,
            sql`c.id`,
          ])

          const rows =
            yield* sql`SELECT ${categoryColumns} ${pathQuestions(userId, pathId, round)} GROUP BY c.id ORDER BY ${order} LIMIT 1`

          const data = yield* Schema.decodeUnknownEffect(Schema.Array(OralCategoryRow))(rows)

          return Option.map(Arr.head(data), toCategoryPool)
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
      sessionCandidates: Effect.fn('OralStudyReader.sessionCandidates')(
        function* (userId, pathId, round, categoryId, limit) {
          const rows =
            yield* sql`SELECT q.id AS question_id,r.id AS oral_revision_id ${pathQuestions(userId, pathId, round)} AND q.category_id=${categoryId}
 ORDER BY cr.id IS NOT NULL,q.category_position,q.id LIMIT ${limit}`

          return yield* Schema.decodeUnknownEffect(Schema.Array(CandidateRow))(rows)
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
      unfinishedSession: Effect.fn('OralStudyReader.unfinishedSession')(
        (userId, pathId, categoryId) =>
          findSession(userId, pathId, [sql`s.category_id=${categoryId}`, sql`s.ended_at IS NULL`]),
      ),
      latestSession: Effect.fn('OralStudyReader.latestSession')((userId, pathId, categoryId) =>
        findSession(
          userId,
          pathId,
          Option.match(categoryId, {
            onNone: () => [],
            onSome: id => [sql`s.category_id=${id}`],
          }),
        ),
      ),
      latestUnfinishedSession: Effect.fn('OralStudyReader.latestUnfinishedSession')(
        (userId, pathId) => findSession(userId, pathId, [sql`s.ended_at IS NULL`]),
      ),
      session: Effect.fn('OralStudyReader.session')((userId, pathId, sessionId) =>
        findSession(userId, pathId, [sql`s.id=${sessionId}`]),
      ),
      sessionQuestion: Effect.fn('OralStudyReader.sessionQuestion')(
        function* (userId, pathId, sessionId, position) {
          const rows =
            yield* sql`SELECT s.id AS session_id,sq.position,sq.question_id,sq.oral_revision_id,r.body,r.answer,r.withdrawn_at IS NOT NULL AS is_withdrawn,
 a.self_assessment,a.created_at AS assessed_at
 FROM oral_study_sessions s JOIN oral_study_session_questions sq ON sq.study_session_id=s.id
 JOIN oral_revisions r ON r.id=sq.oral_revision_id
 LEFT JOIN oral_study_self_assessments a ON a.study_session_id=sq.study_session_id AND a.position=sq.position
 WHERE s.id=${sessionId} AND s.user_id=${userId} AND s.qualification_path_id=${pathId} AND sq.position=${position}
 LIMIT 1`

          const data = yield* Schema.decodeUnknownEffect(Schema.Array(SessionQuestionRow))(rows)

          return Option.map(Arr.head(data), toSessionQuestion)
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
      nextOpenPosition: Effect.fn('OralStudyReader.nextOpenPosition')(
        function* (sessionId, position) {
          const rows =
            yield* sql`SELECT sq.position FROM oral_study_session_questions sq JOIN oral_revisions r ON r.id=sq.oral_revision_id
 LEFT JOIN oral_study_self_assessments a ON a.study_session_id=sq.study_session_id AND a.position=sq.position
 WHERE sq.study_session_id=${sessionId} AND a.position IS NULL AND r.withdrawn_at IS NULL
 ORDER BY sq.position<=${position},sq.position LIMIT 1`

          const data = yield* Schema.decodeUnknownEffect(
            Schema.Array(Schema.Struct({ position: SessionQuestionPosition })),
          )(rows)

          return Option.map(Arr.head(data), ({ position: next }) => next)
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
      sessionResultCounts: Effect.fn('OralStudyReader.sessionResultCounts')(
        function* (sessionId) {
          const rows =
            yield* sql`SELECT count(*) FILTER (WHERE self_assessment='hard')::integer AS hard,
 count(*) FILTER (WHERE self_assessment='medium')::integer AS medium,
 count(*) FILTER (WHERE self_assessment='easy')::integer AS easy
 FROM oral_study_self_assessments WHERE study_session_id=${sessionId}`

          const [counts] = yield* Schema.decodeUnknownEffect(
            Schema.Tuple([OralSessionResultCounts]),
          )(rows)

          return counts
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
      sessionResults: Effect.fn('OralStudyReader.sessionResults')(
        function* (userId, pathId, sessionId, req) {
          return yield* resultsPage(
            req,
            window =>
              sql`SELECT sq.position,a.self_assessment,r.withdrawn_at IS NOT NULL AS is_withdrawn
 FROM oral_study_sessions s JOIN oral_study_session_questions sq ON sq.study_session_id=s.id
 JOIN oral_revisions r ON r.id=sq.oral_revision_id
 LEFT JOIN oral_study_self_assessments a ON a.study_session_id=sq.study_session_id AND a.position=sq.position
 WHERE s.id=${sessionId} AND s.user_id=${userId} AND s.qualification_path_id=${pathId} AND ${window.after}
 ORDER BY ${window.orderBy} LIMIT ${window.limit}`.pipe(
                Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(SessionQuestionResultRow))),
              ),
            row => ({ position: row.position }),
          )
        },
        Effect.catchTags({
          SqlError: cause => Effect.fail(new StudyReadError({ cause })),
          SchemaError: cause => Effect.fail(new StudyReadError({ cause })),
        }),
      ),
    })
  }),
)
