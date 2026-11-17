import type { UserId } from '@inzpro/domain/modules/identity/user'
import { writtenStudyKeys } from '@inzpro/queries/modules/written-study/keys'
import { toast } from '@inzpro/ui/components/toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { endStudySession } from '../actions'

export const useEndSession = (userId: UserId) => {
  const client = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: endStudySession,
    onSuccess: async (session, req) => {
      await client.invalidateQueries({
        queryKey: writtenStudyKeys.path(userId, req.params.qualificationPathId),
      })
      await navigate({
        to: '/nauka/sesja/$sessionId/podsumowanie',
        params: { sessionId: session.id },
        replace: true,
      })
    },
    onError: () =>
      toast.add({ type: 'error', title: 'Nie udało się zakończyć sesji. Spróbuj ponownie.' }),
  })
}
