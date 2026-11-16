import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Button } from '@inzpro/ui/components/button'
import { toast } from '@inzpro/ui/components/toast'

import { useExtendPath } from '../hooks/useExtendPath'

type AccessExtensionProps = {
  pathId: QualificationPathId
  userId: UserId
  onExtended: () => Promise<void>
}

export const AccessExtension = ({ pathId, userId, onExtended }: AccessExtensionProps) => {
  const mutation = useExtendPath(userId)

  return (
    <div className="border-border bg-card flex flex-col gap-5 rounded-4xl border p-6 sm:p-8">
      <p className="text-xl font-semibold">Twoja ścieżka nie obejmuje tej części egzaminu.</p>
      <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
        Możesz bezpłatnie rozszerzyć ścieżkę o egzamin pisemny i ustny. Zachowasz historię nauki i
        wybraną sesję egzaminacyjną.
      </p>
      <Button
        disabled={mutation.isPending}
        onClick={() =>
          toast.promise(
            mutation.mutateAsync({ params: { qualificationPathId: pathId } }).then(onExtended),
            {
              loading: { title: 'Rozszerzanie dostępu…' },
              success: { title: 'Dostęp został rozszerzony. Możesz kontynuować naukę.' },
              error: { title: 'Nie udało się rozszerzyć dostępu. Spróbuj ponownie.' },
            },
          )
        }
      >
        Potwierdź dostęp do egzaminu pisemnego i ustnego
      </Button>
      {mutation.isPending && <p role="status">Aktualizowanie dostępu…</p>}
      {mutation.isError && <p role="alert">Rozszerzenie dostępu nie zostało potwierdzone.</p>}
    </div>
  )
}
