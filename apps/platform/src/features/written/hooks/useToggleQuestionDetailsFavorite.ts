import type { GetQuestionDetailsRequest } from '@inzpro/api-client/modules/written-study'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import { mockExamKeys } from '@inzpro/queries/modules/mock-exams/keys'
import { writtenStudyKeys } from '@inzpro/queries/modules/written-study/keys'
import { questionDetailsQueryOptions } from '@inzpro/queries/modules/written-study/queries'
import { toast } from '@inzpro/ui/components/toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { markFavorite, unmarkFavorite } from '~platform/features/favorites/actions'
import { apiHttpClient } from '~platform/lib/api-client'

export const useToggleQuestionDetailsFavorite = (
  userId: UserId,
  req: GetQuestionDetailsRequest,
) => {
  const client = useQueryClient()
  const details = questionDetailsQueryOptions(apiHttpClient, userId, req)

  const setFavorite = (isFavorite: boolean) =>
    client.setQueryData(details.queryKey, current =>
      current === undefined ? current : { ...current, isFavorite },
    )

  return useMutation({
    mutationFn: (isFavorite: boolean) =>
      isFavorite ? markFavorite({ params: req.params }) : unmarkFavorite({ params: req.params }),
    onMutate: async isFavorite => {
      await client.cancelQueries(details)
      setFavorite(isFavorite)
    },
    onSuccess: result => setFavorite(result.isFavorite),
    onError: async () => {
      toast.add({ type: 'error', title: 'Nie udało się zmienić ulubionych. Spróbuj ponownie.' })
      await client.invalidateQueries(details)
    },
    onSettled: () =>
      Promise.all([
        client.invalidateQueries({
          queryKey: mockExamKeys.reviewQuestions(userId),
          refetchType: 'none',
        }),
        client.invalidateQueries({
          queryKey: writtenStudyKeys.favorites(userId),
          refetchType: 'none',
        }),
        client.invalidateQueries({
          queryKey: writtenStudyKeys.questions(userId),
          refetchType: 'none',
        }),
      ]),
  })
}
