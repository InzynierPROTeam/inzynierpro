import { createFileRoute } from '@tanstack/react-router'
import { Schema } from 'effect'
import { seo } from '~platform/config/app'
import { OralReviewStartPage } from '~platform/features/oralReviews/OralReviewStartPage'
import { OralReviewPreviewSearch } from '~platform/features/oralReviews/validation'

export const Route = createFileRoute('/(app)/_authenticated/_onboarded/_oralValid/ustny/powtorka')({
  validateSearch: Schema.toStandardSchemaV1(OralReviewPreviewSearch),
  component: OralReviewStartPage,
  staticData: { backLabel: 'Powtórka ustna' },
  head: () => ({ meta: seo({ title: 'Powtórka ustna' }) }),
})
