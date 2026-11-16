import type { UserId } from '@inzpro/domain/modules/identity/user'
import { studyKeys } from '@inzpro/queries/modules/study'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Predicate } from 'effect'

import { startStudySession } from '../actions'

export const useStartSession = (userId: UserId) => {
  const client = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: startStudySession,
    onSuccess: async (session, req) => {
      await client.invalidateQueries({
        queryKey: studyKeys.path(userId, req.params.qualificationPathId),
      })
      await navigate({
        to: '/nauka/sesja/$sessionId/$questionNumber',
        params: { sessionId: session.id, questionNumber: session.progress.currentQuestion },
        replace: true,
      })
    },
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
