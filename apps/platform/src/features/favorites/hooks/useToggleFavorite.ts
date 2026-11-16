import type { GetSessionQuestionRequest } from '@inzpro/api-client/modules/study'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { WrittenQuestionId } from '@inzpro/domain/modules/learning-content/written-question'
import { sessionQuestionQueryOptions, studyKeys } from '@inzpro/queries/modules/study'
import { toast } from '@inzpro/ui/components/toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiHttpClient } from '~platform/lib/api-client'

import { markFavorite, unmarkFavorite } from '../actions'

export const useToggleFavorite = (userId: UserId, req: GetSessionQuestionRequest) => {
  const client = useQueryClient()
  const question = sessionQuestionQueryOptions(apiHttpClient, userId, req)

  const setFavorite = (isFavorite: boolean) =>
    client.setQueryData(question.queryKey, current =>
      current === undefined || current === null ? current : { ...current, isFavorite },
    )

  return useMutation({
    mutationFn: ({
      questionId,
      isFavorite,
    }: {
      questionId: WrittenQuestionId
      isFavorite: boolean
    }) => {
      const favoriteReq = {
        params: { qualificationPathId: req.params.qualificationPathId, questionId },
      }

      return isFavorite ? markFavorite(favoriteReq) : unmarkFavorite(favoriteReq)
    },
    onMutate: async ({ isFavorite }) => {
      await client.cancelQueries(question)
      setFavorite(isFavorite)
    },
    onSuccess: result => setFavorite(result.isFavorite),
    onError: async () => {
      toast.add({ type: 'error', title: 'Nie udało się zmienić ulubionych. Spróbuj ponownie.' })
      await client.invalidateQueries(question)
    },
    // Other sessions share the mark; refresh their copies when next shown.
    onSettled: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: studyKeys.favorites(userId), refetchType: 'none' }),
        client.invalidateQueries({ queryKey: studyKeys.questions(userId), refetchType: 'none' }),
      ]),
  })
}
