import { UserId } from '@inzpro/domain/modules/identity/user'
import type { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import type { StreakLength } from '@inzpro/domain/modules/streak/streak'
import { Schema } from 'effect'
import type { EarnedBadge } from '~api/modules/learning-xp/domain/learning-reward.model.js'
import type { UserQualificationPath } from '~api/modules/preparation/domain/preparation.model.js'

export const ProfileSettings = Schema.Struct({
  name: Schema.String,
  privateProfile: Schema.Boolean,
})

export type ProfileSettings = typeof ProfileSettings.Type

export const UserProfile = Schema.Struct({
  ...ProfileSettings.fields,
  userId: UserId,
  image: Schema.OptionFromNullOr(Schema.String),
})

export type UserProfile = typeof UserProfile.Type

export type PublicProfile = {
  readonly profile: UserProfile
  readonly totalXp: LearningXp
  readonly badges: ReadonlyArray<EarnedBadge>
  readonly currentStreak: StreakLength
  readonly paths: ReadonlyArray<UserQualificationPath>
}
