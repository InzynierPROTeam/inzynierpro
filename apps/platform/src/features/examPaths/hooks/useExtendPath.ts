import type { UserId } from '@inzpro/domain/modules/identity/user'
import { preparationKeys } from '@inzpro/queries/modules/preparation'
import { studyKeys } from '@inzpro/queries/modules/study'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'

import { extendQualificationPath } from '../actions'

export const useExtendPath = (userId: UserId) => {
  const client = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: extendQualificationPath,
    onSuccess: async receipt => {
      await Promise.all([
        client.invalidateQueries({ queryKey: preparationKeys.paths(userId) }),
        client.invalidateQueries({
          queryKey: preparationKeys.path(userId, receipt.qualificationPathId),
        }),
        client.invalidateQueries({ queryKey: studyKeys.path(userId, receipt.qualificationPathId) }),
      ])

      await router.invalidate()
    },
  })
}
