import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Effect } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { accountReadLimit, limitByUser } from '~api/lib/rate-limit.js'

import { examSessionRanking, periodRanking } from '../application/ranking.query.js'
import { RankingReaderLive } from '../infrastructure/ranking.reader.postgres.js'
import { failRankingRead } from './errors.js'
import { toRankingDto } from './mappers.js'

export const RankingsLive = HttpApiBuilder.group(Api, 'Rankings', handlers =>
  handlers
    .handle('GetPeriodRanking', ({ params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(Effect.flatMap(CurrentUser, user => periodRanking(user.id, params.period))),
        Effect.map(toRankingDto),
        Effect.catchTags({ RankingReadError: failRankingRead }),
      ),
    )
    .handle('GetExamSessionRanking', ({ params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user => examSessionRanking(user.id, params.examSessionId)),
        ),
        Effect.map(toRankingDto),
        Effect.catchTags({ RankingReadError: failRankingRead }),
      ),
    ),
)

export const RankingsRequestServices = RankingReaderLive
