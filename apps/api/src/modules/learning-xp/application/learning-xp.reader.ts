import type { UserId } from '@inzpro/domain/modules/identity/user'
import { Context, type Effect, type Option } from 'effect'

import type { XpPeriod, XpPeriodTotal } from '../domain/learning-xp.model.js'
import type { XpReadError } from './errors.js'

export class XpReader extends Context.Service<
  XpReader,
  {
    readonly periodTotal: (
      userId: UserId,
      period: XpPeriod,
    ) => Effect.Effect<Option.Option<XpPeriodTotal>, XpReadError>
  }
>()('api/modules/learning-xp/XpReader') {}
