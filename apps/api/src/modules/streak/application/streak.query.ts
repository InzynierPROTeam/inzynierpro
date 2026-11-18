import type { UserId } from '@inzpro/domain/modules/identity/user'
import { DateTime, Effect } from 'effect'
import { studyDayOf } from '~api/modules/learning/domain/study-day.rules.js'
import { StreakReader } from '~api/modules/streak/application/streak.reader.js'
import { streakOf } from '~api/modules/streak/domain/streak.rules.js'

export const currentStreak = Effect.fn('Streak.currentStreak')(function* (userId: UserId) {
  const streakReader = yield* StreakReader
  const now = yield* DateTime.now
  const record = yield* streakReader.streak(userId)
  const todayAnswerCount = yield* streakReader.dailyAnswerCount(userId, studyDayOf(now).start)
  const bridgeCount = yield* streakReader.bridgeCount(userId)

  return streakOf(record, todayAnswerCount, now, bridgeCount)
})
