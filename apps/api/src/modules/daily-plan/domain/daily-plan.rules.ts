import { POLAND_TIME_ZONE } from '@inzpro/config/localization'
import {
  dailyCountPlanPreference,
  type DailyPlanSettingsVersion,
  DayCount,
  defaultPlanPreference,
  examPassedDailyPlan,
  finalDaysDailyPlan,
  nextDailyPlanSettingsVersion,
  noMaterialDailyPlan,
  plannedDailyPlan,
  roundCompletedDailyPlan,
  targetDatePlanPreference,
} from '@inzpro/domain/modules/daily-plan/daily-plan'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { DateTime, Duration, Effect, Option } from 'effect'
import type {
  DailyPlan,
  DailyPlanRecord,
  DailyPlanSettings,
  NewDailyPlan,
  PlanPreference,
} from '~api/modules/daily-plan/domain/daily-plan.model.js'
import {
  InvalidPlanPreference,
  StaleDailyPlanSettings,
} from '~api/modules/daily-plan/domain/errors.js'
import type { LearningRoundProgress } from '~api/modules/learning/domain/learning-round.model.js'
import { currentLearningRound } from '~api/modules/learning/domain/learning-round.rules.js'
import { studyDayOf } from '~api/modules/learning/domain/study-day.rules.js'

const dailyPlanBufferDays = 7

const planZone = DateTime.zoneMakeNamedUnsafe(POLAND_TIME_ZONE)

const addPlanDays = (day: DateTime.Utc, days: number): DateTime.Utc =>
  DateTime.toUtc(DateTime.startOf(DateTime.add(DateTime.setZone(day, planZone), { days }), 'day'))

const calendarDayOf = (at: DateTime.Utc) => DateTime.removeTime(DateTime.setZone(at, planZone))

const planDaysBetween = (from: DateTime.Utc, to: DateTime.Utc): number =>
  Math.round(Duration.toDays(DateTime.distance(calendarDayOf(from), calendarDayOf(to))))

const examDates = (examAt: DateTime.Utc, now: DateTime.Utc) => {
  const today = studyDayOf(now).start
  const examDay = studyDayOf(examAt).start
  const daysUntilExam = planDaysBetween(today, examDay)

  return {
    today,
    examDay,
    daysUntilExam,
    isExamDay: daysUntilExam === 0,
    isExamPassed: daysUntilExam < 0,
  }
}

type ExamDates = ReturnType<typeof examDates>

const isOwnTargetDateAhead = (dates: ExamDates, targetDate: DateTime.Utc) =>
  planDaysBetween(dates.today, targetDate) >= 0 && planDaysBetween(targetDate, dates.examDay) > 0

const isFinalDays = (dates: ExamDates, preference: PlanPreference) => {
  switch (preference.mode) {
    case defaultPlanPreference:
      return planDaysBetween(dates.today, addPlanDays(dates.examDay, -dailyPlanBufferDays)) <= 0
    case targetDatePlanPreference:
      return !isOwnTargetDateAhead(dates, preference.targetDate)
    case dailyCountPlanPreference:
      return false
  }
}

const datedTargetDate = (dates: ExamDates, preference: PlanPreference): DateTime.Utc => {
  if (isFinalDays(dates, preference)) {
    return addPlanDays(dates.examDay, -1)
  }

  return preference.mode === targetDatePlanPreference
    ? preference.targetDate
    : addPlanDays(dates.examDay, -dailyPlanBufferDays)
}

const planTarget = (
  dates: ExamDates,
  remaining: number,
  preference: PlanPreference,
): Pick<NewDailyPlan, 'targetDate' | 'targetQuestionCount'> => {
  if (dates.isExamDay) {
    return { targetDate: dates.examDay, targetQuestionCount: QuestionCount.make(0) }
  }

  if (preference.mode === dailyCountPlanPreference) {
    const daysToFinish = Math.max(1, Math.ceil(remaining / preference.dailyQuestionCount))

    return {
      targetDate: addPlanDays(dates.today, daysToFinish - 1),
      targetQuestionCount: QuestionCount.make(Math.min(preference.dailyQuestionCount, remaining)),
    }
  }

  const targetDate = datedTargetDate(dates, preference)
  const daysUntilTarget = planDaysBetween(dates.today, targetDate) + 1

  return {
    targetDate,
    targetQuestionCount: QuestionCount.make(Math.ceil(remaining / daysUntilTarget)),
  }
}

type PreferenceInput = {
  readonly now: DateTime.Utc
  readonly examAt: DateTime.Utc
  readonly preference: PlanPreference
}

export const acceptsPlanPreference = ({ now, examAt, preference }: PreferenceInput) =>
  preference.mode !== targetDatePlanPreference ||
  isOwnTargetDateAhead(examDates(examAt, now), preference.targetDate)

const normalizedPlanPreference = (preference: PlanPreference): PlanPreference =>
  preference.mode === targetDatePlanPreference
    ? { mode: targetDatePlanPreference, targetDate: studyDayOf(preference.targetDate).start }
    : preference

const isSamePlanPreference = (left: PlanPreference, right: PlanPreference) => {
  switch (left.mode) {
    case defaultPlanPreference:
      return right.mode === defaultPlanPreference
    case targetDatePlanPreference:
      return (
        right.mode === targetDatePlanPreference &&
        DateTime.Equivalence(left.targetDate, right.targetDate)
      )
    case dailyCountPlanPreference:
      return (
        right.mode === dailyCountPlanPreference &&
        left.dailyQuestionCount === right.dailyQuestionCount
      )
  }
}

