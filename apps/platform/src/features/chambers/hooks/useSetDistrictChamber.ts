import type { UserId } from '@inzpro/domain/modules/identity/user'
import { oralStudyKeys } from '@inzpro/queries/modules/oral-study/keys'
import { preparationKeys } from '@inzpro/queries/modules/preparation/keys'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'

import { updateDistrictChamber } from '../actions'

export const useSetDistrictChamber = (userId: UserId) => {
  const client = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: updateDistrictChamber,
    onSuccess: async receipt => {
      await Promise.all([
        client.invalidateQueries({ queryKey: preparationKeys.paths(userId) }),
        client.invalidateQueries({
          queryKey: preparationKeys.path(userId, receipt.qualificationPathId),
        }),
        client.invalidateQueries({
          queryKey: oralStudyKeys.path(userId, receipt.qualificationPathId),
        }),
      ])
      await router.invalidate()
    },
  })
}
