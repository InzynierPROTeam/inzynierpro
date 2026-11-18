import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import { Effect, Layer, Option } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { accountReadLimit, limitByUser } from '~api/lib/rate-limit.js'
import { AuthenticationLive } from '~api/middleware/authentication.js'

import { XpReader } from '../application/learning-xp.reader.js'
import { allTimeXpPeriod } from '../domain/learning-xp.model.js'
import { XpReaderLive } from '../infrastructure/learning-xp.reader.postgres.js'
import { failXpRead } from './errors.js'
import { toEarnedBadgeDto } from './mappers.js'

export const LearningXpLive = HttpApiBuilder.group(Api, 'LearningXp', handlers =>
  handlers.handle('GetLearningXp', () =>
    limitByUser(accountReadLimit).pipe(
      Effect.andThen(
        Effect.gen(function* () {
          const user = yield* CurrentUser
          const xpReader = yield* XpReader

          const total = yield* xpReader.periodTotal(user.id, allTimeXpPeriod)
          const badges = yield* xpReader.earnedBadges(user.id)

          return {
            total: Option.match(total, {
              onNone: () => LearningXp.make(0),
              onSome: value => value.total,
            }),
            badges: badges.map(toEarnedBadgeDto),
          }
        }),
      ),
      Effect.catchTags({ XpReadError: failXpRead }),
    ),
  ),
).pipe(Layer.provide(AuthenticationLive))

export const LearningXpRequestServices = XpReaderLive
