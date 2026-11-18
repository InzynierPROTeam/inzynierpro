import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import { Context, type Effect } from 'effect'

import type { XpPeriod } from '../domain/learning-xp.model.js'
import type { XpReadError } from './errors.js'

export class XpReader extends Context.Service<
  XpReader,
  {
    readonly periodTotal: (
      userId: UserId,
      period: XpPeriod,
    ) => Effect.Effect<LearningXp, XpReadError>
  }
>()('api/modules/learning-xp/XpReader') {}
