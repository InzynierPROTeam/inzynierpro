import {
  GoalConflict,
  InvalidPathConfiguration,
  PathAccessDenied,
  PathLimitReached,
} from '@inzpro/api-contracts/modules/preparation/errors'
import { maxUserQualificationPaths } from '@inzpro/domain/modules/preparation/config'
import { Effect } from 'effect'
import { logAndFailInternalServerError } from '~api/lib/internal-server-error.js'

export const failPreparationRead = logAndFailInternalServerError('Could not read preparation data.')

export const failPreparationWrite = logAndFailInternalServerError(
  'Could not save preparation data.',
)

export const pathAccessDenied = Effect.fail(
  new PathAccessDenied({
    type: 'path_access_denied',
    message: 'Your active path does not include this material.',
  }),
)

export const pathLimitReached = Effect.fail(
  new PathLimitReached({
    type: 'path_limit_reached',
    message: `You can have at most ${maxUserQualificationPaths} qualification paths, including archived paths.`,
  }),
)

export const invalidPathConfiguration = Effect.fail(
  new InvalidPathConfiguration({
    type: 'invalid_path_configuration',
    message: 'This configuration is unavailable. Review your choices.',
  }),
)

export const goalConflict = Effect.fail(
  new GoalConflict({
    type: 'goal_conflict',
    message: 'Your goal changed elsewhere. Reload before saving.',
  }),
)

export const districtChamberUnavailable = Effect.fail(
  new InvalidPathConfiguration({
    type: 'invalid_path_configuration',
    message: 'This district chamber is unavailable for the path.',
  }),
)
