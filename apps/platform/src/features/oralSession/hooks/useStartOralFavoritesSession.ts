import type { UserId } from '@inzpro/domain/modules/identity/user'
import { studyKeys } from '@inzpro/queries/modules/study'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Predicate } from 'effect'

import { startStudyOralFavoritesSession } from '../actions'

export const useStartOralFavoritesSession = (userId: UserId) => {
  const client = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: startStudyOralFavoritesSession,
    onSuccess: async (session, req) => {
      await client.invalidateQueries({
        queryKey: studyKeys.path(userId, req.params.qualificationPathId),
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
        await Promise.all([
          client.invalidateQueries({
            queryKey: studyKeys.path(userId, req.params.qualificationPathId),
          }),
          client.invalidateQueries({
            queryKey: studyKeys.getOralFavoritesPreview(userId, {
              params: req.params,
            }),
          }),
        ])
      }
    },
  })
}
