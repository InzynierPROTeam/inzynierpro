import type { GetOralSessionQuestionRequest } from '@inzpro/api-client/modules/oral-study'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { OralQuestionId } from '@inzpro/domain/modules/learning-content/oral-question'
import { oralStudyKeys } from '@inzpro/queries/modules/oral-study/keys'
import { oralSessionQuestionQueryOptions } from '@inzpro/queries/modules/oral-study/queries'
import { toast } from '@inzpro/ui/components/toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { markOralFavorite, unmarkOralFavorite } from '~platform/features/oralFavorites/actions'
import { apiHttpClient } from '~platform/lib/api-client'

export const useToggleOralFavorite = (userId: UserId, req: GetOralSessionQuestionRequest) => {
  const client = useQueryClient()
  const question = oralSessionQuestionQueryOptions(apiHttpClient, userId, req)

  const setFavorite = (isFavorite: boolean) =>
    client.setQueryData(question.queryKey, current =>
      current === undefined || current === null ? current : { ...current, isFavorite },
    )

  return useMutation({
    mutationFn: ({
      questionId,
      isFavorite,
    }: {
      questionId: OralQuestionId
      isFavorite: boolean
    }) => {
      const favoriteReq = {
        params: { qualificationPathId: req.params.qualificationPathId, questionId },
      }

      return isFavorite ? markOralFavorite(favoriteReq) : unmarkOralFavorite(favoriteReq)
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
    onSettled: () =>
      Promise.all([
        client.invalidateQueries({
          queryKey: oralStudyKeys.oralFavorites(userId),
          refetchType: 'none',
        }),
        client.invalidateQueries({
          queryKey: oralStudyKeys.oralQuestions(userId),
          refetchType: 'none',
        }),
      ]),
  })
}
