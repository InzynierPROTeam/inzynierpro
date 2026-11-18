import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { DailyAnswerCount } from '@inzpro/domain/modules/streak/streak'
import { type DateTime, Effect, Option } from 'effect'
import { studyDayOf } from '~api/modules/learning/domain/study-day.rules.js'
import { StreakReader } from '~api/modules/streak/application/streak.reader.js'
import { StreakRepository } from '~api/modules/streak/application/streak.repository.js'
import { qualifiesStudyDay, streakRecordOf } from '~api/modules/streak/domain/streak.rules.js'

export const recordStreakAnswers = Effect.fn('Streak.recordStreakAnswers')(function* (
  userId: UserId,
  answeredAt: DateTime.Utc,
  answerCount: DailyAnswerCount,
) {
  if (answerCount === 0) {
    return
  }

  const streakReader = yield* StreakReader
  const streakRepository = yield* StreakRepository
  const studyDay = studyDayOf(answeredAt).start
  const activity = yield* streakRepository.addDailyAnswers(userId, studyDay, answerCount)

  if (activity.isQualifying || !qualifiesStudyDay(activity.answerCount)) {
    return
  }

  yield* streakRepository.markQualifyingDay(userId, studyDay)

  const record = streakRecordOf(yield* streakReader.qualifyingDays(userId))

  if (Option.isSome(record)) {
    yield* streakRepository.storeStreak(userId, record.value)
  }
})
