import type { AnswerOralQuizCheckRequest } from '@inzpro/api-client/modules/oral-study'
import type { OralSessionQuizState } from '@inzpro/api-contracts/modules/oral-study/responses'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import { learningXpKeys } from '@inzpro/queries/modules/learning-xp/keys'
import { oralStudyKeys } from '@inzpro/queries/modules/oral-study/keys'
import {
  oralQuizChecksInfiniteQueryOptions,
  oralSessionQuizQueryOptions,
} from '@inzpro/queries/modules/oral-study/queries'
import { streakKeys } from '@inzpro/queries/modules/streak/keys'
import { toast } from '@inzpro/ui/components/toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Predicate } from 'effect'
import { checkOralQuizAnswer } from '~platform/features/oralSessionQuiz/actions'
import { apiHttpClient } from '~platform/lib/api-client'

const quizQueries = (userId: UserId, { params }: AnswerOralQuizCheckRequest) => {
  const sessionParams = {
    qualificationPathId: params.qualificationPathId,
    sessionId: params.sessionId,
  }

  return {
    quiz: oralSessionQuizQueryOptions(apiHttpClient, userId, { params: sessionParams }),
    checks: oralQuizChecksInfiniteQueryOptions(apiHttpClient, userId, {
      params: sessionParams,
      query: {},
    }),
  }
}

export const useAnswerOralQuizCheck = (userId: UserId) => {
  const client = useQueryClient()

  return useMutation({
    mutationFn: checkOralQuizAnswer,
    onSuccess: (result, req) => {
      const { quiz, checks } = quizQueries(userId, req)
      const state: OralSessionQuizState = { quiz: result.quiz, availableFormats: [] }

      client.setQueryData(quiz.queryKey, state)
      client.setQueryData(checks.queryKey, current =>
        current === undefined
          ? current
          : {
              ...current,
              pages: current.pages.map(page => ({
                ...page,
                data: page.data.map(check =>
                  check.position === result.check.position ? result.check : check,
                ),
              })),
            },
      )
    },
    onError: async (error, req) => {
      const { quiz, checks } = quizQueries(userId, req)

      toast.add({
        type: 'error',
        title: Predicate.isTagged(error, 'OralQuizCheckAlreadyAnswered')
          ? 'Odpowiedź na to pytanie została już sprawdzona.'
          : 'Nie udało się sprawdzić odpowiedzi. Spróbuj ponownie.',
      })
      await Promise.all([client.invalidateQueries(quiz), client.invalidateQueries(checks)])
    },
    onSettled: (_result, _error, { params }) =>
      Promise.all([
        client.invalidateQueries({
          queryKey: oralStudyKeys.oralProgress(userId, params.qualificationPathId),
        }),
        client.invalidateQueries({ queryKey: streakKeys.account(userId) }),
        client.invalidateQueries({ queryKey: learningXpKeys.account(userId) }),
      ]),
  })
}
