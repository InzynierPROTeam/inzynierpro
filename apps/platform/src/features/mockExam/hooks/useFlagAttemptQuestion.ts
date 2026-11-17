import type { FlagAttemptQuestionError } from '@inzpro/api-client/modules/mock-exams'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import { mockExamKeys } from '@inzpro/queries/modules/mock-exams/keys'
import { toast } from '@inzpro/ui/components/toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Predicate } from 'effect'

import { flagQuestion } from '../actions'

const flagErrorMessage = (error: FlagAttemptQuestionError | Error) => {
  if (Predicate.isTagged(error, 'AttemptQuestionConflict')) {
    return 'To pytanie zmieniono na innym urządzeniu. Sprawdź je i spróbuj ponownie.'
  }

  if (Predicate.isTagged(error, 'MockExamAttemptNotInProgress')) {
    return 'To podejście nie jest już w toku.'
  }

  return 'Nie udało się oznaczyć pytania. Spróbuj ponownie.'
}

export const useFlagAttemptQuestion = (userId: UserId) => {
  const client = useQueryClient()

  return useMutation({
    mutationFn: flagQuestion,
    onSuccess: question =>
      toast.add({
        type: 'success',
        title: question.isFlagged
          ? `Pytanie ${question.position} oznaczono do powrotu.`
          : `Usunięto oznaczenie z pytania ${question.position}.`,
      }),
    onError: error => toast.add({ type: 'error', title: flagErrorMessage(error) }),
    onSettled: (_result, _error, { params }) =>
      client.invalidateQueries({
        queryKey: mockExamKeys.attempt(userId, params.qualificationPathId, params.attemptId),
      }),
  })
}
