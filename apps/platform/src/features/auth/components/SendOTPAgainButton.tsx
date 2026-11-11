import { getAuthErrorMessage } from '@inzpro/auth-client/error'
import { Button } from '@inzpro/ui/components/button'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

import { useSendOTPMutation } from '../hooks/useSendOTPMutation'
import { verifyOTPPageRouteApi } from '../utils'

export const SendOTPAgainButton = () => {
  const { email } = verifyOTPPageRouteApi.useSearch()
  const mutation = useSendOTPMutation()

  return (
    <span className="inline-flex items-center gap-1">
      <Button
        onClick={() =>
          toast.promise(() => mutation.mutateAsync({ email }), {
            loading: 'Wysyłanie kodu weryfikacyjnego...',
            success: 'Kod został wysłany. Sprawdź swoją skrzynkę pocztową.',
            error: error => ({
              message: 'Ups! Coś poszło nie tak.',
              description: getAuthErrorMessage(error),
            }),
          })
        }
        variant="link"
        size="empty"
        disabled={mutation.isPending}
      >
        Wyślij ponownie
      </Button>

      {mutation.isPending && (
        <LoaderCircle className="text-primary/50 inline-block size-4 animate-spin" />
      )}
    </span>
  )
}
