import type { UserId } from '@inzpro/domain/modules/identity/user'
import { identityKeys } from '@inzpro/queries/modules/identity/keys'
import { profileKeys } from '@inzpro/queries/modules/profiles/keys'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'

import { renameUserProfile } from '../actions'

export const useRenameProfile = (userId: UserId) => {
  const client = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (name: string) => renameUserProfile({ payload: { name } }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: profileKeys.account(userId) }),
        client.invalidateQueries({ queryKey: identityKeys.session() }),
      ])

      await router.invalidate()
    },
  })
}
