import { AttemptQuestionPosition } from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { mockExamHistoryInfiniteQueryOptions } from '@inzpro/queries/modules/mock-exams/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@inzpro/ui/components/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@inzpro/ui/components/empty'
import { Skeleton } from '@inzpro/ui/components/skeleton'
import { formatDateTime } from '@inzpro/utils/date'
import { formatDuration } from '@inzpro/utils/date'
import { Link } from '@tanstack/react-router'
import { Duration } from 'effect'
import { InfiniteQueryFooter } from '~platform/components/InfiniteQueryFooter'
import {
  SuspenseInfiniteQuery,
  SuspenseQueryWrapper,
} from '~platform/components/SuspenseQueryBoundary'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

export const MockExamHistorySection = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  return (
    <section className="app-layout-section">
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Historia podejść</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SuspenseQueryWrapper fallback={<Skeleton className="h-32" />}>
            <SuspenseInfiniteQuery
              options={mockExamHistoryInfiniteQueryOptions(apiHttpClient, user.id, {
                params: { qualificationPathId: selectedPath.id },
                query: {},
              })}
              isDataEmpty={data => data.pages.every(page => page.data.length === 0)}
              noDataFallback={
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>Brak podejść do egzaminu</EmptyTitle>
                    <EmptyDescription>
                      Nie masz jeszcze podejść do egzaminu na tej ścieżce.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              }
            >
              {({ data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError }) => (
                <div className="flex flex-col gap-4">
                  {data.pages
                    .flatMap(page => page.data)
                    .map(attempt => (
                      <div
                        key={attempt.id}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{formatDateTime(attempt.startedAt)}</span>
                          <p className="text-muted-foreground text-sm">
                            {attempt.result === null
                              ? attempt.status === 'abandoned'
                                ? 'Porzucony'
                                : 'W trakcie'
                              : `${attempt.result.correct} poprawnych · ${attempt.result.percent}% · ${attempt.result.passed === null ? 'Wynik niepełny' : attempt.result.passed ? 'Zaliczony' : 'Niezaliczony'}`}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Przerwy: {attempt.pauseCount} ·{' '}
                            {formatDuration(Duration.seconds(attempt.pauseSeconds))}
                          </p>
                        </div>
                        {attempt.status === 'finished' ? (
                          <Link
                            className="text-primary text-sm underline-offset-4 hover:underline"
                            to="/egzamin-probny/podejscie/$attemptId/podsumowanie"
                            params={{ attemptId: attempt.id }}
                            aria-label={`Zobacz podsumowanie z ${formatDateTime(attempt.startedAt)}`}
                          >
                            Zobacz podsumowanie
                          </Link>
                        ) : attempt.status === 'in-progress' || attempt.status === 'paused' ? (
                          <Link
                            to="/egzamin-probny/podejscie/$attemptId/$questionNumber"
                            params={{
                              attemptId: attempt.id,
                              questionNumber: AttemptQuestionPosition.make(1),
                            }}
                          >
                            Wróć do egzaminu
                          </Link>
                        ) : null}
                      </div>
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
        </CardContent>
      </Card>
    </section>
  )
}
