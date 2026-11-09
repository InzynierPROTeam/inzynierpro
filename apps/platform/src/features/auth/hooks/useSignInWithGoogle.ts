import { getAuthErrorMessage } from '@inzpro/auth-client/error'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { signInWithGoogle } from '../actions'

export const useSignInWithGoogle = () =>
  useMutation({
    mutationFn: signInWithGoogle,
    mutationKey: ['signInWithGoogle'],
    onError: error =>
      toast.error('Nie udało się zalogować przez Google.', {
        description: getAuthErrorMessage(error),
      }),
  })
