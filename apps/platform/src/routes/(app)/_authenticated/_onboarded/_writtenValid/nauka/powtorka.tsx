import {
  reviewPreviewQueryOptions,
  reviewSessionQueryOptions,
} from '@inzpro/queries/modules/written-study/queries'
import { createFileRoute } from '@tanstack/react-router'
import { Schema } from 'effect'
import { constVoid } from 'effect/Function'
import { seo } from '~platform/config/app'
import { ReviewStartPage } from '~platform/features/reviews/ReviewStartPage'
import { ReviewPreviewSearch } from '~platform/features/reviews/validation'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute(
  '/(app)/_authenticated/_onboarded/_writtenValid/nauka/powtorka',
)({
  validateSearch: Schema.toStandardSchemaV1(ReviewPreviewSearch),
  loaderDeps: ({ search }) => ({ documentId: search['akt-prawny'] }),
  loader: ({ context: { queryClient, session, selectedPath }, deps }) => {
    const req = { params: { qualificationPathId: selectedPath.id }, query: deps }

    void Promise.all([
      queryClient.query(reviewSessionQueryOptions(apiHttpClient, session.user.id, req)),
      queryClient.query(reviewPreviewQueryOptions(apiHttpClient, session.user.id, req)),
    ]).catch(constVoid)
  },
  staticData: { backLabel: 'Powtórka' },
  component: ReviewStartPage,
  head: () => ({ meta: seo({ title: 'Zacznij powtórkę' }) }),
})
