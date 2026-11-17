import type { AttemptReviewQuestion } from '@inzpro/api-contracts/modules/mock-exams/responses'
import type { CursorPage } from '@inzpro/api-contracts/utils/pagination'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { WrittenQuestionId } from '@inzpro/domain/modules/learning-content/written-question'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { mockExamKeys } from '@inzpro/queries/modules/mock-exams/keys'
import { writtenStudyKeys } from '@inzpro/queries/modules/written-study/keys'
import { toast } from '@inzpro/ui/components/toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { markFavorite, unmarkFavorite } from '~platform/features/favorites/actions'

export const useToggleAttemptFavorite = (
  userId: UserId,
  qualificationPathId: QualificationPathId,
) => {
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({
      questionId,
      isFavorite,
    }: {
      questionId: WrittenQuestionId
      isFavorite: boolean
    }) =>
      isFavorite
        ? markFavorite({ params: { qualificationPathId, questionId } })
        : unmarkFavorite({ params: { qualificationPathId, questionId } }),
    onMutate: ({ questionId, isFavorite }) =>
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
                    question.questionId === questionId ? { ...question, isFavorite } : question,
                  ),
                })),
              },
      ),
    onError: () => {
      void client.invalidateQueries({ queryKey: mockExamKeys.reviewQuestions(userId) })
      toast.add({ type: 'error', title: 'Nie udało się zmienić ulubionych.' })
    },
    onSettled: () =>
      Promise.all([
        client.invalidateQueries({
          queryKey: writtenStudyKeys.questions(userId),
          refetchType: 'none',
        }),
        client.invalidateQueries({
          queryKey: writtenStudyKeys.favorites(userId),
          refetchType: 'none',
        }),
      ]),
  })
}
