import type {
  GetProfileSettingsRequest,
  GetPublicProfileRequest,
} from '@inzpro/api-client/modules/profiles'
import type { UserId } from '@inzpro/domain/modules/identity/user'

export const profileKeys = {
  all: ['profiles'] as const,
  account: (userId: UserId) => [...profileKeys.all, 'account', userId] as const,
  getProfileSettings: (userId: UserId, req: GetProfileSettingsRequest) =>
    [...profileKeys.account(userId), 'getProfileSettings', req] as const,
  getPublicProfile: (userId: UserId, req: GetPublicProfileRequest) =>
    [...profileKeys.account(userId), 'getPublicProfile', req] as const,
}
