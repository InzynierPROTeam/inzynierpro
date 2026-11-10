import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Button } from '@inzpro/ui/components/button'
import { toast } from 'sonner'

import { usePathMutation } from '../hooks/usePathMutation'

export const AccessExtension = ({
  pathId,
  userId,
}: {
  pathId: QualificationPathId
  userId: UserId
}) => {
  const { extend: mutation } = usePathMutation(userId)

  return (
    <div className="space-y-4">
      <p>Twoja ścieżka nie obejmuje tej części egzaminu.</p>
      <p>
        Możesz bezpłatnie rozszerzyć ścieżkę o egzamin pisemny i ustny. Zachowasz historię nauki i
        wybraną sesję egzaminacyjną.
      </p>
      <Button
        disabled={mutation.isPending}
        onClick={() =>
          toast.promise(mutation.mutateAsync({ params: { qualificationPathId: pathId } }), {
            loading: 'Rozszerzanie dostępu…',
            success: 'Dostęp został rozszerzony. Możesz kontynuować naukę.',
            error: 'Nie udało się rozszerzyć dostępu. Spróbuj ponownie.',
          })
        }
      >
        Potwierdź dostęp do egzaminu pisemnego i ustnego
      </Button>
      {mutation.isPending && <p role="status">Aktualizowanie dostępu…</p>}
      {mutation.isError && <p role="alert">Rozszerzenie dostępu nie zostało potwierdzone.</p>}
    </div>
  )
}
