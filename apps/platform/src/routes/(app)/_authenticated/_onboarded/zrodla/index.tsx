import { referenceDocumentsInfiniteQueryOptions } from '@inzpro/queries/modules/learning-content/queries'
import { createFileRoute } from '@tanstack/react-router'
import { constVoid } from 'effect/Function'
import { seo } from '~platform/config/app'
import { SourcesPage } from '~platform/features/sources/SourcesPage'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute('/(app)/_authenticated/_onboarded/zrodla/')({
  loader: ({ context: { queryClient, session, selectedPath } }) => {
    void queryClient
      .infiniteQuery(
        referenceDocumentsInfiniteQueryOptions(apiHttpClient, session.user.id, {
          params: { qualificationPathId: selectedPath.id },
          query: {},
        }),
      )
      .catch(constVoid)
  },
  staticData: { backLabel: 'Źródła' },
  component: SourcesPage,
  head: () => ({ meta: seo({ title: 'Źródła' }) }),
})
