import type { UserId } from '@inzpro/domain/modules/identity/user'
import { pathsQueryOptions, selectedPathQueryOptions } from '@inzpro/queries/modules/preparation'
import { Button } from '@inzpro/ui/components/button'
import { Card, CardHeader, CardTitle, CardContent } from '@inzpro/ui/components/card'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Option } from 'effect'
import { Match } from 'effect'
import { toast } from 'sonner'
import { RequestFailure } from '~platform/features/learning/components/RequestFailure'
import { usePathMutation } from '~platform/features/learning/hooks/usePathMutation'
import { useSelectPath } from '~platform/features/learning/hooks/useSelectPath'
import { apiHttpClient } from '~platform/lib/api-client'
import { formatLocalDateTime } from '~platform/utils/date-time-input'

import { GoalSettings } from './GoalSettings'

export const ProfilePaths = ({ userId }: { userId: UserId }) => {
  const paths = useInfiniteQuery(pathsQueryOptions(apiHttpClient, userId, { query: {} }))
  const mutation = usePathMutation(userId)
  const selected = useQuery(selectedPathQueryOptions(apiHttpClient, userId))
  const selectedPath = Option.getOrUndefined(selected.data?.path ?? Option.none())

  const selection = useSelectPath(userId)

  if (paths.isPending || selected.isPending) {
    return <p role="status">Wczytywanie Twoich ścieżek…</p>
  }

  if (paths.isError || selected.isError) {
    return (
      <RequestFailure
        error={paths.error ?? selected.error}
        retry={() => {
          void paths.refetch()
          void selected.refetch()
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Twoje ścieżki nauki</h2>
        <Link to="/zacznij">Dodaj ścieżkę nauki</Link>
      </div>
      {paths.data.pages.flatMap(page => page.data).length === 0 && (
        <p>Nie masz jeszcze przypisanych ścieżek.</p>
      )}
      {paths.data.pages
        .flatMap(page => page.data)
        .map(path => (
          <Card key={path.id}>
            <CardHeader>
              <CardTitle>{path.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Dostęp:{' '}
                {Match.value(path.accessScope).pipe(
                  Match.when('written', () => 'pisemny'),
                  Match.when('oral', () => 'ustny'),
                  Match.when('both', () => 'pisemny i ustny'),
                  Match.exhaustive,
                )}{' '}
                •{' '}
                {path.archived
                  ? 'W archiwum'
                  : path.id === selectedPath?.id
                    ? 'Wybrana'
                    : 'Aktywna'}
              </p>
              <p>Sesja docelowa: {path.goal.sessionName}</p>
              <p>
                {Option.match(path.goal.oralExamDate, {
                  onNone: () =>
                    `Orientacyjny termin egzaminu ustnego: ${formatLocalDateTime(path.goal.oralPlanningAt)}`,
                  onSome: date => `Twój termin egzaminu ustnego: ${formatLocalDateTime(date)}`,
                })}
              </p>
              <div className="flex flex-wrap gap-3">
                {!path.archived && (
                  <Button
                    variant="outline"
                    disabled={
                      mutation.archive.isPending ||
                      mutation.restore.isPending ||
                      mutation.extend.isPending ||
                      selection.isPending ||
                      selectedPath?.id === path.id
                    }
                    onClick={() => selection.mutate({ payload: { qualificationPathId: path.id } })}
                  >
                    Wybierz ścieżkę
                  </Button>
                )}
                <Button
                  variant="outline"
                  disabled={
                    mutation.archive.isPending ||
                    mutation.restore.isPending ||
                    mutation.extend.isPending
                  }
                  onClick={() =>
                    toast.promise(
                      (path.archived ? mutation.restore : mutation.archive).mutateAsync({
                        params: { qualificationPathId: path.id },
                      }),
                      {
                        loading: 'Aktualizowanie ścieżki…',
                        success: 'Ścieżka została zaktualizowana.',
                        error: 'Nie udało się zaktualizować ścieżki.',
                      },
                    )
                  }
                >
                  {path.archived ? 'Przywróć ścieżkę' : 'Archiwizuj ścieżkę'}
                </Button>
                {!path.archived && path.accessScope !== 'both' && (
                  <Button
                    disabled={
                      mutation.archive.isPending ||
                      mutation.restore.isPending ||
                      mutation.extend.isPending
                    }
                    onClick={() =>
                      toast.promise(
                        mutation.extend.mutateAsync({ params: { qualificationPathId: path.id } }),
                        {
                          loading: 'Rozszerzanie dostępu…',
                          success: 'Dostęp do egzaminu pisemnego i ustnego został włączony.',
                          error: 'Nie udało się rozszerzyć dostępu.',
                        },
                      )
                    }
                  >
                    Rozszerz o egzamin pisemny i ustny
                  </Button>
                )}
              </div>
              {!path.archived && (
                <GoalSettings
                  key={path.goal.version}
                  path={path}
                  userId={userId}
                />
              )}
            </CardContent>
          </Card>
        ))}
      {(mutation.archive.isError ||
        mutation.restore.isError ||
        mutation.extend.isError ||
        selection.isError) && (
        <p role="alert">Zmiana nie została potwierdzona. Odśwież stronę lub spróbuj ponownie.</p>
      )}
      {paths.hasNextPage && (
        <Button
          type="button"
          disabled={paths.isFetchingNextPage}
          onClick={() => {
            void paths.fetchNextPage()
          }}
        >
          Wczytaj więcej ścieżek
        </Button>
      )}
    </div>
  )
}
