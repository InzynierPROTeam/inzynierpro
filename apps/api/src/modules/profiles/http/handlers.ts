import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Effect, Layer, Option } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { accountReadLimit, accountWriteLimit, limitByUser } from '~api/lib/rate-limit.js'
import { failXpRead } from '~api/modules/learning-xp/http/errors.js'
import { XpReaderLive } from '~api/modules/learning-xp/infrastructure/learning-xp.reader.postgres.js'
import { failPreparationRead } from '~api/modules/preparation/http/errors.js'
import { PreparationReaderLive } from '~api/modules/preparation/infrastructure/preparation.reader.postgres.js'
import { failStreakRead } from '~api/modules/streak/http/errors.js'
import { StreakReaderLive } from '~api/modules/streak/infrastructure/streak.reader.postgres.js'

import { ProfileReader } from '../application/profile.reader.js'
import { publicProfile } from '../application/public-profile.query.js'
import { renameProfile } from '../application/rename-profile.command.js'
import { setProfilePrivacy } from '../application/set-profile-privacy.command.js'
import { ProfileReaderLive } from '../infrastructure/profile.reader.postgres.js'
import { ProfileRepositoryLive } from '../infrastructure/profile.repository.auth.js'
import { failProfileRead, failProfileWrite, invalidProfileName, profileNotFound } from './errors.js'
import { toProfileSettingsDto, toPublicProfileDto } from './mappers.js'

export const ProfilesLive = HttpApiBuilder.group(Api, 'Profiles', handlers =>
  handlers
    .handle('GetProfileSettings', () =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            ProfileReader.use(profileReader => profileReader.profile(user.id)),
          ),
        ),
        Effect.flatMap(Option.match({ onNone: () => profileNotFound, onSome: Effect.succeed })),
        Effect.map(toProfileSettingsDto),
        Effect.catchTags({ ProfileReadError: failProfileRead }),
      ),
    )
    .handle('RenameProfile', ({ payload }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(Effect.flatMap(CurrentUser, user => renameProfile(user.id, payload.name))),
        Effect.catchTags({
          InvalidProfileName: () => invalidProfileName,
          ProfileWriteError: failProfileWrite,
        }),
      ),
    )
    .handle('SetProfilePrivacy', ({ payload }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user => setProfilePrivacy(user.id, payload.privateProfile)),
        ),
        Effect.catchTags({ ProfileWriteError: failProfileWrite }),
      ),
    )
    .handle('GetPublicProfile', ({ params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(Effect.flatMap(CurrentUser, user => publicProfile(user.id, params.userId))),
        Effect.map(toPublicProfileDto),
        Effect.catchTags({
          ProfileNotFound: () => profileNotFound,
          ProfileReadError: failProfileRead,
          XpReadError: failXpRead,
          StreakReadError: failStreakRead,
          PreparationReadError: failPreparationRead,
        }),
      ),
    ),
)

export const ProfilesRequestServices = Layer.mergeAll(
  ProfileReaderLive,
  ProfileRepositoryLive,
  XpReaderLive,
  StreakReaderLive,
  PreparationReaderLive,
)
