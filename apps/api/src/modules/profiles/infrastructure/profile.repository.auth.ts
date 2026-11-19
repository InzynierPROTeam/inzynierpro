import { Auth } from '@inzpro/auth'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import { Effect, Layer, Schema } from 'effect'

import { ProfileWriteError } from '../application/errors.js'
import { ProfileRepository } from '../application/profile.repository.js'
import { ProfileSettings } from '../domain/profile.model.js'

export const ProfileRepositoryLive = Layer.effect(
  ProfileRepository,
  Effect.gen(function* () {
    const auth = yield* Auth

    const updateUser = (userId: UserId, data: Partial<ProfileSettings>) =>
      Effect.tryPromise(async () =>
        (await auth.$context).internalAdapter.updateUser(userId, data),
      ).pipe(
        Effect.flatMap(Schema.decodeUnknownEffect(ProfileSettings)),
        Effect.mapError(cause => new ProfileWriteError({ cause })),
      )

    return ProfileRepository.of({
      rename: Effect.fn('ProfileRepository.rename')((userId, name) => updateUser(userId, { name })),
      setPrivacy: Effect.fn('ProfileRepository.setPrivacy')((userId, privateProfile) =>
        updateUser(userId, { privateProfile }),
      ),
    })
  }),
)
