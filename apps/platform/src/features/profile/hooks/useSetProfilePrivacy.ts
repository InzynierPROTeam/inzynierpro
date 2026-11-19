import type { UserId } from '@inzpro/domain/modules/identity/user'
import { profileSettingsQueryOptions } from '@inzpro/queries/modules/profiles/queries'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiHttpClient } from '~platform/lib/api-client'

import { setUserProfilePrivacy } from '../actions'

export const useSetProfilePrivacy = (userId: UserId) => {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (privateProfile: boolean) => setUserProfilePrivacy({ payload: { privateProfile } }),
    onSuccess: settings =>
      client.setQueryData(profileSettingsQueryOptions(apiHttpClient, userId).queryKey, settings),
  })
}
