import { Context, type Effect } from 'effect'

import type { XpAward, XpPeriod } from '../domain/learning-xp.model.js'
import type { XpWriteError } from './errors.js'

export class XpRepository extends Context.Service<
  XpRepository,
  {
    readonly recordAward: (award: XpAward) => Effect.Effect<boolean, XpWriteError>
    readonly addPeriodXp: (award: XpAward, period: XpPeriod) => Effect.Effect<void, XpWriteError>
  }
>()('api/modules/learning-xp/XpRepository') {}
