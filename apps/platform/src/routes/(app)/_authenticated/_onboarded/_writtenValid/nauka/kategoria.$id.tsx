import { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import { documentQueryOptions } from '@inzpro/queries/modules/study'
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
    void queryClient
      .query(
        documentQueryOptions(apiHttpClient, session.user.id, {
          params: { qualificationPathId: selectedPath.id, documentId: params.id },
        }),
      )
      .catch(constVoid)
  },
  component: LearningCategoryPage,
  head: () => ({
    meta: seo({ title: 'Kategoria nauki' }),
  }),
})
