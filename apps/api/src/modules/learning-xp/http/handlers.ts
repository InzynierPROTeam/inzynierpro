import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Effect, Layer } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { accountReadLimit, limitByUser } from '~api/lib/rate-limit.js'
import { AuthenticationLive } from '~api/middleware/authentication.js'

import { accountLearningXp } from '../application/learning-xp.query.js'
import { XpReaderLive } from '../infrastructure/learning-xp.reader.postgres.js'
import { failXpRead } from './errors.js'
import { toEarnedBadgeDto } from './mappers.js'

export const LearningXpLive = HttpApiBuilder.group(Api, 'LearningXp', handlers =>
  handlers.handle('GetLearningXp', () =>
    limitByUser(accountReadLimit).pipe(
      Effect.andThen(Effect.flatMap(CurrentUser, user => accountLearningXp(user.id))),
      Effect.map(({ total, badges }) => ({ total, badges: badges.map(toEarnedBadgeDto) })),
      Effect.catchTags({ XpReadError: failXpRead }),
    ),
  ),
).pipe(Layer.provide(AuthenticationLive))

export const LearningXpRequestServices = XpReaderLive
