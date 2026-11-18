import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Effect, Layer } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { accountReadLimit, limitByUser } from '~api/lib/rate-limit.js'
import { AuthenticationLive } from '~api/middleware/authentication.js'

import { XpReader } from '../application/learning-xp.reader.js'
import { allTimeXp } from '../domain/learning-xp.model.js'
import { XpReaderLive } from '../infrastructure/learning-xp.reader.postgres.js'
import { failXpRead } from './errors.js'

export const LearningXpLive = HttpApiBuilder.group(Api, 'LearningXp', handlers =>
  handlers.handle('GetLearningXp', () =>
    limitByUser(accountReadLimit).pipe(
      Effect.andThen(
        Effect.gen(function* () {
          const user = yield* CurrentUser
          const xpReader = yield* XpReader

          return { total: yield* xpReader.periodTotal(user.id, { kind: allTimeXp, key: 'all' }) }
        }),
      ),
      Effect.catchTags({ XpReadError: failXpRead }),
    ),
  ),
).pipe(Layer.provide(AuthenticationLive))

export const LearningXpRequestServices = XpReaderLive
