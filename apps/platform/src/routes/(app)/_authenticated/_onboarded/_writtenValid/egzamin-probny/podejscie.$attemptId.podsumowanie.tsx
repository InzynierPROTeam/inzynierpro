import { PageLimit } from '@inzpro/domain/common/pagination'
import { MockExamAttemptId } from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import {
  mockExamAttemptQueryOptions,
  attemptReviewInfiniteQueryOptions,
} from '@inzpro/queries/modules/mock-exams/queries'
import { createFileRoute } from '@tanstack/react-router'
import { Schema } from 'effect'
import { constVoid } from 'effect/Function'
import { seo } from '~platform/config/app'
import { AttemptSummaryPage } from '~platform/features/mockExam/AttemptSummaryPage'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute(
  '/(app)/_authenticated/_onboarded/_writtenValid/egzamin-probny/podejscie/$attemptId/podsumowanie',
)({
  params: {
    parse: params => Schema.decodeSync(Schema.Struct({ attemptId: MockExamAttemptId }))(params),
    stringify: params => params,
  },
  loader: ({ context: { queryClient, session, selectedPath }, params }) => {
    const requestParams = { qualificationPathId: selectedPath.id, attemptId: params.attemptId }
    void Promise.all([
      queryClient.query(
        mockExamAttemptQueryOptions(apiHttpClient, session.user.id, { params: requestParams }),
      ),
      queryClient.infiniteQuery(
        attemptReviewInfiniteQueryOptions(apiHttpClient, session.user.id, {
          params: requestParams,
          query: { limit: PageLimit.make(5) },
        }),
      ),
    ]).catch(constVoid)
  },
  component: AttemptSummaryPage,
  head: () => ({ meta: seo({ title: 'Podsumowanie egzaminu' }) }),
})
