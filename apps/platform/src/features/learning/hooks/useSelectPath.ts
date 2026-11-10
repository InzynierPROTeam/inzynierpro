import type { UserId } from '@inzpro/domain/modules/identity/user'
import { preparationKeys } from '@inzpro/queries/modules/preparation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { selectQualificationPath } from '../actions'

export const useSelectPath = (userId: UserId) => {
  const client = useQueryClient()

  return useMutation({
    mutationFn: selectQualificationPath,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: preparationKeys.selection(userId) })
    },
    onError: () => toast.error('Nie udało się zapisać ścieżki. Spróbuj ponownie.'),
  })
}