type SettingsChangeInput = PreferenceInput & {
  readonly current: DailyPlanSettings
  readonly expectedVersion: DailyPlanSettingsVersion
}

export const changedDailyPlanSettings = ({
  current,
  expectedVersion,
  ...input
}: SettingsChangeInput): Effect.Effect<
  Option.Option<DailyPlanSettings>,
  StaleDailyPlanSettings | InvalidPlanPreference
> => {
  const preference = normalizedPlanPreference(input.preference)

  if (isSamePlanPreference(preference, current.preference)) {
    return Effect.succeedNone
  }

  if (expectedVersion !== current.version) {
    return Effect.fail(new StaleDailyPlanSettings())
  }

  if (!acceptsPlanPreference({ ...input, preference })) {
    return Effect.fail(new InvalidPlanPreference())
  }

  return Effect.succeedSome({ version: nextDailyPlanSettingsVersion(current.version), preference })
}

const isRoundComplete = (progress: LearningRoundProgress) =>
  currentLearningRound(progress) !== progress.round

const roundToPlan = (progress: LearningRoundProgress): LearningRoundProgress =>
  isRoundComplete(progress)
    ? {
        round: currentLearningRound(progress),
        questionCount: progress.questionCount,
        coveredQuestionCount: QuestionCount.make(0),
      }
    : progress

type DraftInput = {
  readonly now: DateTime.Utc
  readonly examAt: DateTime.Utc
  readonly progress: LearningRoundProgress
  readonly settings: DailyPlanSettings
}

export const draftDailyPlan = ({
  now,
  examAt,
  progress,
  settings,
}: DraftInput): Option.Option<NewDailyPlan> => {
  const dates = examDates(examAt, now)
  const round = roundToPlan(progress)

  if (dates.isExamPassed || round.questionCount === 0) {
    return Option.none()
  }

  const remaining = round.questionCount - round.coveredQuestionCount

  return Option.some({
    studyDay: dates.today,
    round: round.round,
    remainingQuestionCount: QuestionCount.make(remaining),
    ...planTarget(dates, remaining, settings.preference),
    settingsVersion: settings.version,
  })
}

type ReplanInput = Omit<DraftInput, 'progress'> & { readonly record: DailyPlanRecord }

export const replanDailyPlan = ({ now, examAt, record, settings }: ReplanInput): NewDailyPlan => ({
  studyDay: record.studyDay,
  round: record.round,
  remainingQuestionCount: record.remainingQuestionCount,
  ...planTarget(examDates(examAt, now), record.remainingQuestionCount, settings.preference),
  settingsVersion: settings.version,
})

const questionsBehindPace = (
  today: DateTime.Utc,
  record: DailyPlanRecord,
  paceStart: DailyPlanRecord,
  preference: PlanPreference,
): QuestionCount => {
  const remaining = record.remainingQuestionCount - record.completedQuestionCount

  if (preference.mode === dailyCountPlanPreference) {
    const daysElapsed = planDaysBetween(paceStart.studyDay, today)

    const expectedCovered = Math.min(
      paceStart.remainingQuestionCount,
      preference.dailyQuestionCount * daysElapsed,
    )

    const covered = paceStart.remainingQuestionCount - remaining

    return QuestionCount.make(Math.max(0, expectedCovered - covered))
  }

  const plannedDays = planDaysBetween(paceStart.studyDay, record.targetDate) + 1
  const daysLeft = planDaysBetween(today, record.targetDate) + 1
  const expectedRemaining = Math.ceil((paceStart.remainingQuestionCount * daysLeft) / plannedDays)

  return QuestionCount.make(Math.max(0, remaining - expectedRemaining))
}

export type RoundCoverage = {
  readonly before: LearningRoundProgress
  readonly after: LearningRoundProgress
}

export const isCountedPlanAnswer = ({ before, after }: RoundCoverage) =>
  after.coveredQuestionCount > before.coveredQuestionCount

export const closesPlannedRound = ({ after }: RoundCoverage) => isRoundComplete(after)

type DailyPlanInput = Omit<DraftInput, 'progress'> & {
  readonly record: Option.Option<DailyPlanRecord>
  readonly paceStart: Option.Option<DailyPlanRecord>
}

export const dailyPlanOf = ({
  now,
  examAt,
  record,
  paceStart,
  settings,
}: DailyPlanInput): DailyPlan => {
  const dates = examDates(examAt, now)

  if (dates.isExamPassed) {
    return { status: examPassedDailyPlan, examDay: dates.examDay, settings }
  }

  if (Option.isNone(record)) {
    return { status: noMaterialDailyPlan, settings }
  }

  const today = record.value
  const isRoundCompleted = Option.isSome(today.roundCompletedAt)
  const hasNoPace = isRoundCompleted || dates.isExamDay

  return {
    status: isRoundCompleted
      ? roundCompletedDailyPlan
      : isFinalDays(dates, settings.preference)
        ? finalDaysDailyPlan
        : plannedDailyPlan,
    settings,
    examDay: dates.examDay,
    targetDate: today.targetDate,
    daysUntilExam: DayCount.make(dates.daysUntilExam),
    targetQuestionCount: isRoundCompleted ? QuestionCount.make(0) : today.targetQuestionCount,
    completedQuestionCount: today.completedQuestionCount,
    questionsBehindPace: hasNoPace
      ? QuestionCount.make(0)
      : questionsBehindPace(
          dates.today,
          today,
          Option.getOrElse(paceStart, () => today),
          settings.preference,
        ),
  }
}
