import type { UserId } from '@inzpro/domain/modules/identity/user'
import { ProfileName } from '@inzpro/domain/modules/profiles/profile'
import { Effect, Schema } from 'effect'

import { InvalidProfileName } from '../domain/errors.js'
import { ProfileRepository } from './profile.repository.js'

export const renameProfile = Effect.fn('Profiles.renameProfile')(function* (
  userId: UserId,
  name: string,
) {
  const profileRepository = yield* ProfileRepository

  const profileName = yield* Schema.decodeEffect(ProfileName)(name.trim()).pipe(
    Effect.mapError(() => new InvalidProfileName()),
  )

  return yield* profileRepository.rename(userId, profileName)
})
