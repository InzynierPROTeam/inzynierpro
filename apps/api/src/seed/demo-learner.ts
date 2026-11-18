import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { Uuid } from '@inzpro/domain/common/id'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { DateTime, Effect, Option, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import { defaultDailyPlanSettings } from '~api/modules/daily-plan/domain/daily-plan.model.js'
import { draftDailyPlan } from '~api/modules/daily-plan/domain/daily-plan.rules.js'
import { LearningRoundNumber } from '~api/modules/learning/domain/learning-round.model.js'

import { catalogueId } from './catalogue-id.js'

const demoLearner = {
  id: catalogueId('a0', 1),
  name: 'Anna Nowak',
  email: 'demo@example.com',
}

const writtenPath = catalogueId('10', 1)

const oralPath = catalogueId('10', 2)

const demoExamSession = catalogueId('90', 1)

const writtenAnswersOnEarlierDays = [3, 0, 2, 5, 1]

const oralAnswersOnEarlierDays = [2, 0, 1, 3, 1]

const PoolQuestion = Schema.Struct({ questionId: Uuid, revisionId: Uuid })

const ExamDates = Schema.Struct({ writtenAt: DateTimeUtc, oralPlanningAt: DateTimeUtc })

const Presence = Schema.Tuple([Schema.Struct({ present: Schema.Boolean })])

const earlierDay = (
  now: DateTime.Utc,
  answersOnEarlierDays: ReadonlyArray<number>,
  index: number,
) => DateTime.subtract(now, { days: answersOnEarlierDays.length - index })

const progressBefore = (
  pool: ReadonlyArray<unknown>,
  answersOnEarlierDays: ReadonlyArray<number>,
  index: number,
) => ({
  round: LearningRoundNumber.make(1),
  questionCount: QuestionCount.make(pool.length),
  coveredQuestionCount: QuestionCount.make(
    answersOnEarlierDays.slice(0, index).reduce((sum, answers) => sum + answers, 0),
  ),
})

const seedWrittenHistory = (now: DateTime.Utc, writtenAt: DateTime.Utc) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const [history] =
      yield* sql`SELECT EXISTS (SELECT 1 FROM written_daily_plans WHERE user_id=${demoLearner.id}) AS present`.pipe(
        Effect.flatMap(Schema.decodeUnknownEffect(Presence)),
      )

    if (history.present) {
      return
    }

    const pool =
      yield* sql`SELECT q.id AS question_id,r.id AS revision_id FROM path_questions pq JOIN written_questions q ON q.id=pq.question_id
 JOIN question_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL
 WHERE pq.qualification_path_id=${writtenPath} ORDER BY q.id`.pipe(
        Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(PoolQuestion))),
      )

    for (const [index, answers] of writtenAnswersOnEarlierDays.entries()) {
      const day = earlierDay(now, writtenAnswersOnEarlierDays, index)
      const progress = progressBefore(pool, writtenAnswersOnEarlierDays, index)

      const plan = draftDailyPlan({
        now: day,
        examAt: writtenAt,
        progress,
        settings: defaultDailyPlanSettings,
      })

      if (Option.isSome(plan)) {
        const { studyDay, round, targetDate, remainingQuestionCount, targetQuestionCount } =
          plan.value

        yield* sql`INSERT INTO written_daily_plans (user_id,qualification_path_id,study_day,round_number,target_date,remaining_question_count,target_question_count,completed_question_count,plan_settings_version)
 VALUES (${demoLearner.id},${writtenPath},${DateTime.formatIso(studyDay)},${round},${DateTime.formatIso(targetDate)},${remainingQuestionCount},${targetQuestionCount},${answers},${plan.value.settingsVersion})`
      }

      for (const question of pool.slice(
        progress.coveredQuestionCount,
        progress.coveredQuestionCount + answers,
      )) {
        yield* sql`INSERT INTO written_question_coverage (user_id,qualification_path_id,question_id,question_revision_id,round_number,covered_at)
 VALUES (${demoLearner.id},${writtenPath},${question.questionId},${question.revisionId},1,${DateTime.formatIso(day)})`
      }
    }
  })

