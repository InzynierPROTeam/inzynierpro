import type { UserId } from '@inzpro/domain/modules/identity/user'
import { Context, type Effect, type Option } from 'effect'

import type { UserProfile } from '../domain/profile.model.js'
import type { ProfileReadError } from './errors.js'

export class ProfileReader extends Context.Service<
  ProfileReader,
  {
    readonly profile: (
      userId: UserId,
    ) => Effect.Effect<Option.Option<UserProfile>, ProfileReadError>
  }
>()('api/modules/profiles/ProfileReader') {}
