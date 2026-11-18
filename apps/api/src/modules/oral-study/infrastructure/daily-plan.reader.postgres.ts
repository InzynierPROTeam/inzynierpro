import { DateTime, Effect, Option, Schema } from 'effect'
import { SqlClient, type Statement } from 'effect/sql'
import { DailyPlanRecord } from '~api/modules/daily-plan/domain/daily-plan.model.js'
import { StudyReadError } from '~api/modules/oral-study/application/errors.js'
import type { OralStudyReader } from '~api/modules/oral-study/application/oral-study.reader.js'

type DailyPlanReader = Pick<OralStudyReader['Service'], 'dailyPlan' | 'firstDailyPlanOfRound'>

export const oralDailyPlanReader = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  const firstPlan = (query: Statement.Statement<unknown>) =>
    query.pipe(
      Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(DailyPlanRecord))),
      Effect.map(rows => Option.fromNullishOr(rows[0])),
      Effect.mapError(cause => new StudyReadError({ cause })),
    )

  const columns = sql`study_day,round_number AS round,target_date,remaining_question_count,target_question_count,completed_question_count,plan_settings_version AS settings_version,round_completed_at`

  return {
    dailyPlan: Effect.fn('OralStudyReader.dailyPlan')((userId, pathId, studyDay) =>
      firstPlan(
        sql`SELECT ${columns} FROM oral_daily_plans WHERE user_id=${userId} AND qualification_path_id=${pathId} AND study_day=${DateTime.formatIso(studyDay)} LIMIT 1`,
      ),
    ),
    firstDailyPlanOfRound: Effect.fn('OralStudyReader.firstDailyPlanOfRound')(
      (userId, pathId, round) =>
        firstPlan(
          sql`SELECT ${columns} FROM oral_daily_plans WHERE user_id=${userId} AND qualification_path_id=${pathId} AND round_number=${round} ORDER BY study_day LIMIT 1`,
        ),
    ),
  } satisfies DailyPlanReader
})
