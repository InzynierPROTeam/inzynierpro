import type { CompleteOnboardingRequest } from '@inzpro/api-client/modules/preparation'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import { oralStudyKeys } from '@inzpro/queries/modules/oral-study/keys'
import { preparationKeys } from '@inzpro/queries/modules/preparation/keys'
import { writtenStudyKeys } from '@inzpro/queries/modules/written-study/keys'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { selectedPathStore } from '~platform/features/examPaths/utils'

import { submitOnboarding } from '../actions'

type CompleteOnboardingInput = { userId: UserId; payload: CompleteOnboardingRequest['payload'] }

export const useCompleteOnboarding = () => {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: ({ payload }: CompleteOnboardingInput) => submitOnboarding({ payload }),
    onSuccess: async (receipt, { userId }) => {
      if (!receipt.archived) {
        selectedPathStore.set(userId, receipt.qualificationPathId)
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: preparationKeys.paths(userId) }),
        queryClient.invalidateQueries({
          queryKey: preparationKeys.path(userId, receipt.qualificationPathId),
        }),
        queryClient.invalidateQueries({
          queryKey: writtenStudyKeys.path(userId, receipt.qualificationPathId),
        }),
        queryClient.invalidateQueries({
          queryKey: oralStudyKeys.path(userId, receipt.qualificationPathId),
        }),
      ])
      await router.navigate({ to: receipt.archived ? '/profil' : '/start' })
    },
  })
}
