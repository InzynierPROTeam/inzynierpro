import type { UserId } from '@inzpro/domain/modules/identity/user'
import { studyKeys } from '@inzpro/queries/modules/study'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Predicate } from 'effect'

import { startStudyOralReviewSession } from '../actions'

export const useStartOralReviewSession = (userId: UserId) => {
  const client = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: startStudyOralReviewSession,
    onSuccess: async (session, req) => {
      await client.invalidateQueries({
        queryKey: studyKeys.oralProgress(userId, req.params.qualificationPathId),
      })
      await navigate({
        to: '/ustny/sesja/$sessionId/$questionNumber',
        params: { sessionId: session.id, questionNumber: session.progress.currentQuestion },
        replace: true,
      })
    },
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
