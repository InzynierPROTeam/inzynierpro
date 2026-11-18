import { DailyAnswerCount, StreakLength } from '@inzpro/domain/modules/streak/streak'
import { Array as Arr, DateTime, Option } from 'effect'
import { studyDayOf } from '~api/modules/learning/domain/study-day.rules.js'
import type { Streak, StreakRecord } from '~api/modules/streak/domain/streak.model.js'

const dailyAnswerThreshold = DailyAnswerCount.make(5)

const noStreak = StreakLength.make(0)

const followsDay = (previous: DateTime.Utc, day: DateTime.Utc) =>
  DateTime.Equivalence(studyDayOf(previous).end, day)

export const qualifiesStudyDay = (answerCount: DailyAnswerCount) =>
  answerCount >= dailyAnswerThreshold

export const streakRecordOf = (
  qualifyingDays: ReadonlyArray<DateTime.Utc>,
): Option.Option<StreakRecord> =>
  Option.map(Arr.last(qualifyingDays), lastQualifyingDay => {
    const runs = qualifyingDays.reduce<{ current: number; longest: number }>(
      (lengths, day, index) => {
        const previous = qualifyingDays[index - 1]

        const current =
          previous !== undefined && followsDay(previous, day) ? lengths.current + 1 : 1

        return { current, longest: Math.max(lengths.longest, current) }
      },
      { current: 0, longest: 0 },
    )

    return {
      currentStreak: StreakLength.make(runs.current),
      longestStreak: StreakLength.make(runs.longest),
      lastQualifyingDay,
    }
  })

export const streakOf = (
  record: Option.Option<StreakRecord>,
  todayAnswerCount: DailyAnswerCount,
  now: DateTime.Utc,
): Streak => {
  const today = studyDayOf(now).start

  const todayQualifies = Option.exists(record, ({ lastQualifyingDay }) =>
    DateTime.Equivalence(lastQualifyingDay, today),
  )

  const unbroken = Option.filter(
    record,
    ({ lastQualifyingDay }) => todayQualifies || followsDay(lastQualifyingDay, today),
  )

  return {
    currentStreak: Option.match(unbroken, {
      onNone: () => noStreak,
      onSome: ({ currentStreak }) => currentStreak,
    }),
    longestStreak: Option.match(record, {
      onNone: () => noStreak,
      onSome: ({ longestStreak }) => longestStreak,
    }),
    todayAnswerCount,
    dailyAnswerThreshold,
    todayQualifies,
  }
}
