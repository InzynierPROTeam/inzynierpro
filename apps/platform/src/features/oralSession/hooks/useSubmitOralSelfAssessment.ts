import type { SubmitOralSelfAssessmentRequest } from '@inzpro/api-client/modules/oral-study'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import { learningXpKeys } from '@inzpro/queries/modules/learning-xp/keys'
import { oralStudyKeys } from '@inzpro/queries/modules/oral-study/keys'
import {
  oralSessionQueryOptions,
  oralSessionQuestionQueryOptions,
} from '@inzpro/queries/modules/oral-study/queries'
import { streakKeys } from '@inzpro/queries/modules/streak/keys'
import { toast } from '@inzpro/ui/components/toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Predicate } from 'effect'
import { apiHttpClient } from '~platform/lib/api-client'

import { submitOralStudySelfAssessment } from '../actions'

const sessionQueries = (userId: UserId, { params }: SubmitOralSelfAssessmentRequest) => ({
  question: oralSessionQuestionQueryOptions(apiHttpClient, userId, { params }),
  session: oralSessionQueryOptions(apiHttpClient, userId, {
    params: { qualificationPathId: params.qualificationPathId, sessionId: params.sessionId },
  }),
})

export const useSubmitOralSelfAssessment = (userId: UserId) => {
  const client = useQueryClient()

  return useMutation({
    mutationFn: submitOralStudySelfAssessment,
    onSuccess: (result, req) => {
      const { question, session } = sessionQueries(userId, req)

      client.setQueryData(question.queryKey, result.question)
      client.setQueryData(session.queryKey, result.session)
    },
    onError: async (error, req) => {
      const { question, session } = sessionQueries(userId, req)

      if (Predicate.isTagged(error, 'SessionQuestionWithdrawn')) {
        client.setQueryData(question.queryKey, current =>
          current === undefined || current === null
            ? current
            : { ...current, isWithdrawn: true, selfAssessment: null },
        )
      } else {
        toast.add({
          type: 'error',
          title: Predicate.isTagged(error, 'OralSelfAssessmentAlreadySubmitted')
            ? 'Samoocena tego pytania została już zapisana.'
            : 'Nie udało się zapisać samooceny. Spróbuj ponownie.',
        })
      }

      await Promise.all([client.invalidateQueries(question), client.invalidateQueries(session)])
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
