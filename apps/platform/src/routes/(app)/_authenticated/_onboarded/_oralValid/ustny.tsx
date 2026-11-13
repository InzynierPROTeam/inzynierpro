import { oralMaterialsInfiniteQueryOptions } from '@inzpro/queries/modules/study'
import { createFileRoute } from '@tanstack/react-router'
import { constVoid } from 'effect/Function'
import { seo } from '~platform/config/app'
import { OralStudyPage } from '~platform/features/oral/OralStudyPage'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute('/(app)/_authenticated/_onboarded/_oralValid/ustny')({
  loader: ({ context: { queryClient, session, selectedPath } }) => {
    void queryClient
      .infiniteQuery(
        oralMaterialsInfiniteQueryOptions(apiHttpClient, session.user.id, {
          query: {},
          params: { qualificationPathId: selectedPath.id },
        }),
      )
      .catch(constVoid)
  },
  component: OralStudyPage,
  head: () => ({
    meta: seo({ title: 'Przygotowanie do egzaminu ustnego' }),
  }),
})
