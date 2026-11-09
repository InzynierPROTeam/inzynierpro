import { Schema } from 'effect'
import { SessionUser } from '~api-contracts/middleware/authentication/current-user.js'

export const CurrentSessionResponse = Schema.Struct({
  user: SessionUser,
})

export type CurrentSessionResponse = typeof CurrentSessionResponse.Type
