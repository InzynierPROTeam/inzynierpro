import type { UserId } from '@inzpro/domain/modules/identity/user'
import { preparationKeys } from '@inzpro/queries/modules/preparation'
import { studyKeys } from '@inzpro/queries/modules/study'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'

import { restoreQualificationPath } from '../actions'
import { selectedPathStore } from '../utils'

export const useRestorePath = (userId: UserId) => {
  const client = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: restoreQualificationPath,
    onSuccess: async receipt => {
      await Promise.all([
        client.invalidateQueries({ queryKey: preparationKeys.paths(userId) }),
        client.invalidateQueries({
          queryKey: preparationKeys.path(userId, receipt.qualificationPathId),
        }),
        client.invalidateQueries({ queryKey: studyKeys.path(userId, receipt.qualificationPathId) }),
      ])
      selectedPathStore.set(userId, receipt.qualificationPathId)
      await router.invalidate()
    },
  })
}
