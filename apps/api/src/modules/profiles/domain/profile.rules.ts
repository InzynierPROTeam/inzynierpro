import type { UserId } from '@inzpro/domain/modules/identity/user'

import type { UserProfile } from './profile.model.js'

export const canViewProfile = (viewerId: UserId, profile: UserProfile) =>
  !profile.privateProfile || profile.userId === viewerId
