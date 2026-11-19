import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { Authentication } from '~api-contracts/middleware/authentication/api.js'
import { ProfileNotFound } from '~api-contracts/modules/profiles/errors.js'
import {
  InternalServerError,
  InvalidRequest,
  RateLimitExceeded,
} from '~api-contracts/utils/api-error.js'

import { PublicProfileParams, RenameProfilePayload, SetProfilePrivacyPayload } from './requests.js'
import { ProfileSettings, PublicProfile } from './responses.js'

export const GetProfileSettingsEndpoint = HttpApiEndpoint.get('GetProfileSettings', '/profile', {
  success: ProfileSettings,
  error: [InternalServerError, RateLimitExceeded, ProfileNotFound],
})

export const RenameProfileEndpoint = HttpApiEndpoint.put('RenameProfile', '/profile/name', {
  payload: RenameProfilePayload,
  success: ProfileSettings,
  error: [InternalServerError, RateLimitExceeded, InvalidRequest],
})

export const SetProfilePrivacyEndpoint = HttpApiEndpoint.put(
  'SetProfilePrivacy',
  '/profile/privacy',
  {
    payload: SetProfilePrivacyPayload,
    success: ProfileSettings,
    error: [InternalServerError, RateLimitExceeded, InvalidRequest],
  },
)

// CONTRACT: Another user's private profile fails with ProfileNotFound, like a missing user.
export const GetPublicProfileEndpoint = HttpApiEndpoint.get(
  'GetPublicProfile',
  '/users/:userId/profile',
  {
    params: PublicProfileParams,
    success: PublicProfile,
    error: [InternalServerError, RateLimitExceeded, InvalidRequest, ProfileNotFound],
  },
)

export const ProfilesApi = HttpApiGroup.make('Profiles')
  .add(GetProfileSettingsEndpoint)
  .add(RenameProfileEndpoint)
  .add(SetProfilePrivacyEndpoint)
  .add(GetPublicProfileEndpoint)
  .middleware(Authentication)
