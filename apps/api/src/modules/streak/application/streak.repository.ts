import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { BridgeCount, DailyAnswerCount } from '@inzpro/domain/modules/streak/streak'
import { Context, type DateTime, type Effect } from 'effect'
import type { StreakWriteError } from '~api/modules/streak/application/errors.js'
import type {
  DailyActivity,
  StreakBridgeEvent,
  StreakRecord,
} from '~api/modules/streak/domain/streak.model.js'

export class StreakRepository extends Context.Service<
  StreakRepository,
  {
    readonly addDailyAnswers: (
      userId: UserId,
      studyDay: DateTime.Utc,
      answerCount: DailyAnswerCount,
    ) => Effect.Effect<DailyActivity, StreakWriteError>
    readonly markQualifyingDay: (
      userId: UserId,
      studyDay: DateTime.Utc,
    ) => Effect.Effect<void, StreakWriteError>
    readonly storeStreak: (
      userId: UserId,
      record: StreakRecord,
    ) => Effect.Effect<void, StreakWriteError>
    readonly recordBridgeEvent: (
      userId: UserId,
      event: StreakBridgeEvent,
    ) => Effect.Effect<boolean, StreakWriteError>
    readonly storeBridgeCount: (
      userId: UserId,
      bridgeCount: BridgeCount,
    ) => Effect.Effect<void, StreakWriteError>
  }
>()('api/modules/streak/StreakRepository') {}
