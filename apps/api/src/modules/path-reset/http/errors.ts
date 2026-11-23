import { PathResetConflict } from '@inzpro/api-contracts/modules/path-reset/errors'
import { Effect } from 'effect'

export const staleUserQualificationPath = Effect.fail(
  new PathResetConflict({
    type: 'path_reset_conflict',
    message: 'Your path changed elsewhere. Reload before resetting it.',
  }),
)
