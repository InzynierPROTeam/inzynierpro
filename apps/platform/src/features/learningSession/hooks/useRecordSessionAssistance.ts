import type { RecordSessionAssistanceRequest } from '@inzpro/api-client/modules/study'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import {
  explanationAssistanceKind,
  type SessionAssistanceKind,
} from '@inzpro/domain/modules/study/study-session'
import { sessionQuestionQueryOptions } from '@inzpro/queries/modules/study'
import { getCurrentUtcIsoDateTime } from '@inzpro/utils/date'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiHttpClient } from '~platform/lib/api-client'

import { recordStudySessionAssistance } from '../actions'

export const recordAssistanceMutationKey = ({
  params,
}: Pick<RecordSessionAssistanceRequest, 'params'>) => ['recordSessionAssistance', params] as const

const openedAtField = (kind: SessionAssistanceKind) =>
  kind === explanationAssistanceKind ? 'explanationOpenedAt' : 'noteOpenedAt'

export const useRecordSessionAssistance = (userId: UserId, req: RecordSessionAssistanceRequest) => {
  const client = useQueryClient()
  const question = sessionQuestionQueryOptions(apiHttpClient, userId, { params: req.params })
  const field = openedAtField(req.payload.kind)

  return useMutation({
    mutationKey: recordAssistanceMutationKey(req),
    mutationFn: () => recordStudySessionAssistance(req),
    onMutate: async () => {
      await client.cancelQueries(question)
      client.setQueryData(question.queryKey, current =>
        current === undefined || current === null || current[field] !== null
          ? current
          : { ...current, [field]: getCurrentUtcIsoDateTime() },
      )
    },
    onSuccess: result => {
      client.setQueryData(question.queryKey, result)
    },
    onError: () => client.invalidateQueries(question),
  })
}
