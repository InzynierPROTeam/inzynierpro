import type { GetQuestionDetailsRequest } from '@inzpro/api-client/modules/written-study'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import { QuestionNoteText } from '@inzpro/domain/modules/learning/question-note'
import { mockExamKeys } from '@inzpro/queries/modules/mock-exams/keys'
import { writtenStudyKeys } from '@inzpro/queries/modules/written-study/keys'
import { questionDetailsQueryOptions } from '@inzpro/queries/modules/written-study/queries'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Schema } from 'effect'
import { clearNote, saveNote } from '~platform/features/questionNotes/actions'
import { apiHttpClient } from '~platform/lib/api-client'

export const useSaveQuestionDetailsNote = (userId: UserId, req: GetQuestionDetailsRequest) => {
  const client = useQueryClient()
  const details = questionDetailsQueryOptions(apiHttpClient, userId, req)

  return useMutation({
    mutationFn: (text: string) => {
      const trimmed = text.trim()

      return Schema.is(QuestionNoteText)(trimmed)
        ? saveNote({ params: req.params, payload: { text: trimmed } })
        : clearNote({ params: req.params })
    },
    onSuccess: async result => {
      await client.cancelQueries(details)
      client.setQueryData(details.queryKey, current =>
        current === undefined ? current : { ...current, note: result.note },
      )
    },
    onSettled: () =>
      Promise.all([
        client.invalidateQueries({
          queryKey: mockExamKeys.reviewQuestions(userId),
          refetchType: 'none',
        }),
        client.invalidateQueries({
          queryKey: writtenStudyKeys.questions(userId),
          refetchType: 'none',
        }),
      ]),
  })
}
