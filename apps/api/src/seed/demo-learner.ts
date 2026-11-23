import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import type { Email } from '@inzpro/domain/common/email'
import { Uuid } from '@inzpro/domain/common/id'
import { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import { UserId } from '@inzpro/domain/modules/identity/user'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { firstFinishedSessionBadge } from '@inzpro/domain/modules/learning-xp/badge'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DailyAnswerCount } from '@inzpro/domain/modules/streak/streak'
import { DateTime, Effect, Option, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import { defaultDailyPlanSettings } from '~api/modules/daily-plan/domain/daily-plan.model.js'
import { draftDailyPlan } from '~api/modules/daily-plan/domain/daily-plan.rules.js'
import { LearningRoundNumber } from '~api/modules/learning/domain/learning-round.model.js'
import { studyDayOf } from '~api/modules/learning/domain/study-day.rules.js'
import { qualifiesStudyDay, streakRecordOf } from '~api/modules/streak/domain/streak.rules.js'

import { catalogueId } from './catalogue-id.js'
import { seedLearnerXp } from './ranked-learners.js'

const demoLearnerName = 'Jan Kowalski'

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

const seedWrittenHistory = (userId: UserId, now: DateTime.Utc, writtenAt: DateTime.Utc) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const [history] =
      yield* sql`SELECT EXISTS (SELECT 1 FROM written_daily_plans WHERE user_id=${userId}) AS present`.pipe(
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
 VALUES (${userId},${writtenPath},${DateTime.formatIso(studyDay)},${round},${DateTime.formatIso(targetDate)},${remainingQuestionCount},${targetQuestionCount},${answers},${plan.value.settingsVersion})`
      }

      for (const question of pool.slice(
        progress.coveredQuestionCount,
        progress.coveredQuestionCount + answers,
      )) {
        yield* sql`INSERT INTO written_question_coverage (user_id,qualification_path_id,question_id,question_revision_id,round_number,covered_at)
 VALUES (${userId},${writtenPath},${question.questionId},${question.revisionId},1,${DateTime.formatIso(day)})`
      }
    }
  })

const seedOralHistory = (userId: UserId, now: DateTime.Utc, oralPlanningAt: DateTime.Utc) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const [history] =
      yield* sql`SELECT EXISTS (SELECT 1 FROM oral_daily_plans WHERE user_id=${userId}) AS present`.pipe(
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
 VALUES (${userId},${oralPath},${DateTime.formatIso(studyDay)},${round},${DateTime.formatIso(targetDate)},${remainingQuestionCount},${targetQuestionCount},${answers},${plan.value.settingsVersion})`
      }

      for (const question of pool.slice(
        progress.coveredQuestionCount,
        progress.coveredQuestionCount + answers,
      )) {
        yield* sql`INSERT INTO oral_question_coverage (user_id,qualification_path_id,question_id,oral_revision_id,round_number,covered_at)
 VALUES (${userId},${oralPath},${question.questionId},${question.revisionId},1,${DateTime.formatIso(day)})`
      }
    }
  })

const seedStreakHistory = (userId: UserId, now: DateTime.Utc) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const [history] =
      yield* sql`SELECT EXISTS (SELECT 1 FROM daily_learning_activity WHERE user_id=${userId}) AS present`.pipe(
        Effect.flatMap(Schema.decodeUnknownEffect(Presence)),
      )

    if (history.present) {
      return
    }

    const qualifyingDays: Array<DateTime.Utc> = []

    for (const [index, writtenAnswers] of writtenAnswersOnEarlierDays.entries()) {
      const answerCount = DailyAnswerCount.make(
        writtenAnswers + (oralAnswersOnEarlierDays[index] ?? 0),
      )

      if (answerCount === 0) {
        continue
      }

      const day = earlierDay(now, writtenAnswersOnEarlierDays, index)
      const studyDay = studyDayOf(day).start
      const qualifiedAt = qualifiesStudyDay(answerCount) ? DateTime.formatIso(day) : null

      if (qualifiedAt !== null) {
        qualifyingDays.push(studyDay)
      }

      yield* sql`INSERT INTO daily_learning_activity (user_id,study_day,answer_count,qualified_at)
 VALUES (${userId},${DateTime.formatIso(studyDay)},${answerCount},${qualifiedAt})`
    }

    const record = streakRecordOf(qualifyingDays, [])

    if (Option.isSome(record)) {
      const { currentStreak, longestStreak, lastQualifyingDay } = record.value

      yield* sql`INSERT INTO learning_streaks (user_id,current_streak,longest_streak,last_qualifying_day)
 VALUES (${userId},${currentStreak},${longestStreak},${DateTime.formatIso(lastQualifyingDay)})`
    }
  })

const LearnerRow = Schema.Tuple([Schema.Struct({ id: UserId })])

export const seedDemoLearner = Effect.fn('Seed.seedDemoLearner')(function* (email: Email) {
  const sql = yield* SqlClient.SqlClient
  const now = yield* DateTime.now
  const normalizedEmail = email.toLowerCase()

  yield* sql`INSERT INTO users (name,email,email_verified) VALUES (${demoLearnerName},${normalizedEmail},true) ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name WHERE users.name=''`

  const [{ id: userId }] =
    yield* sql`SELECT id FROM users WHERE email=${normalizedEmail} LIMIT 1`.pipe(
      Effect.flatMap(Schema.decodeUnknownEffect(LearnerRow)),
    )

  yield* sql`INSERT INTO user_qualification_paths (user_id,qualification_path_id,access_scope) VALUES (${userId},${writtenPath},'written') ON CONFLICT DO NOTHING`
  yield* sql`INSERT INTO user_exam_goals (user_id,qualification_path_id,version,exam_session_id,access_scope) VALUES (${userId},${writtenPath},1,${demoExamSession},'written') ON CONFLICT DO NOTHING`
  yield* sql`INSERT INTO user_qualification_paths (user_id,qualification_path_id,access_scope,district_chamber_id)
 SELECT ${userId},${oralPath},'oral',(SELECT dc.id FROM district_chambers dc JOIN exam_sessions s ON s.general_chamber_id=dc.general_chamber_id WHERE s.id=${demoExamSession} ORDER BY dc.sort_order LIMIT 1)
 ON CONFLICT DO NOTHING`
  yield* sql`INSERT INTO user_exam_goals (user_id,qualification_path_id,version,exam_session_id,access_scope) VALUES (${userId},${oralPath},1,${demoExamSession},'oral') ON CONFLICT DO NOTHING`

  const [dates] =
    yield* sql`SELECT written_at,oral_planning_at FROM exam_sessions WHERE id=${demoExamSession}`.pipe(
      Effect.flatMap(Schema.decodeUnknownEffect(Schema.Tuple([ExamDates]))),
    )

  yield* seedWrittenHistory(userId, now, dates.writtenAt)
  yield* seedOralHistory(userId, now, dates.oralPlanningAt)
  yield* seedStreakHistory(userId, now)
  yield* seedLearnerXp(now, {
    userId,
    pathId: yield* Schema.decodeEffect(QualificationPathId)(writtenPath),
    examSessionId: yield* Schema.decodeEffect(ExamSessionId)(demoExamSession),
    dailyXp: [
      [0, 70],
      [1, 30],
      [2, 120],
      [3, 50],
      [5, 90],
      [13, 110],
    ],
    badges: [firstFinishedSessionBadge],
  })
})
