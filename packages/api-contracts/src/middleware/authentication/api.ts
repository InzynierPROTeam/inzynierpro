import { HttpApiMiddleware } from 'effect/http-api'
import { CurrentUser } from '~api-contracts/middleware/authentication/current-user.js'
import { Unauthenticated } from '~api-contracts/middleware/authentication/errors.js'

export class Authentication extends HttpApiMiddleware.Service<
  Authentication,
  { provides: CurrentUser }
>()('api-contracts/middleware/authentication/Authentication', {
  error: Unauthenticated,
}) {}
