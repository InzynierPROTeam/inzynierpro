import { POLAND_TIME_ZONE } from '@inzpro/config/localization'
import {
  DayCount,
  defaultDailyPlanSettingsVersion,
  examPassedDailyPlan,
  finalDaysDailyPlan,
  noMaterialDailyPlan,
  plannedDailyPlan,
  roundCompletedDailyPlan,
} from '@inzpro/domain/modules/daily-plan/daily-plan'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { DateTime, Duration, Option } from 'effect'
import type {
  DailyPlan,
  DailyPlanRecord,
  NewDailyPlan,
} from '~api/modules/daily-plan/domain/daily-plan.model.js'
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

const planDates = (examAt: DateTime.Utc, now: DateTime.Utc) => {
  const today = studyDayOf(now).start
  const examDay = studyDayOf(examAt).start
  const daysUntilExam = planDaysBetween(today, examDay)
  const preferredTargetDate = addPlanDays(examDay, -dailyPlanBufferDays)
  const isFinalDays = planDaysBetween(today, preferredTargetDate) <= 0
  const isExamDay = daysUntilExam === 0

  return {
    today,
    examDay,
    daysUntilExam,
    isExamDay,
    isExamPassed: daysUntilExam < 0,
    isFinalDays,
    targetDate: isExamDay ? examDay : isFinalDays ? addPlanDays(examDay, -1) : preferredTargetDate,
  }
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
}

export const draftDailyPlan = ({
  now,
  examAt,
  progress,
}: DraftInput): Option.Option<NewDailyPlan> => {
  const dates = planDates(examAt, now)
  const round = roundToPlan(progress)

  if (dates.isExamPassed || round.questionCount === 0) {
    return Option.none()
  }

  const remaining = round.questionCount - round.coveredQuestionCount
  const daysUntilTarget = planDaysBetween(dates.today, dates.targetDate) + 1

  return Option.some({
    studyDay: dates.today,
    round: round.round,
    targetDate: dates.targetDate,
    remainingQuestionCount: QuestionCount.make(remaining),
    targetQuestionCount: QuestionCount.make(
      dates.isExamDay ? 0 : Math.ceil(remaining / daysUntilTarget),
    ),
    settingsVersion: defaultDailyPlanSettingsVersion,
  })
}

const questionsBehindPace = (
  today: DateTime.Utc,
  record: DailyPlanRecord,
  roundStart: DailyPlanRecord,
): QuestionCount => {
  const plannedDays = planDaysBetween(roundStart.studyDay, record.targetDate) + 1
  const daysLeft = planDaysBetween(today, record.targetDate) + 1
  const expectedRemaining = Math.ceil((roundStart.remainingQuestionCount * daysLeft) / plannedDays)
  const remaining = record.remainingQuestionCount - record.completedQuestionCount

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
  readonly roundStart: Option.Option<DailyPlanRecord>
}

export const dailyPlanOf = ({ now, examAt, record, roundStart }: DailyPlanInput): DailyPlan => {
  const dates = planDates(examAt, now)

  if (dates.isExamPassed) {
    return { status: examPassedDailyPlan, examDay: dates.examDay }
  }

  if (Option.isNone(record)) {
    return { status: noMaterialDailyPlan }
  }

  const today = record.value
  const isRoundCompleted = Option.isSome(today.roundCompletedAt)
  const hasNoPace = isRoundCompleted || dates.isExamDay

  return {
    status: isRoundCompleted
      ? roundCompletedDailyPlan
      : dates.isFinalDays
        ? finalDaysDailyPlan
        : plannedDailyPlan,
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
          Option.getOrElse(roundStart, () => today),
        ),
  }
}
