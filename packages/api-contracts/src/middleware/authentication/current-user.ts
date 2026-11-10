import { Email } from '@inzpro/domain/common/email'
import { UserId } from '@inzpro/domain/modules/identity/user'
import { Context, Schema } from 'effect'

export const SessionUser = Schema.Struct({
  id: UserId,
  email: Email,
  name: Schema.String,
})

export type SessionUser = typeof SessionUser.Type

// The signed-in user, provided to handlers behind the Authentication middleware.
export class CurrentUser extends Context.Service<CurrentUser, SessionUser>()(
  'api-contracts/middleware/authentication/CurrentUser',
) {}
