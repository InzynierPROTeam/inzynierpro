import type { UserId } from '@inzpro/domain/modules/identity/user'
import { Context, type Effect, type Option } from 'effect'
import type { XpPeriod } from '~api/modules/learning-xp/domain/learning-xp.model.js'

import type { RankedUser } from '../domain/ranking.model.js'
import type { RankingReadError } from './errors.js'

export class RankingReader extends Context.Service<
  RankingReader,
  {
    readonly top: (period: XpPeriod) => Effect.Effect<ReadonlyArray<RankedUser>, RankingReadError>
    readonly rankedUser: (
      userId: UserId,
      period: XpPeriod,
    ) => Effect.Effect<Option.Option<RankedUser>, RankingReadError>
  }
>()('api/modules/rankings/RankingReader') {}
