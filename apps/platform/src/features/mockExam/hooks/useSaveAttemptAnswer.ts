import type { GetMockExamAttemptRequest } from '@inzpro/api-client/modules/mock-exams'
import type { SaveAttemptAnswerError } from '@inzpro/api-client/modules/mock-exams'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import {
  mockExamAttemptQueryOptions,
  attemptQuestionQueryOptions,
} from '@inzpro/queries/modules/mock-exams/queries'
import { toast } from '@inzpro/ui/components/toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Predicate } from 'effect'
import { apiHttpClient } from '~platform/lib/api-client'

import { saveAnswer } from '../actions'

const saveAnswerErrorMessage = (error: SaveAttemptAnswerError | Error) => {
  if (Predicate.isTagged(error, 'MockExamAttemptPaused')) {
    return 'Egzamin jest wstrzymany. Wznów go, aby zmieniać odpowiedzi.'
  }

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

export const useSaveAttemptAnswer = (
  userId: UserId,
  attemptParams: GetMockExamAttemptRequest['params'],
) => {
  const client = useQueryClient()

  const attempt = mockExamAttemptQueryOptions(apiHttpClient, userId, { params: attemptParams })

  return useMutation({
    mutationFn: saveAnswer,
    onMutate: async req => {
      const question = attemptQuestionQueryOptions(apiHttpClient, userId, { params: req.params })
      await Promise.all([client.cancelQueries(attempt), client.cancelQueries(question)])
      client.setQueryData(question.queryKey, current =>
        current === undefined || current === null
          ? current
          : { ...current, selectedAnswerId: req.payload.answerId },
      )
      client.setQueryData(attempt.queryKey, current =>
        current === undefined || current === null
          ? current
          : {
              ...current,
              questions: current.questions.map(question =>
                question.position === req.params.position
                  ? { ...question, isAnswered: true }
                  : question,
              ),
            },
      )
    },
    onSuccess: (question, req) => {
      client.setQueryData(
        attemptQuestionQueryOptions(apiHttpClient, userId, { params: req.params }).queryKey,
        question,
      )
    },
    onError: error => toast.add({ type: 'error', title: saveAnswerErrorMessage(error) }),
    onSettled: (_result, error, req) =>
      Predicate.isTagged(error, 'MockExamAttemptPaused')
        ? client.invalidateQueries(attempt)
        : Promise.all([
            client.invalidateQueries(attempt),
            client.invalidateQueries(
              attemptQuestionQueryOptions(apiHttpClient, userId, { params: req.params }),
            ),
          ]),
  })
}
