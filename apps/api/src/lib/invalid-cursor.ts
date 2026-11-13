import { InvalidRequest } from '@inzpro/api-contracts/utils/api-error'
import { Effect } from 'effect'

/** Maps a cursor the API did not issue to HTTP 400; clients must pass cursors back unchanged. */
export const failInvalidCursor = () =>
  Effect.fail(
    new InvalidRequest({ type: 'invalid_request', message: 'Invalid pagination cursor.' }),
  )
