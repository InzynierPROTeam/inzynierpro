import type { StartOralSessionQuizRequest } from '@inzpro/api-client/modules/oral-study'
import type { OralSessionQuizState } from '@inzpro/api-contracts/modules/oral-study/responses'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import { oralSessionQuizQueryOptions } from '@inzpro/queries/modules/oral-study/queries'
import { toast } from '@inzpro/ui/components/toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Predicate } from 'effect'
import { startOralQuiz } from '~platform/features/oralSessionQuiz/actions'
import { apiHttpClient } from '~platform/lib/api-client'

const quizQuery = (userId: UserId, { params }: StartOralSessionQuizRequest) =>
  oralSessionQuizQueryOptions(apiHttpClient, userId, { params })

export const useStartOralSessionQuiz = (userId: UserId) => {
  const client = useQueryClient()

  return useMutation({
    mutationFn: startOralQuiz,
    onSuccess: (quiz, req) => {
      const state: OralSessionQuizState = { quiz, availableFormats: [] }

      client.setQueryData(quizQuery(userId, req).queryKey, state)
    },
    onError: async (error, req) => {
      toast.add({
        type: 'error',
        title: Predicate.isTagged(error, 'OralQuizFormatUnsupported')
          ? 'Ta wersja aplikacji nie obsługuje wszystkich pytań tego mini-quizu. Zaktualizuj aplikację.'
          : Predicate.isTagged(error, 'OralQuizUnavailable')
            ? 'Mini-quiz nie jest dostępny dla tej sesji.'
            : 'Nie udało się rozpocząć mini-quizu. Spróbuj ponownie.',
      })
      await client.invalidateQueries(quizQuery(userId, req))
    },
  })
}
