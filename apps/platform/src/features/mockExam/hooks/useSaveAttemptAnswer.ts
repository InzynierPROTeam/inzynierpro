import type { SaveAttemptAnswerError } from '@inzpro/api-client/modules/mock-exams'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import { mockExamKeys } from '@inzpro/queries/modules/mock-exams/keys'
import { toast } from '@inzpro/ui/components/toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Predicate } from 'effect'

import { saveAnswer } from '../actions'

const saveAnswerErrorMessage = (error: SaveAttemptAnswerError | Error) => {
  if (Predicate.isTagged(error, 'AttemptQuestionConflict')) {
    return 'Odpowiedź na to pytanie zmieniono na innym urządzeniu. Sprawdź ją i zapisz ponownie.'
  }

  if (Predicate.isTagged(error, 'AttemptQuestionWithdrawn')) {
    return 'To pytanie zostało wycofane i nie można już na nie odpowiedzieć.'
  }

  if (Predicate.isTagged(error, 'MockExamAttemptNotInProgress')) {
    return 'To podejście nie jest już w toku.'
  }

  return 'Nie udało się zapisać odpowiedzi. Spróbuj ponownie.'
}

export const useSaveAttemptAnswer = (userId: UserId) => {
  const client = useQueryClient()

  return useMutation({
    mutationFn: saveAnswer,
    onError: error => toast.add({ type: 'error', title: saveAnswerErrorMessage(error) }),
    onSettled: (_result, _error, { params }) =>
      client.invalidateQueries({
        queryKey: mockExamKeys.attempt(userId, params.qualificationPathId, params.attemptId),
      }),
  })
}
