import type { UserId } from '@inzpro/domain/modules/identity/user'
import { studyKeys } from '@inzpro/queries/modules/study'
import { toast } from '@inzpro/ui/components/toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { endStudySession } from '../actions'

/**
 * Ends the session and opens its summary (V1's `useTerminateSession`; V2 says "end" as the
 * session's `endedAt` and ADR-0002 do). The ended session accepts no more answers.
 */
export const useEndSession = (userId: UserId) => {
  const client = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: endStudySession,
    onSuccess: async (session, req) => {
      // The session's own reads and the path's progress tiles all show it ended.
      await client.invalidateQueries({
        queryKey: studyKeys.path(userId, req.params.qualificationPathId),
      })
      // The summary replaces the question, so going back skips the ended session.
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
