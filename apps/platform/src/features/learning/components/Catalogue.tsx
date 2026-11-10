import type { UserId } from '@inzpro/domain/modules/identity/user'
import { pathsQueryOptions, selectedPathQueryOptions } from '@inzpro/queries/modules/preparation'
import { Button } from '@inzpro/ui/components/button'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Option } from 'effect'
import { apiHttpClient } from '~platform/lib/api-client'

import { useSelectPath } from '../hooks/useSelectPath'
import { Documents } from './Documents'
import { RequestFailure } from './RequestFailure'

export const Catalogue = ({ userId }: { userId: UserId }) => {
  const paths = useInfiniteQuery(pathsQueryOptions(apiHttpClient, userId, { query: {} }))
  const selected = useQuery(selectedPathQueryOptions(apiHttpClient, userId))
  const selectedPath = Option.getOrUndefined(selected.data?.path ?? Option.none())
  const selection = useSelectPath(userId)

  if (paths.isPending || selected.isPending) {
    return <p role="status">Wczytywanie ścieżek…</p>
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

  const assignments = paths.data.pages.flatMap(page => page.data)

  return (
    <div className="space-y-6">
      <nav className="flex gap-4">
        <Link to="/zacznij">Dodaj ścieżkę</Link>
        <Link to="/profil">Profil i ścieżki</Link>
        <Link to="/nauka">Egzamin pisemny</Link>
        <Link to="/ustny">Egzamin ustny</Link>
      </nav>
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Wybierz ścieżkę nauki</h2>
        {assignments.length === 0 && (
          <p>
            Nie masz aktywnych ścieżek. <Link to="/zacznij">Dodaj ścieżkę nauki</Link>.
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          {assignments
            .filter(path => !path.archived)
            .map(path => (
              <Button
                key={path.id}
                variant={path.id === selectedPath?.id ? 'primary' : 'outline'}
                aria-pressed={path.id === selectedPath?.id}
                disabled={selection.isPending}
                onClick={() => selection.mutate({ payload: { qualificationPathId: path.id } })}
              >
                {path.name}
              </Button>
            ))}
        </div>
        {selection.isPending && <p role="status">Zapisywanie ścieżki…</p>}
        {selection.isError && (
          <p role="alert">Nie udało się zapisać ścieżki. Wybierz ją ponownie.</p>
        )}
      </div>
      {selectedPath?.accessScope === 'oral' && (
        <p>
          Materiały do egzaminu ustnego nie są jeszcze dostępne.{' '}
          <Link to="/nauka">Sprawdź dostęp do egzaminu pisemnego</Link>
        </p>
      )}
      {selectedPath !== undefined && selectedPath.accessScope !== 'oral' && (
        <Documents
          key={selectedPath.id}
          pathId={selectedPath.id}

          userId={userId}

          disabled={selection.isPending}
        />
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
