import type { ExamAccessScope } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { selectedPathQueryOptions } from '@inzpro/queries/modules/preparation'
import { oralMaterialsQueryOptions } from '@inzpro/queries/modules/study'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Option } from 'effect'
import { authenticatedRouteApi } from '~platform/features/auth/utils'
import { apiHttpClient } from '~platform/lib/api-client'

import { AccessExtension } from './components/AccessExtension'
import { Documents } from './components/Documents'
import { RequestFailure } from './components/RequestFailure'

export const StudyPage = ({ part }: { part: Exclude<ExamAccessScope, 'both'> }) => {
  const { user } = authenticatedRouteApi.useRouteContext()
  const paths = useQuery(selectedPathQueryOptions(apiHttpClient, user.id))

  if (paths.isPending) {
    return <p role="status">Wczytywanie ścieżki nauki…</p>
  }

  if (paths.isError) {
    return (
      <RequestFailure
        error={paths.error}
        retry={() => {
          void paths.refetch()
        }}
      />
    )
  }

  const path = Option.getOrUndefined(paths.data.path)

  if (path === undefined) {
    return (
      <section className="layout-section">
        <p>Wybierz lub dodaj ścieżkę w profilu.</p>
        <Link to="/profil">Przejdź do profilu</Link>
      </section>
    )
  }

  return (
    <section className="layout-section space-y-6">
      <h1 className="text-2xl font-semibold">
        {part === 'written' ? 'Nauka do egzaminu pisemnego' : 'Przygotowanie do egzaminu ustnego'} •{' '}
        {path.name}
      </h1>
      {path.accessScope !== 'both' && path.accessScope !== part ? (
        <AccessExtension
          pathId={path.id}
          userId={user.id}
        />
      ) : part === 'written' ? (
        <Documents
          key={path.id}
          pathId={path.id}
          userId={user.id}
          disabled={false}
        />
      ) : (
        <OralMaterials pathId={path.id} />
      )}
    </section>
  )
}

const OralMaterials = ({ pathId }: { pathId: QualificationPathId }) => {
  const { user } = authenticatedRouteApi.useRouteContext()

  const query = useInfiniteQuery(
    oralMaterialsQueryOptions(apiHttpClient, user.id, {
      query: {},
      params: { qualificationPathId: pathId },
    }),
  )

  if (query.isPending) {
    return <p role="status">Wczytywanie materiałów do egzaminu ustnego…</p>
  }

  if (query.isError) {
    return (
      <RequestFailure
        error={query.error}
        retry={() => {
          void query.refetch()
        }}
      />
    )
  }

  return <p>Materiały do egzaminu ustnego nie są jeszcze dostępne.</p>
}
