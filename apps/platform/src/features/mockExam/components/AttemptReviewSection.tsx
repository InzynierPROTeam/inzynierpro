import { PageLimit } from '@inzpro/domain/common/pagination'
import { attemptReviewInfiniteQueryOptions } from '@inzpro/queries/modules/mock-exams/queries'
import { Skeleton } from '@inzpro/ui/components/skeleton'
import { InfiniteQueryFooter } from '~platform/components/InfiniteQueryFooter'
import {
  SuspenseInfiniteQuery,
  SuspenseQueryWrapper,
} from '~platform/components/SuspenseQueryBoundary'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { attemptSummaryRouteApi } from '../utils'
import { AttemptReviewQuestionCard } from './AttemptReviewQuestionCard'

export const AttemptReviewSection = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { attemptId } = attemptSummaryRouteApi.useParams()

  return (
    <section
      aria-labelledby="exam-review-heading"
      className="flex flex-col gap-6"
    >
      <div>
        <h2
          id="exam-review-heading"
          className="text-xl font-semibold"
        >
          Pytania i Twoje odpowiedzi
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Przejrzyj rozwiązania i wyjaśnienia. Zapisz pytania i własne notatki na później.
        </p>
      </div>
      <SuspenseQueryWrapper fallback={<Skeleton className="h-64" />}>
        <SuspenseInfiniteQuery
          options={attemptReviewInfiniteQueryOptions(apiHttpClient, user.id, {
            params: { qualificationPathId: selectedPath.id, attemptId },
            query: { limit: PageLimit.make(5) },
          })}
          isDataEmpty={data => data.pages.every(page => page.data.length === 0)}
        >
          {({ data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError }) => (
            <div className="flex flex-col gap-6">
              {data.pages
                .flatMap(page => page.data)
                .map(question => (
                  <AttemptReviewQuestionCard
                    key={question.position}
                    question={question}
                  />
                ))}
              <InfiniteQueryFooter
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                isFetchNextPageError={isFetchNextPageError}
                fetchNextPage={fetchNextPage}
              />
            </div>
          )}
        </SuspenseInfiniteQuery>
      </SuspenseQueryWrapper>
    </section>
  )
}
