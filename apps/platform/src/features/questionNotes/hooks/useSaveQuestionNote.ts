import type { GetSessionQuestionRequest } from '@inzpro/api-client/modules/study'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { WrittenQuestionId } from '@inzpro/domain/modules/learning-content/written-question'
import { QuestionNoteText } from '@inzpro/domain/modules/study/question-note'
import { sessionQuestionQueryOptions, studyKeys } from '@inzpro/queries/modules/study'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Schema } from 'effect'
import { apiHttpClient } from '~platform/lib/api-client'

import { clearNote, saveNote } from '../actions'

export const useSaveQuestionNote = (userId: UserId, req: GetSessionQuestionRequest) => {
  const client = useQueryClient()
  const question = sessionQuestionQueryOptions(apiHttpClient, userId, req)

  return useMutation({
    mutationFn: ({ questionId, text }: { questionId: WrittenQuestionId; text: string }) => {
      const params = { qualificationPathId: req.params.qualificationPathId, questionId }
      const trimmed = text.trim()

      return Schema.is(QuestionNoteText)(trimmed)
        ? saveNote({ params, payload: { text: trimmed } })
        : clearNote({ params })
    },
    onSuccess: async result => {
      await client.cancelQueries(question)
      client.setQueryData(question.queryKey, current =>
        current === undefined || current === null ? current : { ...current, note: result.note },
      )
    },
    onSettled: () =>
      client.invalidateQueries({ queryKey: studyKeys.questions(userId), refetchType: 'none' }),
  })
}
