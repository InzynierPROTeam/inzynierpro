import {
  getProfileSettings,
  type GetProfileSettingsRequest,
  getPublicProfile,
  type GetPublicProfileRequest,
} from '@inzpro/api-client/modules/profiles'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { HttpClient } from 'effect/http'
import { effectQueryOptions } from '~queries/lib/effect-query-options.js'

import { profileKeys } from './keys.js'

export const profileSettingsQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetProfileSettingsRequest = {},
) =>
  effectQueryOptions(
    profileKeys.getProfileSettings(userId, req),
    getProfileSettings(req),
    httpClient,
  )

export const publicProfileQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetPublicProfileRequest,
) =>
  effectQueryOptions(profileKeys.getPublicProfile(userId, req), getPublicProfile(req), httpClient)
