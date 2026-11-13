import { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import { createFileRoute } from '@tanstack/react-router'
import { Schema } from 'effect'
import { seo } from '~platform/config/app'
import { LearningCategoryPage } from '~platform/features/written/LearningCategoryPage'

export const Route = createFileRoute(
  '/(app)/_authenticated/_onboarded/_writtenValid/nauka/kategoria/$id',
)({
  params: {
    parse: params => ({ id: Schema.decodeSync(ReferenceDocumentId)(params.id) }),
  },
  component: LearningCategoryPage,
  head: () => ({
    meta: seo({ title: 'Kategoria nauki' }),
  }),
})
