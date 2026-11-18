import { Context, type DateTime, type Effect } from 'effect'

import type {
  BadgeXpAward,
  DailyXpAwardLimit,
  XpAward,
  XpPeriod,
} from '../domain/learning-xp.model.js'
import type { XpWriteError } from './errors.js'

export class XpRepository extends Context.Service<
  XpRepository,
  {
    readonly recordAward: (
      award: XpAward,
      dailyLimit?: DailyXpAwardLimit,
    ) => Effect.Effect<boolean, XpWriteError>
    readonly recordBadge: (award: BadgeXpAward) => Effect.Effect<boolean, XpWriteError>
    readonly addPeriodXp: (
      award: XpAward,
      period: XpPeriod,
      reachedAt: DateTime.Utc,
    ) => Effect.Effect<void, XpWriteError>
  }
>()('api/modules/learning-xp/XpRepository') {}