const seedOralHistory = (now: DateTime.Utc, oralPlanningAt: DateTime.Utc) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const [history] =
      yield* sql`SELECT EXISTS (SELECT 1 FROM oral_daily_plans WHERE user_id=${demoLearner.id}) AS present`.pipe(
        Effect.flatMap(Schema.decodeUnknownEffect(Presence)),
      )

    if (history.present) {
      return
    }

    const pool =
      yield* sql`SELECT q.id AS question_id,r.id AS revision_id FROM path_oral_questions pq JOIN oral_questions q ON q.id=pq.question_id
 JOIN oral_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL
 WHERE pq.qualification_path_id=${oralPath} ORDER BY q.id`.pipe(
        Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(PoolQuestion))),
      )

    for (const [index, answers] of oralAnswersOnEarlierDays.entries()) {
      const day = earlierDay(now, oralAnswersOnEarlierDays, index)
      const progress = progressBefore(pool, oralAnswersOnEarlierDays, index)

      const plan = draftDailyPlan({
        now: day,
        examAt: oralPlanningAt,
        progress,
        settings: defaultDailyPlanSettings,
      })

      if (Option.isSome(plan)) {
        const { studyDay, round, targetDate, remainingQuestionCount, targetQuestionCount } =
          plan.value

        yield* sql`INSERT INTO oral_daily_plans (user_id,qualification_path_id,study_day,round_number,target_date,remaining_question_count,target_question_count,completed_question_count,plan_settings_version)
 VALUES (${demoLearner.id},${oralPath},${DateTime.formatIso(studyDay)},${round},${DateTime.formatIso(targetDate)},${remainingQuestionCount},${targetQuestionCount},${answers},${plan.value.settingsVersion})`
      }

      for (const question of pool.slice(
        progress.coveredQuestionCount,
        progress.coveredQuestionCount + answers,
      )) {
        yield* sql`INSERT INTO oral_question_coverage (user_id,qualification_path_id,question_id,oral_revision_id,round_number,covered_at)
 VALUES (${demoLearner.id},${oralPath},${question.questionId},${question.revisionId},1,${DateTime.formatIso(day)})`
      }
    }
  })

export const seedDemoLearner = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  const now = yield* DateTime.now

  yield* sql`INSERT INTO users (id,name,email,email_verified) VALUES (${demoLearner.id},${demoLearner.name},${demoLearner.email},true) ON CONFLICT (id) DO NOTHING`
  yield* sql`INSERT INTO user_qualification_paths (user_id,qualification_path_id,access_scope) VALUES (${demoLearner.id},${writtenPath},'written') ON CONFLICT DO NOTHING`
  yield* sql`INSERT INTO user_exam_goals (user_id,qualification_path_id,version,exam_session_id,access_scope) VALUES (${demoLearner.id},${writtenPath},1,${demoExamSession},'written') ON CONFLICT DO NOTHING`
  yield* sql`INSERT INTO user_qualification_paths (user_id,qualification_path_id,access_scope,district_chamber_id)
 SELECT ${demoLearner.id},${oralPath},'oral',(SELECT dc.id FROM district_chambers dc JOIN exam_sessions s ON s.general_chamber_id=dc.general_chamber_id WHERE s.id=${demoExamSession} ORDER BY dc.sort_order LIMIT 1)
 ON CONFLICT DO NOTHING`
  yield* sql`INSERT INTO user_exam_goals (user_id,qualification_path_id,version,exam_session_id,access_scope) VALUES (${demoLearner.id},${oralPath},1,${demoExamSession},'oral') ON CONFLICT DO NOTHING`

  const [dates] =
    yield* sql`SELECT written_at,oral_planning_at FROM exam_sessions WHERE id=${demoExamSession}`.pipe(
      Effect.flatMap(Schema.decodeUnknownEffect(Schema.Tuple([ExamDates]))),
    )

  yield* seedWrittenHistory(now, dates.writtenAt)
  yield* seedOralHistory(now, dates.oralPlanningAt)
})
