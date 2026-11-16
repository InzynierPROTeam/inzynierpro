import type { UserId } from '@inzpro/domain/modules/identity/user'
import { studyKeys } from '@inzpro/queries/modules/study'
import { toast } from '@inzpro/ui/components/toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { endOralStudySession } from '../actions'

export const useEndOralSession = (userId: UserId) => {
  const client = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: endOralStudySession,
    onSuccess: async (session, req) => {
      await Promise.all([
        client.invalidateQueries({
          queryKey: studyKeys.oralProgress(userId, req.params.qualificationPathId),
        }),
        client.invalidateQueries({
          queryKey: studyKeys.oralSession(userId, req.params.qualificationPathId, session.id),
        }),
      ])
      // The summary replaces the question, so going back skips the ended session.
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
