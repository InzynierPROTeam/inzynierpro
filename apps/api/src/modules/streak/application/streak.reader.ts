import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { DailyAnswerCount } from '@inzpro/domain/modules/streak/streak'
import { Context, type DateTime, type Effect, type Option } from 'effect'
import type { StreakReadError } from '~api/modules/streak/application/errors.js'
import type { StreakRecord } from '~api/modules/streak/domain/streak.model.js'

export class StreakReader extends Context.Service<
  StreakReader,
  {
    readonly streak: (userId: UserId) => Effect.Effect<Option.Option<StreakRecord>, StreakReadError>
    readonly dailyAnswerCount: (
      userId: UserId,
      studyDay: DateTime.Utc,
    ) => Effect.Effect<DailyAnswerCount, StreakReadError>
    readonly qualifyingDays: (
      userId: UserId,
    ) => Effect.Effect<ReadonlyArray<DateTime.Utc>, StreakReadError>
  }
>()('api/modules/streak/StreakReader') {}
