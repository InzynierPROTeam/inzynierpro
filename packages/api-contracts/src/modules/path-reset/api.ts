import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { Authentication } from '~api-contracts/middleware/authentication/api.js'
import { PathResetConflict } from '~api-contracts/modules/path-reset/errors.js'
import { PathAccessDenied } from '~api-contracts/modules/preparation/errors.js'
import { PathParams } from '~api-contracts/modules/preparation/requests.js'
import { InternalServerError, RateLimitExceeded } from '~api-contracts/utils/api-error.js'

import { ResetPathPayload } from './requests.js'
import { PathResetResponse } from './responses.js'

export const ResetPathEndpoint = HttpApiEndpoint.post('ResetPath', '/paths/:qualificationPathId', {
  params: PathParams,
  payload: ResetPathPayload,
  success: PathResetResponse,
  error: [InternalServerError, RateLimitExceeded, PathAccessDenied, PathResetConflict],
})

export const PathResetApi = HttpApiGroup.make('PathReset')
  .add(ResetPathEndpoint)
  .middleware(Authentication)
  .prefix('/path-reset')
