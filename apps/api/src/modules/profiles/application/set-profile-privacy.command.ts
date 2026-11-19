import type { UserId } from '@inzpro/domain/modules/identity/user'
import { Effect } from 'effect'

import { ProfileRepository } from './profile.repository.js'

export const setProfilePrivacy = Effect.fn('Profiles.setProfilePrivacy')(function* (
  userId: UserId,
  privateProfile: boolean,
) {
  const profileRepository = yield* ProfileRepository

  return yield* profileRepository.setPrivacy(userId, privateProfile)
})
