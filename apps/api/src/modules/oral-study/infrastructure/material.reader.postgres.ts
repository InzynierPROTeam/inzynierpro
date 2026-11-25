import type { DistrictChamberId } from '@inzpro/domain/modules/exam-calendar/district-chamber'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import {
  OralQuestionId,
  OralRevisionId,
} from '@inzpro/domain/modules/learning-content/oral-question'
import {
  OralQuestionCategoryId,
  PathOralCategoryPosition,
} from '@inzpro/domain/modules/learning-content/oral-question-category'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Array as Arr, Effect, Option, Schema } from 'effect'
import { SqlClient, type Statement } from 'effect/sql'
import { makeCursorPaginator, mapCursorPage } from '~api/lib/cursor-pagination.js'
import {
  type LearningRoundNumber,
  LearningRoundProgress,
} from '~api/modules/learning/domain/learning-round.model.js'
import { StudyReadError } from '~api/modules/oral-study/application/errors.js'
import type { OralCategoryQuestionPool } from '~api/modules/oral-study/domain/oral-category.model.js'

const OralCategoryRow = Schema.Struct({
  id: OralQuestionCategoryId,
  name: Schema.NonEmptyString,
  position: PathOralCategoryPosition,
  availableQuestionCount: QuestionCount,
  completedQuestionCount: QuestionCount,
})

const toCategoryPool = ({
  position: _position,
  ...pool
}: typeof OralCategoryRow.Type): OralCategoryQuestionPool => pool

const CandidateRow = Schema.Struct({ questionId: OralQuestionId, oralRevisionId: OralRevisionId })

export const oralMaterialReader = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  const roundCoverage = (userId: UserId, round: LearningRoundNumber | Statement.Fragment) =>
    sql`LEFT JOIN oral_question_coverage cv ON cv.user_id=${userId} AND cv.qualification_path_id=pq.qualification_path_id AND cv.question_id=q.id AND cv.round_number=${round}
 LEFT JOIN oral_revisions cr ON cr.id=cv.oral_revision_id AND cr.substantive_revision_id=r.substantive_revision_id`

  const reportedInChamber = (reportedIn: Option.Option<DistrictChamberId>) =>
    Option.match(reportedIn, {
      onNone: () => sql`TRUE`,
      onSome: id =>
        sql`EXISTS (SELECT 1 FROM oral_question_regional_links l WHERE l.question_id=q.id AND l.district_chamber_id=${id})`,
    })

  const pathQuestions = (
    userId: UserId,
    pathId: QualificationPathId,
    round: LearningRoundNumber,
    reportedIn: Option.Option<DistrictChamberId>,
  ) =>
    sql`FROM path_oral_questions pq
 JOIN path_oral_categories pc ON pc.qualification_path_id=pq.qualification_path_id AND pc.category_id=pq.category_id
 JOIN oral_questions q ON q.id=pq.question_id
 JOIN oral_question_categories c ON c.id=pq.category_id
 JOIN oral_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL
 ${roundCoverage(userId, round)}
 WHERE pq.qualification_path_id=${pathId} AND ${reportedInChamber(reportedIn)}`

  const categoryColumns = sql`c.id,c.name,pc.position,count(r.id)::integer AS available_question_count,count(cr.id)::integer AS completed_question_count`

  const categoriesPage = makeCursorPaginator(
    sql,
    Schema.Struct({ position: PathOralCategoryPosition }),
    [['position', sql`pc.position`, 'asc']],
  )

  return {
    isPathQuestion: Effect.fn('OralStudyReader.isPathQuestion')(
      function* (pathId, questionId) {
        const rows =
          yield* sql`SELECT EXISTS (SELECT 1 FROM path_oral_questions WHERE qualification_path_id=${pathId} AND question_id=${questionId}) AS present`

        const [row] = yield* Schema.decodeUnknownEffect(
          Schema.Tuple([Schema.Struct({ present: Schema.Boolean })]),
        )(rows)

        return row.present
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

        const [progress] = yield* Schema.decodeUnknownEffect(Schema.Tuple([LearningRoundProgress]))(
          rows,
        )

        return progress
      },
      Effect.mapError(cause => new StudyReadError({ cause })),
    ),
    categories: Effect.fn('OralStudyReader.categories')(
      function* (userId, pathId, round, req) {
        const page = yield* categoriesPage(
          req,
          window =>
            sql`SELECT ${categoryColumns} ${pathQuestions(userId, pathId, round, Option.none())} AND ${window.after}
 GROUP BY c.id,pc.position ORDER BY ${window.orderBy} LIMIT ${window.limit}`.pipe(
              Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(OralCategoryRow))),
            ),
          row => ({ position: row.position }),
        )

        return mapCursorPage(page, toCategoryPool)
      },
      Effect.catchTags({
        SqlError: cause => Effect.fail(new StudyReadError({ cause })),
        SchemaError: cause => Effect.fail(new StudyReadError({ cause })),
      }),
    ),
    category: Effect.fn('OralStudyReader.category')(
      function* (userId, pathId, round, categoryId, reportedIn) {
        const rows =
          yield* sql`SELECT ${categoryColumns} ${pathQuestions(userId, pathId, round, reportedIn)} AND c.id=${categoryId} GROUP BY c.id,pc.position LIMIT 1`

        const data = yield* Schema.decodeUnknownEffect(Schema.Array(OralCategoryRow))(rows)

        return Option.map(Arr.head(data), toCategoryPool)
      },
      Effect.mapError(cause => new StudyReadError({ cause })),
    ),
    nextCategory: Effect.fn('OralStudyReader.nextCategory')(
      function* (userId, pathId, { round, fromCategoryId, skipsStartCategory }, reportedIn) {
        const isCovered = sql`count(r.id)<=count(cr.id)`

        const order = sql.csv([
          isCovered,
          ...Option.match(fromCategoryId, {
            onNone: () => [],
            onSome: id => {
              const start = sql`(SELECT position FROM path_oral_categories WHERE qualification_path_id=${pathId} AND category_id=${id})`
              const atOrBefore = sql`pc.position<=${start}`

              return [
                skipsStartCategory
                  ? atOrBefore
                  : sql`CASE WHEN ${isCovered} THEN ${atOrBefore} ELSE pc.position<${start} END`,
              ]
            },
          }),
          sql`pc.position`,
        ])

        const rows =
          yield* sql`SELECT ${categoryColumns} ${pathQuestions(userId, pathId, round, reportedIn)} GROUP BY c.id,pc.position ORDER BY ${order} LIMIT 1`

        const data = yield* Schema.decodeUnknownEffect(Schema.Array(OralCategoryRow))(rows)

        return Option.map(Arr.head(data), toCategoryPool)
      },
      Effect.mapError(cause => new StudyReadError({ cause })),
    ),
    sessionCandidates: Effect.fn('OralStudyReader.sessionCandidates')(
      function* (userId, pathId, round, categoryId, limit, reportedIn) {
        const rows =
          yield* sql`SELECT q.id AS question_id,r.id AS oral_revision_id ${pathQuestions(userId, pathId, round, reportedIn)} AND q.category_id=${categoryId}
 ORDER BY cr.id IS NOT NULL,q.category_position,q.id LIMIT ${limit}`

        return yield* Schema.decodeUnknownEffect(Schema.Array(CandidateRow))(rows)
      },
      Effect.mapError(cause => new StudyReadError({ cause })),
    ),
  }
})
