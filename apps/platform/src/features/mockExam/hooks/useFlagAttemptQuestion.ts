import type { GetMockExamAttemptRequest } from '@inzpro/api-client/modules/mock-exams'
import type { FlagAttemptQuestionError } from '@inzpro/api-client/modules/mock-exams'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import {
  mockExamAttemptQueryOptions,
  attemptQuestionQueryOptions,
} from '@inzpro/queries/modules/mock-exams/queries'
import { toast } from '@inzpro/ui/components/toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Predicate } from 'effect'
import { apiHttpClient } from '~platform/lib/api-client'

import { flagQuestion } from '../actions'

const flagErrorMessage = (error: FlagAttemptQuestionError | Error) => {
  if (Predicate.isTagged(error, 'MockExamAttemptPaused')) {
    return 'Egzamin jest wstrzymany. Wznów go, aby zmieniać odpowiedzi.'
  }

  if (Predicate.isTagged(error, 'AttemptQuestionConflict')) {
    return 'To pytanie zmieniono na innym urządzeniu. Sprawdź je i spróbuj ponownie.'
  }

  if (Predicate.isTagged(error, 'MockExamAttemptNotInProgress')) {
    return 'To podejście nie jest już w toku.'
  }

  return 'Nie udało się oznaczyć pytania. Spróbuj ponownie.'
}

export const useFlagAttemptQuestion = (
  userId: UserId,
  attemptParams: GetMockExamAttemptRequest['params'],
) => {
  const client = useQueryClient()

  const attempt = mockExamAttemptQueryOptions(apiHttpClient, userId, { params: attemptParams })

  return useMutation({
    mutationFn: flagQuestion,
    onMutate: async req => {
      const question = attemptQuestionQueryOptions(apiHttpClient, userId, { params: req.params })
      await Promise.all([client.cancelQueries(attempt), client.cancelQueries(question)])
      client.setQueryData(question.queryKey, current =>
        current === undefined || current === null
          ? current
          : { ...current, isFlagged: req.payload.isFlagged },
      )
      client.setQueryData(attempt.queryKey, current =>
        current === undefined || current === null
          ? current
          : {
              ...current,
              questions: current.questions.map(question =>
                question.position === req.params.position
                  ? { ...question, isFlagged: req.payload.isFlagged }
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
      toast.add({
        type: 'success',
        title: question.isFlagged
          ? `Pytanie ${question.position} oznaczono do powrotu.`
          : `Usunięto oznaczenie z pytania ${question.position}.`,
      })
    },
    onError: error => toast.add({ type: 'error', title: flagErrorMessage(error) }),
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
