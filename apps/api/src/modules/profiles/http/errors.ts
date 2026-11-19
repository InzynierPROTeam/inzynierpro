import { ProfileNotFound } from '@inzpro/api-contracts/modules/profiles/errors'
import { InvalidRequest } from '@inzpro/api-contracts/utils/api-error'
import { profileNameMaxLength } from '@inzpro/domain/modules/profiles/profile'
import { Effect } from 'effect'
import { logAndFailInternalServerError } from '~api/lib/internal-server-error.js'

export const failProfileRead = logAndFailInternalServerError('Could not read the profile.')

export const failProfileWrite = logAndFailInternalServerError('Could not save the profile.')

export const profileNotFound = Effect.fail(
  new ProfileNotFound({ type: 'profile_not_found', message: 'The profile was not found.' }),
)

export const invalidProfileName = Effect.fail(
  new InvalidRequest({
    type: 'invalid_request',
    message: `The profile name must have 1 to ${profileNameMaxLength} characters after trimming.`,
  }),
)
