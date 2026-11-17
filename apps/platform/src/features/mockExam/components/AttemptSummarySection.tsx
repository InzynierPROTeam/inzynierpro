import { mockExamAttemptQueryOptions } from '@inzpro/queries/modules/mock-exams/queries'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '@inzpro/ui/components/empty'
import { BackLink } from '~platform/components/BackLink'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { SessionResultCardSkeleton } from '~platform/features/learningSession/components/SessionResultCard'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { attemptSummaryRouteApi } from '../utils'
import { AttemptNextStepCard } from './AttemptNextStepCard'
import { AttemptResultCard } from './AttemptResultCard'
import { AttemptReviewSection } from './AttemptReviewSection'

export const AttemptSummarySection = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { attemptId } = attemptSummaryRouteApi.useParams()

  return (
    <section className="app-layout-section @container gap-8">
      <BackLink fallback={{ to: '/egzamin-probny' }} />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Podsumowanie egzaminu</h1>
        <p className="text-muted-foreground">
          Sprawdź wynik i wróć do pytań, które warto przećwiczyć.
        </p>
      </div>
      <SuspenseQueryWrapper fallback={<SessionResultCardSkeleton />}>
        <SuspenseQuery
          options={mockExamAttemptQueryOptions(apiHttpClient, user.id, {
            params: { qualificationPathId: selectedPath.id, attemptId },
          })}
          isDataEmpty={attempt => attempt === null}
          noDataFallback={
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Brak podejścia</EmptyTitle>
                <EmptyDescription>Nie znaleziono podejścia na Twojej ścieżce.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          }
        >
          {attempt =>
            attempt.result === null ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>Egzamin w toku</EmptyTitle>
                  <EmptyDescription>
                    Podsumowanie będzie dostępne po zakończeniu egzaminu.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <>
                <AttemptResultCard
                  attempt={attempt}
                  result={attempt.result}
                />
                <AttemptReviewSection />
              </>
            )
          }
        </SuspenseQuery>
      </SuspenseQueryWrapper>
      <AttemptNextStepCard />
    </section>
  )
}
