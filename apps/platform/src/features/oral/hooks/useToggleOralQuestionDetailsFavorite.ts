import type { GetOralQuestionDetailsRequest } from '@inzpro/api-client/modules/oral-study'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import { oralStudyKeys } from '@inzpro/queries/modules/oral-study/keys'
import { oralQuestionDetailsQueryOptions } from '@inzpro/queries/modules/oral-study/queries'
import { toast } from '@inzpro/ui/components/toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { markOralFavorite, unmarkOralFavorite } from '~platform/features/oralFavorites/actions'
import { apiHttpClient } from '~platform/lib/api-client'

export const useToggleOralQuestionDetailsFavorite = (
  userId: UserId,
  req: GetOralQuestionDetailsRequest,
) => {
  const client = useQueryClient()
  const details = oralQuestionDetailsQueryOptions(apiHttpClient, userId, req)

  const setFavorite = (isFavorite: boolean) =>
    client.setQueryData(details.queryKey, current =>
      current === undefined ? current : { ...current, isFavorite },
    )

  return useMutation({
    mutationFn: (isFavorite: boolean) =>
      isFavorite
        ? markOralFavorite({ params: req.params })
        : unmarkOralFavorite({ params: req.params }),
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
