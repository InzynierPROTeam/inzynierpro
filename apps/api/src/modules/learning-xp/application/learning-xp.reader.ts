import type { UserId } from '@inzpro/domain/modules/identity/user'
import { Context, type Effect, type Option } from 'effect'

import type { EarnedBadge } from '../domain/learning-reward.model.js'
import type { XpPeriod, XpPeriodTotal } from '../domain/learning-xp.model.js'
import type { XpReadError } from './errors.js'

export class XpReader extends Context.Service<
  XpReader,
  {
    readonly periodTotal: (
      userId: UserId,
      period: XpPeriod,
    ) => Effect.Effect<Option.Option<XpPeriodTotal>, XpReadError>
    readonly earnedBadges: (
      userId: UserId,
    ) => Effect.Effect<ReadonlyArray<EarnedBadge>, XpReadError>
  }
>()('api/modules/learning-xp/XpReader') {}
