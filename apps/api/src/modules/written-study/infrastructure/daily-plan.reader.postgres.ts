import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import {
  dailyCountPlanPreference,
  DailyPlanSettingsVersion,
  DailyQuestionCount,
  PlanPreferenceMode,
  targetDatePlanPreference,
} from '@inzpro/domain/modules/daily-plan/daily-plan'
import { DateTime, Effect, Option, Schema } from 'effect'
import { SqlClient, type Statement } from 'effect/sql'
import {
  DailyPlanRecord,
  type DailyPlanSettings,
  defaultDailyPlanSettings,
} from '~api/modules/daily-plan/domain/daily-plan.model.js'
import { StudyReadError } from '~api/modules/written-study/application/errors.js'
import type { StudyReader } from '~api/modules/written-study/application/study.reader.js'

type DailyPlanReader = Pick<
  StudyReader['Service'],
  'dailyPlan' | 'firstDailyPlanOfPace' | 'dailyPlanSettings'
>

const DailyPlanSettingsRow = Schema.Struct({
  version: DailyPlanSettingsVersion,
  mode: PlanPreferenceMode,
  targetDate: Schema.NullOr(DateTimeUtc),
  dailyQuestionCount: Schema.NullOr(DailyQuestionCount),
})

const settingsOf = (row: typeof DailyPlanSettingsRow.Type): DailyPlanSettings => {
  if (row.mode === targetDatePlanPreference && row.targetDate !== null) {
    return { version: row.version, preference: { mode: row.mode, targetDate: row.targetDate } }
  }

  if (row.mode === dailyCountPlanPreference && row.dailyQuestionCount !== null) {
    return {
      version: row.version,
      preference: { mode: row.mode, dailyQuestionCount: row.dailyQuestionCount },
    }
  }

  return { version: row.version, preference: defaultDailyPlanSettings.preference }
}

export const writtenDailyPlanReader = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  const firstPlan = (query: Statement.Statement<unknown>) =>
    query.pipe(
      Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(DailyPlanRecord))),
      Effect.map(rows => Option.fromNullishOr(rows[0])),
      Effect.mapError(cause => new StudyReadError({ cause })),
    )

  const columns = sql`study_day,round_number AS round,target_date,remaining_question_count,target_question_count,completed_question_count,plan_settings_version AS settings_version,round_completed_at`

  return {
    dailyPlan: Effect.fn('StudyReader.dailyPlan')((userId, pathId, studyDay) =>
      firstPlan(
        sql`SELECT ${columns} FROM written_daily_plans WHERE user_id=${userId} AND qualification_path_id=${pathId} AND study_day=${DateTime.formatIso(studyDay)} LIMIT 1`,
      ),
    ),
    firstDailyPlanOfPace: Effect.fn('StudyReader.firstDailyPlanOfPace')(
      (userId, pathId, round, settingsVersion) =>
        firstPlan(
          sql`SELECT ${columns} FROM written_daily_plans WHERE user_id=${userId} AND qualification_path_id=${pathId} AND round_number=${round} AND plan_settings_version=${settingsVersion} ORDER BY study_day LIMIT 1`,
        ),
    ),
    dailyPlanSettings: Effect.fn('StudyReader.dailyPlanSettings')((userId, pathId) =>
      sql`SELECT version,mode,target_date,daily_question_count FROM written_daily_plan_settings WHERE user_id=${userId} AND qualification_path_id=${pathId} ORDER BY version DESC LIMIT 1`.pipe(
        Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(DailyPlanSettingsRow))),
        Effect.map(rows =>
          Option.match(Option.fromNullishOr(rows[0]), {
            onNone: () => defaultDailyPlanSettings,
            onSome: settingsOf,
          }),
        ),
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
    ),
  } satisfies DailyPlanReader
})
