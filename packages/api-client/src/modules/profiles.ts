import type {
  GetProfileSettingsEndpoint,
  GetPublicProfileEndpoint,
  RenameProfileEndpoint,
  SetProfilePrivacyEndpoint,
} from '@inzpro/api-contracts/modules/profiles/api'
import type { Effect } from 'effect'
import { apiAction } from '~api-client/lib/api-action.js'
import type { InferEndpointRequest } from '~api-client/lib/types.js'

export const getProfileSettings = (req: GetProfileSettingsRequest = {}) =>
  apiAction(api => api.Profiles.GetProfileSettings(req))

export type GetProfileSettingsRequest = InferEndpointRequest<typeof GetProfileSettingsEndpoint>

export type GetProfileSettingsRes = Effect.Success<ReturnType<typeof getProfileSettings>>

export type GetProfileSettingsError = Effect.Error<ReturnType<typeof getProfileSettings>>

export const renameProfile = (req: RenameProfileRequest) =>
  apiAction(api => api.Profiles.RenameProfile(req))

export type RenameProfileRequest = InferEndpointRequest<typeof RenameProfileEndpoint>

export type RenameProfileRes = Effect.Success<ReturnType<typeof renameProfile>>

export type RenameProfileError = Effect.Error<ReturnType<typeof renameProfile>>

export const setProfilePrivacy = (req: SetProfilePrivacyRequest) =>
  apiAction(api => api.Profiles.SetProfilePrivacy(req))

export type SetProfilePrivacyRequest = InferEndpointRequest<typeof SetProfilePrivacyEndpoint>

export type SetProfilePrivacyRes = Effect.Success<ReturnType<typeof setProfilePrivacy>>

export type SetProfilePrivacyError = Effect.Error<ReturnType<typeof setProfilePrivacy>>

export const getPublicProfile = (req: GetPublicProfileRequest) =>
  apiAction(api => api.Profiles.GetPublicProfile(req))

export type GetPublicProfileRequest = InferEndpointRequest<typeof GetPublicProfileEndpoint>

export type GetPublicProfileRes = Effect.Success<ReturnType<typeof getPublicProfile>>

export type GetPublicProfileError = Effect.Error<ReturnType<typeof getPublicProfile>>
