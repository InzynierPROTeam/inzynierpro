import type { UserId } from '@inzpro/domain/modules/identity/user'
import { learningXpKeys } from '@inzpro/queries/modules/learning-xp/keys'
import { oralStudyKeys } from '@inzpro/queries/modules/oral-study/keys'
import { toast } from '@inzpro/ui/components/toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { learningRewardToasts } from '~platform/features/learningXp/utils/rewards'

import { endOralStudySession } from '../actions'

export const useEndOralSession = (userId: UserId) => {
  const client = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: endOralStudySession,
    onSuccess: async ({ session, rewards }, req) => {
      learningRewardToasts(rewards).forEach(reward => toast.add(reward))
      await Promise.all([
        client.invalidateQueries({ queryKey: learningXpKeys.account(userId) }),
        client.invalidateQueries({
          queryKey: oralStudyKeys.oralProgress(userId, req.params.qualificationPathId),
        }),
        client.invalidateQueries({
          queryKey: oralStudyKeys.oralSession(userId, req.params.qualificationPathId, session.id),
        }),
      ])
      await navigate({
        to: '/ustny/sesja/$sessionId/podsumowanie',
        params: { sessionId: session.id },
        replace: true,
      })
    },
    onError: () =>
      toast.add({ type: 'error', title: 'Nie udało się zakończyć sesji. Spróbuj ponownie.' }),
  })
}
