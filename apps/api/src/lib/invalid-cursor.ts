import { InvalidRequest } from '@inzpro/api-contracts/utils/api-error'
import { Effect } from 'effect'

/** HTTP 400 for a cursor the API did not issue; clients must pass cursors back unchanged. */
export const invalidCursor = Effect.fail(
  new InvalidRequest({ type: 'invalid_request', message: 'Invalid pagination cursor.' }),
)
