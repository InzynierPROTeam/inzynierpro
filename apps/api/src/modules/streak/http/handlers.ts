import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Effect, Layer } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { accountReadLimit, limitByUser } from '~api/lib/rate-limit.js'
import { AuthenticationLive } from '~api/middleware/authentication.js'
import { currentStreak } from '~api/modules/streak/application/streak.query.js'
import { StreakReaderLive } from '~api/modules/streak/infrastructure/streak.reader.postgres.js'

import { failStreakRead } from './errors.js'

export const StreakLive = HttpApiBuilder.group(Api, 'Streak', handlers =>
  handlers.handle('GetStreak', () =>
    limitByUser(accountReadLimit).pipe(
      Effect.andThen(Effect.flatMap(CurrentUser, user => currentStreak(user.id))),
      Effect.catchTags({ StreakReadError: failStreakRead }),
    ),
  ),
).pipe(Layer.provide(AuthenticationLive))

export const StreakRequestServices = StreakReaderLive
