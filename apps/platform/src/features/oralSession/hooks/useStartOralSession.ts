import type { UserId } from '@inzpro/domain/modules/identity/user'
import { studyKeys } from '@inzpro/queries/modules/study'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Predicate } from 'effect'

import { startOralStudySession } from '../actions'

export const useStartOralSession = (userId: UserId) => {
  const client = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: startOralStudySession,
    onSuccess: async (session, req) => {
      await client.invalidateQueries({
        queryKey: studyKeys.oralProgress(userId, req.params.qualificationPathId),
      })
      // The session replaces the preview, so going back skips it and returns where the user came from.
      await navigate({
        to: '/ustny/sesja/$sessionId/$questionNumber',
        params: { sessionId: session.id, questionNumber: session.progress.currentQuestion },
        replace: true,
      })
    },
    // The preview is refreshed so it shows the current scope or the unfinished session to continue.
    onError: async (error, req) => {
      if (
        Predicate.isTagged(error, 'StaleSessionPreview') ||
        Predicate.isTagged(error, 'OralSessionAlreadyStarted')
      ) {
        await client.invalidateQueries({
          queryKey: studyKeys.oralProgress(userId, req.params.qualificationPathId),
        })
      }
    },
  })
}
