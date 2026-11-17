import type { AttemptReviewQuestion } from '@inzpro/api-contracts/modules/mock-exams/responses'
import type { CursorPage } from '@inzpro/api-contracts/utils/pagination'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { WrittenQuestionId } from '@inzpro/domain/modules/learning-content/written-question'
import { QuestionNoteText } from '@inzpro/domain/modules/learning/question-note'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { mockExamKeys } from '@inzpro/queries/modules/mock-exams/keys'
import { writtenStudyKeys } from '@inzpro/queries/modules/written-study/keys'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { Schema } from 'effect'
import { clearNote, saveNote } from '~platform/features/questionNotes/actions'

export const useSaveAttemptNote = (userId: UserId, qualificationPathId: QualificationPathId) => {
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({ questionId, text }: { questionId: WrittenQuestionId; text: string }) => {
      const params = { qualificationPathId, questionId }
      const trimmed = text.trim()

      return Schema.is(QuestionNoteText)(trimmed)
        ? saveNote({ params, payload: { text: trimmed } })
        : clearNote({ params })
    },
    onSuccess: result =>
      client.setQueriesData<InfiniteData<CursorPage<AttemptReviewQuestion>>>(
        { queryKey: mockExamKeys.reviewQuestions(userId) },
        current =>
          current === undefined
            ? current
            : {
                ...current,
                pages: current.pages.map(page => ({
                  ...page,
                  data: page.data.map(question =>
                    question.questionId === result.questionId
                      ? { ...question, note: result.note }
                      : question,
                  ),
                })),
              },
      ),
    onSettled: () =>
      client.invalidateQueries({
        queryKey: writtenStudyKeys.questions(userId),
        refetchType: 'none',
      }),
  })
}
