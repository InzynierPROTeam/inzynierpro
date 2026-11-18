import type { UserId } from '@inzpro/domain/modules/identity/user'
import {
  BridgeCount,
  type DailyAnswerCount,
  type StreakLength,
} from '@inzpro/domain/modules/streak/streak'
import { DateTime, Effect, Option } from 'effect'
import { studyDayOf } from '~api/modules/learning/domain/study-day.rules.js'
import { StreakReader } from '~api/modules/streak/application/streak.reader.js'
import { StreakRepository } from '~api/modules/streak/application/streak.repository.js'
import type { StreakBridgeGrant } from '~api/modules/streak/domain/streak.model.js'
import {
  coveredMissedDays,
  grantedBridges,
  missedDayBridgeOf,
  qualifiesStudyDay,
  reachesStreakMilestone,
  streakMilestoneBridgeOf,
  streakRecordOf,
} from '~api/modules/streak/domain/streak.rules.js'

export const grantStreakBridges = Effect.fn('Streak.grantStreakBridges')(function* (
  userId: UserId,
  grant: StreakBridgeGrant,
) {
  const streakReader = yield* StreakReader
  const streakRepository = yield* StreakRepository
  const bridgeCount = yield* streakReader.bridgeCount(userId)
  const granted = grantedBridges(bridgeCount, grant.bridgeCount)

  const isNew = yield* streakRepository.recordBridgeEvent(userId, {
    key: grant.key,
    reason: grant.reason,
    studyDay: grant.studyDay,
    bridgeChange: granted,
  })

  if (isNew && granted > 0) {
    yield* streakRepository.storeBridgeCount(userId, BridgeCount.make(bridgeCount + granted))
  }
})

const spendBridgesOnGap = Effect.fn('Streak.spendBridgesOnGap')(function* (
  userId: UserId,
  studyDay: DateTime.Utc,
) {
  const streakReader = yield* StreakReader
  const streakRepository = yield* StreakRepository
  const previous = yield* streakReader.streak(userId)
  const bridgeCount = yield* streakReader.bridgeCount(userId)

  const gap = Option.flatMap(
    Option.filter(previous, ({ lastQualifyingDay }) =>
      DateTime.isLessThan(lastQualifyingDay, studyDay),
    ),
    ({ lastQualifyingDay }) => coveredMissedDays(lastQualifyingDay, studyDay, bridgeCount),
  )

  const missedDays = Option.getOrElse(gap, () => [])

  if (missedDays.length === 0) {
    return
  }

  for (const missedDay of missedDays) {
    yield* streakRepository.recordBridgeEvent(userId, missedDayBridgeOf(missedDay))
  }

  yield* streakRepository.storeBridgeCount(
    userId,
    BridgeCount.make(bridgeCount - missedDays.length),
  )
})

export const recordStreakAnswers = Effect.fn('Streak.recordStreakAnswers')(function* (
  userId: UserId,
  answeredAt: DateTime.Utc,
  answerCount: DailyAnswerCount,
) {
  if (answerCount === 0) {
    return Option.none<StreakLength>()
  }

  const streakReader = yield* StreakReader
  const streakRepository = yield* StreakRepository
  const studyDay = studyDayOf(answeredAt).start
  const activity = yield* streakRepository.addDailyAnswers(userId, studyDay, answerCount)

  if (activity.isQualifying || !qualifiesStudyDay(activity.answerCount)) {
    return Option.none<StreakLength>()
  }

  yield* spendBridgesOnGap(userId, studyDay)
  yield* streakRepository.markQualifyingDay(userId, studyDay)

  const record = streakRecordOf(
    yield* streakReader.qualifyingDays(userId),
    yield* streakReader.bridgedDays(userId),
  )

  if (Option.isNone(record)) {
    return Option.none<StreakLength>()
  }

  yield* streakRepository.storeStreak(userId, record.value)

  if (reachesStreakMilestone(record.value, studyDay)) {
    yield* grantStreakBridges(userId, streakMilestoneBridgeOf(studyDay))
  }

  return Option.some(record.value.currentStreak)
})
