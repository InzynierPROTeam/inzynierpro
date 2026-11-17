import { mockExamHistoryInfiniteQueryOptions } from '@inzpro/queries/modules/mock-exams/queries'
import { Button } from '@inzpro/ui/components/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@inzpro/ui/components/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@inzpro/ui/components/empty'
import {
  SectionHeader,
  SectionHeaderContent,
  SectionHeaderDescription,
  SectionHeaderTitle,
} from '@inzpro/ui/components/section-header'
import { Skeleton } from '@inzpro/ui/components/skeleton'
import { formatDateTime } from '@inzpro/utils/date'
import { Link } from '@tanstack/react-router'
import { BackLink } from '~platform/components/BackLink'
import {
  SuspenseInfiniteQuery,
  SuspenseQueryWrapper,
} from '~platform/components/SuspenseQueryBoundary'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { ResumeMockExamButton } from './ResumeMockExamButton'

export const LatestMockExamSection = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  return (
    <section className="app-layout-section gap-8">
      <BackLink fallback={{ to: '/start' }} />
      <SectionHeader>
        <SectionHeaderContent>
          <SectionHeaderTitle render={<h1 />}>Egzamin próbny</SectionHeaderTitle>
          <SectionHeaderDescription>
            Wróć do ostatniego podejścia lub sprawdź się w kolejnym egzaminie.
          </SectionHeaderDescription>
        </SectionHeaderContent>
      </SectionHeader>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Ostatni egzamin</h2>
          </CardTitle>
        </CardHeader>
        <SuspenseQueryWrapper fallback={<Skeleton className="h-32" />}>
          <SuspenseInfiniteQuery
            options={mockExamHistoryInfiniteQueryOptions(apiHttpClient, user.id, {
              params: { qualificationPathId: selectedPath.id },
              query: {},
            })}
            isDataEmpty={data => data.pages[0]?.data[0] === undefined}
            noDataFallback={
              <CardContent>
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>Przed Tobą pierwszy egzamin</EmptyTitle>
                    <EmptyDescription>
                      Rozpocznij podejście, aby sprawdzić swoją wiedzę.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </CardContent>
            }
          >
            {({ data }) => {
              const attempt = data.pages[0]?.data[0]

              return attempt === undefined ? null : (
                <>
                  <CardContent className="flex flex-col gap-2">
                    <p className="text-muted-foreground text-sm">
                      {formatDateTime(attempt.startedAt)}
                    </p>
                    <p>
                      {attempt.result === null
                        ? attempt.status === 'abandoned'
                          ? 'Egzamin porzucony'
                          : 'Masz rozpoczęty egzamin próbny.'
                        : `Wynik: ${attempt.result.passed === null ? 'niepełny' : attempt.result.passed ? 'zaliczony' : 'niezaliczony'} · ${attempt.result.correct} poprawnych · ${attempt.result.percent}%`}
                    </p>
                  </CardContent>
                  <CardFooter>
                    {attempt.status === 'finished' ? (
                      <Button
                        nativeButton={false}
                        render={
                          <Link
                            to="/egzamin-probny/podejscie/$attemptId/podsumowanie"
                            params={{ attemptId: attempt.id }}
                          />
                        }
                      >
                        Zobacz wynik ostatniego egzaminu
                      </Button>
                    ) : attempt.status === 'in-progress' || attempt.status === 'paused' ? (
                      <ResumeMockExamButton attemptId={attempt.id} />
                    ) : null}
                  </CardFooter>
                </>
              )
            }}
          </SuspenseInfiniteQuery>
        </SuspenseQueryWrapper>
        <CardFooter>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link to="/egzamin-probny/start" />}
          >
            Zacznij nowy egzamin
          </Button>
        </CardFooter>
      </Card>
    </section>
  )
}
