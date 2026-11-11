import { getAuthErrorMessage } from '@inzpro/auth-client/error'
import { toast } from '@inzpro/ui/components/toast'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'

import { signOut } from '../actions'

export const useSignOutMutation = () => {
  const router = useRouter()

  return useMutation({
    mutationFn: signOut,
    mutationKey: ['signOut'],
    onSuccess: async (_, __, ___, context) => {
      // Nothing cached for the previous account may be shown to the next one.
      context.client.clear()
      await router.navigate({ to: '/logowanie', replace: true })
      await router.invalidate()
    },
    onError: error => toast.add({ type: 'error', title: getAuthErrorMessage(error) }),
  })
}
