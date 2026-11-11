import { getAuthErrorMessage } from '@inzpro/auth-client/error'
import { toast } from '@inzpro/ui/components/toast'
import { useMutation } from '@tanstack/react-query'

import { signInWithGoogle } from '../actions'

export const useSignInWithGoogle = () =>
  useMutation({
    mutationFn: signInWithGoogle,
    mutationKey: ['signInWithGoogle'],
    onError: error =>
      toast.add({
        type: 'error',
        title: 'Nie udało się zalogować przez Google.',
        description: getAuthErrorMessage(error),
      }),
  })
