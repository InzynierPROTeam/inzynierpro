import type { GetOralSessionQuestionRequest } from '@inzpro/api-client/modules/oral-study'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { OralQuestionId } from '@inzpro/domain/modules/learning-content/oral-question'
import { QuestionNoteText } from '@inzpro/domain/modules/learning/question-note'
import { oralStudyKeys } from '@inzpro/queries/modules/oral-study/keys'
import { oralSessionQuestionQueryOptions } from '@inzpro/queries/modules/oral-study/queries'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Schema } from 'effect'
import { clearOralNote, saveOralNote } from '~platform/features/oralQuestionNotes/actions'
import { apiHttpClient } from '~platform/lib/api-client'

export const useSaveOralQuestionNote = (userId: UserId, req: GetOralSessionQuestionRequest) => {
  const client = useQueryClient()
  const question = oralSessionQuestionQueryOptions(apiHttpClient, userId, req)

  return useMutation({
    mutationFn: ({ questionId, text }: { questionId: OralQuestionId; text: string }) => {
      const params = { qualificationPathId: req.params.qualificationPathId, questionId }
      const trimmed = text.trim()

      return Schema.is(QuestionNoteText)(trimmed)
        ? saveOralNote({ params, payload: { text: trimmed } })
        : clearOralNote({ params })
    },
    onSuccess: async result => {
      await client.cancelQueries(question)
      client.setQueryData(question.queryKey, current =>
        current === undefined || current === null ? current : { ...current, note: result.note },
      )
    },
    onSettled: () =>
      client.invalidateQueries({
        queryKey: oralStudyKeys.oralQuestions(userId),
        refetchType: 'none',
      }),
  })
}
