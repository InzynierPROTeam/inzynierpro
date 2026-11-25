import type { GetOralQuestionDetailsRequest } from '@inzpro/api-client/modules/oral-study'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import { QuestionNoteText } from '@inzpro/domain/modules/learning/question-note'
import { oralStudyKeys } from '@inzpro/queries/modules/oral-study/keys'
import { oralQuestionDetailsQueryOptions } from '@inzpro/queries/modules/oral-study/queries'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Schema } from 'effect'
import { clearOralNote, saveOralNote } from '~platform/features/oralQuestionNotes/actions'
import { apiHttpClient } from '~platform/lib/api-client'

export const useSaveOralQuestionDetailsNote = (
  userId: UserId,
  req: GetOralQuestionDetailsRequest,
) => {
  const client = useQueryClient()
  const details = oralQuestionDetailsQueryOptions(apiHttpClient, userId, req)

  return useMutation({
    mutationFn: (text: string) => {
      const trimmed = text.trim()

      return Schema.is(QuestionNoteText)(trimmed)
        ? saveOralNote({ params: req.params, payload: { text: trimmed } })
        : clearOralNote({ params: req.params })
    },
    onSuccess: async result => {
      await client.cancelQueries(details)
      client.setQueryData(details.queryKey, current =>
        current === undefined ? current : { ...current, note: result.note },
      )
    },
    onSettled: () =>
      client.invalidateQueries({
        queryKey: oralStudyKeys.oralQuestions(userId),
        refetchType: 'none',
      }),
  })
}
