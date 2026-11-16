import {
  latestOralSessionQueryOptions,
  oralSessionPreviewQueryOptions,
} from '@inzpro/queries/modules/study'
import { createFileRoute } from '@tanstack/react-router'
import { Schema } from 'effect'
import { constVoid } from 'effect/Function'
import { seo } from '~platform/config/app'
import { StartOralSessionPage } from '~platform/features/oralSession/StartOralSessionPage'
import { OralPreviewSearch } from '~platform/features/oralSession/validation'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute('/(app)/_authenticated/_onboarded/_oralValid/ustny/start')({
  validateSearch: Schema.toStandardSchemaV1(OralPreviewSearch),
  loaderDeps: ({ search }) => ({
    categoryId: search.kategoria,
    fromCategoryId: search['obecna-kategoria'],
  }),
  loader: ({ context: { queryClient, session, selectedPath }, deps }) => {
    void queryClient
      .query(
        oralSessionPreviewQueryOptions(apiHttpClient, session.user.id, {
          params: { qualificationPathId: selectedPath.id },
          query: deps,
        }),
      )
      .then(preview =>
        preview === null
          ? undefined
          : queryClient.query(
              latestOralSessionQueryOptions(apiHttpClient, session.user.id, {
                params: { qualificationPathId: selectedPath.id },
                query: { categoryId: preview.category.id },
              }),
            ),
      )
      .catch(constVoid)
  },
  staticData: { backLabel: 'Sesja nauki ustnej' },
  component: StartOralSessionPage,
  head: () => ({ meta: seo({ title: 'Zacznij sesję nauki ustnej' }) }),
})
