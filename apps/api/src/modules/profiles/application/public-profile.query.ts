import type { UserId } from '@inzpro/domain/modules/identity/user'
import { Effect, Option } from 'effect'
import { accountLearningXp } from '~api/modules/learning-xp/application/learning-xp.query.js'
import { PreparationReader } from '~api/modules/preparation/application/preparation.reader.js'
import { currentStreak } from '~api/modules/streak/application/streak.query.js'

import { ProfileNotFound } from '../domain/errors.js'
import type { PublicProfile } from '../domain/profile.model.js'
import { canViewProfile } from '../domain/profile.rules.js'
import { ProfileReader } from './profile.reader.js'

export const publicProfile = Effect.fn('Profiles.publicProfile')(function* (
  viewerId: UserId,
  userId: UserId,
) {
  const profileReader = yield* ProfileReader
  const preparationReader = yield* PreparationReader

  const profile = yield* profileReader.profile(userId)

  if (Option.isNone(profile) || !canViewProfile(viewerId, profile.value)) {
    return yield* new ProfileNotFound()
  }

  const xp = yield* accountLearningXp(userId)
  const streak = yield* currentStreak(userId)
  const paths = yield* preparationReader.activePaths(userId)

  return {
    profile: profile.value,
    totalXp: xp.total,
    badges: xp.badges,
    currentStreak: streak.currentStreak,
    paths,
  } satisfies PublicProfile
})
