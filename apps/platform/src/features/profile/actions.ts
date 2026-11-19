import { runApi } from '@inzpro/api-client/lib/run-api'
import {
  renameProfile,
  type RenameProfileRequest,
  setProfilePrivacy,
  type SetProfilePrivacyRequest,
} from '@inzpro/api-client/modules/profiles'
import { apiHttpClient } from '~platform/lib/api-client'

export const renameUserProfile = (req: RenameProfileRequest) =>
  runApi(renameProfile(req), apiHttpClient)

export const setUserProfilePrivacy = (req: SetProfilePrivacyRequest) =>
  runApi(setProfilePrivacy(req), apiHttpClient)
