import type { UserId } from '@inzpro/domain/modules/identity/user'
import { mockExamKeys } from '@inzpro/queries/modules/mock-exams/keys'
import { oralStudyKeys } from '@inzpro/queries/modules/oral-study/keys'
import { preparationKeys } from '@inzpro/queries/modules/preparation/keys'
import { writtenStudyKeys } from '@inzpro/queries/modules/written-study/keys'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'

import { resetQualificationPath } from '../actions'

export const useResetPath = (userId: UserId) => {
  const client = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: resetQualificationPath,
    onSettled: async (_receipt, _error, { params }) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: preparationKeys.paths(userId) }),
        client.invalidateQueries({
          queryKey: preparationKeys.path(userId, params.qualificationPathId),
        }),
        client.invalidateQueries({
          queryKey: writtenStudyKeys.path(userId, params.qualificationPathId),
        }),
        client.invalidateQueries({
          queryKey: oralStudyKeys.path(userId, params.qualificationPathId),
        }),
        client.invalidateQueries({
          queryKey: mockExamKeys.path(userId, params.qualificationPathId),
        }),
      ])

      await router.invalidate()
    },
  })
}
