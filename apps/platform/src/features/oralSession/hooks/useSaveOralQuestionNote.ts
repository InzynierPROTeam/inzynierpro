import type { GetOralSessionQuestionRequest } from '@inzpro/api-client/modules/study'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { OralQuestionId } from '@inzpro/domain/modules/learning-content/oral-question'
import { QuestionNoteText } from '@inzpro/domain/modules/study/question-note'
import { oralSessionQuestionQueryOptions, studyKeys } from '@inzpro/queries/modules/study'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Schema } from 'effect'
import { apiHttpClient } from '~platform/lib/api-client'

import { clearOralNote, saveOralNote } from '../actions'

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
      client.invalidateQueries({ queryKey: studyKeys.oralQuestions(userId), refetchType: 'none' }),
  })
}
