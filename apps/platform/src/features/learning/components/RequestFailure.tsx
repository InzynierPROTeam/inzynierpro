import { Unauthenticated } from '@inzpro/api-contracts/middleware/authentication/errors'
import { Button } from '@inzpro/ui/components/button'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import { Schema } from 'effect'

export const RequestFailure = ({ retry, error }: { retry: () => void; error?: Error | null }) => {
  const queryClient = useQueryClient()
  const router = useRouter()

  if (Schema.is(Unauthenticated)(error)) {
    return (
      <div role="alert">
        <p>Twoja sesja wygasła. Zaloguj się ponownie.</p>
        <Link
          to="/logowanie"
          search={{ redirect: router.state.location.href }}
          onClick={() => queryClient.clear()}
        >
          Zaloguj się
        </Link>
      </div>
    )
  }

  return (
    <div
      role="alert"
      className="space-y-3"
    >
      <p>Nie udało się wczytać danych. Wybrany zakres może być niedostępny.</p>
      <Button
        variant="outline"
        onClick={retry}
      >
        Spróbuj ponownie
      </Button>
    </div>
  )
}
