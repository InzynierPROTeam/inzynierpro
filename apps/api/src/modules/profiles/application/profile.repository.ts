import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { ProfileName } from '@inzpro/domain/modules/profiles/profile'
import { Context, type Effect } from 'effect'

import type { ProfileSettings } from '../domain/profile.model.js'
import type { ProfileWriteError } from './errors.js'

export class ProfileRepository extends Context.Service<
  ProfileRepository,
  {
    readonly rename: (
      userId: UserId,
      name: ProfileName,
    ) => Effect.Effect<ProfileSettings, ProfileWriteError>
    readonly setPrivacy: (
      userId: UserId,
      privateProfile: boolean,
    ) => Effect.Effect<ProfileSettings, ProfileWriteError>
  }
>()('api/modules/profiles/ProfileRepository') {}
