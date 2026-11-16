import type { UserId } from '@inzpro/domain/modules/identity/user'
import { studyKeys } from '@inzpro/queries/modules/study'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Predicate } from 'effect'

import { startStudyReviewSession } from '../actions'

export const useStartReviewSession = (userId: UserId) => {
  const client = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: startStudyReviewSession,
    onSuccess: async (session, req) => {
      await client.invalidateQueries({
        queryKey: studyKeys.path(userId, req.params.qualificationPathId),
      })
      // The session replaces the preview, so going back skips it and returns where the user came from.
      await navigate({
        to: '/nauka/sesja/$sessionId/$questionNumber',
        params: { sessionId: session.id, questionNumber: session.progress.currentQuestion },
        replace: true,
      })
    },
    // The preview is refreshed so it shows the questions due now or the unfinished session to continue.
    onError: async (error, req) => {
      if (
        Predicate.isTagged(error, 'StaleSessionPreview') ||
        Predicate.isTagged(error, 'StudySessionAlreadyStarted')
      ) {
        await client.invalidateQueries({
          queryKey: studyKeys.path(userId, req.params.qualificationPathId),
        })
      }
    },
  })
}
