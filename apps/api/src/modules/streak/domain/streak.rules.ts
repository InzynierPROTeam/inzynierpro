import type { ExamPart } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { BridgeCount, DailyAnswerCount, StreakLength } from '@inzpro/domain/modules/streak/streak'
import { Array as Arr, DateTime, Option, Order } from 'effect'
import type { LearningRoundNumber } from '~api/modules/learning/domain/learning-round.model.js'
import { studyDayOf } from '~api/modules/learning/domain/study-day.rules.js'
import {
  completedRoundBridge,
  missedDayBridge,
  passedMockExamBridge,
  type Streak,
  type StreakBridgeEvent,
  type StreakBridgeGrant,
  streakMilestoneBridge,
  type StreakRecord,
} from '~api/modules/streak/domain/streak.model.js'

const dailyAnswerThreshold = DailyAnswerCount.make(5)

const bridgeLimit = BridgeCount.make(5)

const streakMilestoneDays = 7

const noStreak = StreakLength.make(0)

const noBridges = BridgeCount.make(0)

const oneBridge = BridgeCount.make(1)

const followsDay = (previous: DateTime.Utc, day: DateTime.Utc) =>
  DateTime.Equivalence(studyDayOf(previous).end, day)

export const qualifiesStudyDay = (answerCount: DailyAnswerCount) =>
  answerCount >= dailyAnswerThreshold

type StreakDay = { readonly day: DateTime.Utc; readonly qualifies: boolean }

const byDay = Order.mapInput(DateTime.Order, ({ day }: StreakDay) => day)

export const streakRecordOf = (
  qualifyingDays: ReadonlyArray<DateTime.Utc>,
  bridgedDays: ReadonlyArray<DateTime.Utc>,
): Option.Option<StreakRecord> =>
  Option.map(Arr.last(Arr.sort(qualifyingDays, DateTime.Order)), lastQualifyingDay => {
    const days = Arr.sort(
      [
        ...qualifyingDays.map(day => ({ day, qualifies: true })),
        ...bridgedDays.flatMap(day =>
          qualifyingDays.some(qualifying => DateTime.Equivalence(qualifying, day))
            ? []
            : [{ day, qualifies: false }],
        ),
      ],
      byDay,
    )

    const runs = days.reduce<{ current: number; longest: number }>(
      (lengths, { day, qualifies }, index) => {
        const previous = days[index - 1]
        const added = qualifies ? 1 : 0

        const current =
          previous !== undefined && followsDay(previous.day, day) ? lengths.current + added : added

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

const missedDaysFrom = (
  next: DateTime.Utc,
  day: DateTime.Utc,
  bridgeCount: BridgeCount,
  missed: ReadonlyArray<DateTime.Utc>,
): Option.Option<ReadonlyArray<DateTime.Utc>> => {
  if (!DateTime.isLessThan(next, day)) {
    return Option.some(missed)
  }

  if (missed.length >= bridgeCount) {
    return Option.none()
  }

  return missedDaysFrom(studyDayOf(next).end, day, bridgeCount, [...missed, next])
}

export const coveredMissedDays = (
  lastQualifyingDay: DateTime.Utc,
  day: DateTime.Utc,
  bridgeCount: BridgeCount,
) => missedDaysFrom(studyDayOf(lastQualifyingDay).end, day, bridgeCount, [])

export const reachesStreakMilestone = (record: StreakRecord, day: DateTime.Utc) =>
  DateTime.Equivalence(record.lastQualifyingDay, day) &&
  record.currentStreak > 0 &&
  record.currentStreak % streakMilestoneDays === 0

export const grantedBridges = (bridgeCount: BridgeCount, requested: BridgeCount) =>
  BridgeCount.make(Math.max(0, Math.min(bridgeLimit - bridgeCount, requested)))

export const streakMilestoneBridgeOf = (day: DateTime.Utc): StreakBridgeGrant => ({
  key: `streak:${DateTime.formatIso(day)}`,
  reason: streakMilestoneBridge,
  studyDay: day,
  bridgeCount: oneBridge,
})

export const passedMockExamBridgeOf = (finishedAt: DateTime.Utc): StreakBridgeGrant => {
  const studyDay = studyDayOf(finishedAt).start

  return {
    key: `exam-pass:${DateTime.formatIso(studyDay)}`,
    reason: passedMockExamBridge,
    studyDay,
    bridgeCount: oneBridge,
  }
}

export const completedRoundBridgeOf = (
  pathId: QualificationPathId,
  part: ExamPart,
  round: LearningRoundNumber,
  completedAt: DateTime.Utc,
): StreakBridgeGrant => ({
  key: `round:${pathId}:${part}:${round}`,
  reason: completedRoundBridge,
  studyDay: studyDayOf(completedAt).start,
  bridgeCount: bridgeLimit,
})

export const missedDayBridgeOf = (day: DateTime.Utc): StreakBridgeEvent => ({
  key: `use:${DateTime.formatIso(day)}`,
  reason: missedDayBridge,
  studyDay: day,
  bridgeChange: -1,
})

export const streakOf = (
  record: Option.Option<StreakRecord>,
  todayAnswerCount: DailyAnswerCount,
  now: DateTime.Utc,
  bridgeCount: BridgeCount,
): Streak => {
  const today = studyDayOf(now).start

  const todayQualifies = Option.exists(record, ({ lastQualifyingDay }) =>
    DateTime.Equivalence(lastQualifyingDay, today),
  )

  const gap = Option.flatMap(record, ({ lastQualifyingDay }) =>
    todayQualifies ? Option.some([]) : coveredMissedDays(lastQualifyingDay, today, bridgeCount),
  )

  return {
    currentStreak: Option.match(Option.all({ record, gap }), {
      onNone: () => noStreak,
      onSome: ({ record: { currentStreak } }) => currentStreak,
    }),
    longestStreak: Option.match(record, {
      onNone: () => noStreak,
      onSome: ({ longestStreak }) => longestStreak,
    }),
    todayAnswerCount,
    dailyAnswerThreshold,
    todayQualifies,
    bridgeCount,
    bridgeLimit,
    pendingBridgeCount: Option.match(gap, {
      onNone: () => noBridges,
      onSome: missed => BridgeCount.make(missed.length),
    }),
  }
}
