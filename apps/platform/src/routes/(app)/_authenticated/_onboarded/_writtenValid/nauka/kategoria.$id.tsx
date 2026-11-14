import { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import { documentQueryOptions, latestSessionQueryOptions } from '@inzpro/queries/modules/study'
import { createFileRoute } from '@tanstack/react-router'
import { Schema } from 'effect'
import { constVoid } from 'effect/Function'
import { seo } from '~platform/config/app'
import { LearningCategoryPage } from '~platform/features/written/LearningCategoryPage'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute(
  '/(app)/_authenticated/_onboarded/_writtenValid/nauka/kategoria/$id',
)({
  params: {
    parse: params => ({ id: Schema.decodeSync(ReferenceDocumentId)(params.id) }),
  },
  loader: ({ context: { queryClient, session, selectedPath }, params }) => {
    void Promise.all([
      queryClient.query(
        documentQueryOptions(apiHttpClient, session.user.id, {
          params: { qualificationPathId: selectedPath.id, documentId: params.id },
        }),
      ),
      queryClient.query(
        latestSessionQueryOptions(apiHttpClient, session.user.id, {
          params: { qualificationPathId: selectedPath.id },
          query: { documentId: params.id },
        }),
      ),
    ]).catch(constVoid)
  },
  staticData: { backLabel: 'Kategoria' },
  component: LearningCategoryPage,
  head: () => ({
    meta: seo({ title: 'Kategoria nauki' }),
  }),
})
