import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationKindId } from '@inzpro/domain/modules/qualification-paths/qualification-kind'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { QualificationScopeId } from '@inzpro/domain/modules/qualification-paths/qualification-scope'
import type { SpecializationId } from '@inzpro/domain/modules/qualification-paths/specialization'
import { pathQueryOptions } from '@inzpro/queries/modules/preparation'
import { resolveQualificationPathQueryOptions } from '@inzpro/queries/modules/qualification-paths'
import { Button } from '@inzpro/ui/components/button'
import { useQuery } from '@tanstack/react-query'
import { Option } from 'effect'
import { apiHttpClient } from '~platform/lib/api-client'

export const Confirmation = ({
  userId,
  specializationId,
  qualificationKindId,
  qualificationScopeId,
  disabled,
}: {
  userId: UserId | undefined
  specializationId: SpecializationId
  qualificationKindId: QualificationKindId
  qualificationScopeId: QualificationScopeId
  disabled: boolean
}) => {
  const query = useQuery(
    resolveQualificationPathQueryOptions(apiHttpClient, {
      query: { specializationId, qualificationKindId, qualificationScopeId },
    }),
  )

  if (query.isPending) {
    return <p role="status">Sprawdzanie konfiguracji…</p>
  }

  if (query.isError) {
    return (
      <p role="alert">
        Nie udało się sprawdzić konfiguracji.{' '}
        <button
          type="button"
          onClick={() => {
            void query.refetch()
          }}
        >
          Spróbuj ponownie
        </button>
      </p>
    )
  }

  if (Option.isNone(query.data.path)) {
    return <p role="alert">Ta konfiguracja nie jest już dostępna. Sprawdź swoje wybory.</p>
  }

  return (
    <>
      {userId !== undefined && (
        <ExistingAssignment
          userId={userId}
          pathId={query.data.path.value.id}
        />
      )}
      <Button
        type="submit"
        disabled={disabled}
      >
        {userId === undefined ? 'Zaloguj się i kontynuuj' : 'Potwierdź ścieżkę'}
      </Button>
    </>
  )
}

const ExistingAssignment = ({
  userId,
  pathId,
}: {
  userId: UserId
  pathId: QualificationPathId
}) => {
  const query = useQuery(
    pathQueryOptions(apiHttpClient, userId, { params: { qualificationPathId: pathId } }),
  )

  if (query.isError) {
    return (
      <p role="alert">
        Nie udało się sprawdzić Twojej wcześniejszej ścieżki.{' '}
        <button
          type="button"
          onClick={() => {
            void query.refetch()
          }}
        >
          Spróbuj ponownie
        </button>
      </p>
    )
  }

  if (query.data === undefined || Option.isNone(query.data.path)) {
    return null
  }

  return (
    <p role="status">
      {query.data.path.value.archived
        ? 'Ta ścieżka jest już w Twoim archiwum. Po potwierdzeniu przejdziesz do profilu.'
        : 'Masz już tę ścieżkę. Twój cel i postępy zostaną zachowane.'}
    </p>
  )
}
