import { InvalidRequest } from '@inzpro/api-contracts/utils/api-error'
import { Effect } from 'effect'

export const invalidCursor = Effect.fail(
  new InvalidRequest({ type: 'invalid_request', message: 'Invalid pagination cursor.' }),
)
