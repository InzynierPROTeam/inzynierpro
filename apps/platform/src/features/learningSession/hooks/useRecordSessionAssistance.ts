import type { RecordSessionAssistanceRequest } from '@inzpro/api-client/modules/study'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import { sessionQuestionQueryOptions } from '@inzpro/queries/modules/study'
import { getCurrentUtcIsoDateTime } from '@inzpro/utils/date'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiHttpClient } from '~platform/lib/api-client'

import { recordStudySessionAssistance } from '../actions'

/** Lets the answer form wait for a pending record, so the answer is stored as assisted. */
export const recordAssistanceMutationKey = ({ params }: RecordSessionAssistanceRequest) =>
  ['recordSessionAssistance', params] as const

/** Records that the hint was opened before answering; the backend marks the answer assisted from it. */
export const useRecordSessionAssistance = (userId: UserId, req: RecordSessionAssistanceRequest) => {
  const client = useQueryClient()
  const question = sessionQuestionQueryOptions(apiHttpClient, userId, { params: req.params })

  return useMutation({
    mutationKey: recordAssistanceMutationKey(req),
    mutationFn: () => recordStudySessionAssistance(req),
    onMutate: async () => {
      await client.cancelQueries(question)
      client.setQueryData(question.queryKey, current =>
        current === undefined || current === null || current.explanationOpenedAt !== null
          ? current
          : {
              ...current,
              explanationOpenedAt: getCurrentUtcIsoDateTime(),
            },
      )
    },
    onSuccess: result => {
      client.setQueryData(question.queryKey, result)
    },
    // The next opening of the hint sends the record again.
    onError: () => client.invalidateQueries(question),
  })
}
