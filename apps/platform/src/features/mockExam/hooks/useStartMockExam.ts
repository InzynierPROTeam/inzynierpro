import type { UserId } from '@inzpro/domain/modules/identity/user'
import { AttemptQuestionPosition } from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { mockExamKeys } from '@inzpro/queries/modules/mock-exams/keys'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { startAttempt } from '../actions'

export const useStartMockExam = (userId: UserId) => {
  const client = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: startAttempt,
    onSuccess: async (attempt, req) => {
      await client.invalidateQueries({
        queryKey: mockExamKeys.path(userId, req.params.qualificationPathId),
        refetchType: 'none',
      })
      client.setQueryData(
        mockExamKeys.getMockExamAttempt(userId, {
          params: { ...req.params, attemptId: attempt.id },
        }),
        attempt,
      )
      await navigate({
        to: '/egzamin-probny/podejscie/$attemptId/$questionNumber',
        params: { attemptId: attempt.id, questionNumber: AttemptQuestionPosition.make(1) },
        replace: true,
      })
    },
    onError: async (_, req) => {
      await client.invalidateQueries({
        queryKey: mockExamKeys.path(userId, req.params.qualificationPathId),
        refetchType: 'none',
      })
    },
  })
}
