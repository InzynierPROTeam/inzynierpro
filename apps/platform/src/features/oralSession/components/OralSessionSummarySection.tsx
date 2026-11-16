import { oralSessionSummaryQueryOptions } from '@inzpro/queries/modules/study'
import { Button } from '@inzpro/ui/components/button'
import { Card, CardContent } from '@inzpro/ui/components/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@inzpro/ui/components/empty'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import {
  SectionHeader,
  SectionHeaderContent,
  SectionHeaderDescription,
  SectionHeaderTitle,
} from '@inzpro/ui/components/section-header'
import { Link } from '@tanstack/react-router'
import { FileQuestionMark } from 'lucide-react'
import { BackLink } from '~platform/components/BackLink'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { SessionResultCardSkeleton } from '~platform/features/learningSession/components/SessionResultCard'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { oralSessionSummaryRouteApi } from '../utils'
import { OralSessionNextStepCard } from './OralSessionNextStepCard'
import { OralSessionQuestionsCard } from './OralSessionQuestionsCard'
import { OralSessionQuizCard } from './OralSessionQuizCard'
import { OralSessionResultCard } from './OralSessionResultCard'

export const OralSessionSummarySection = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { sessionId } = oralSessionSummaryRouteApi.useParams()

  return (
    <section className="app-layout-section @container gap-8">
      <div className="flex flex-col gap-6">
        <BackLink fallback={{ to: '/ustny' }} />
        <SectionHeader>
          <SectionHeaderContent>
            <SectionHeaderTitle render={<h1 />}>Podsumowanie sesji</SectionHeaderTitle>
            <SectionHeaderDescription>
              Zobacz, jak oceniłeś swoje odpowiedzi w tej sesji nauki ustnej.
            </SectionHeaderDescription>
          </SectionHeaderContent>
        </SectionHeader>
      </div>
      <SuspenseQueryWrapper fallback={<SessionResultCardSkeleton />}>
        <SuspenseQuery
          options={oralSessionSummaryQueryOptions(apiHttpClient, user.id, {
            params: { qualificationPathId: selectedPath.id, sessionId },
          })}
          isDataEmpty={summary => summary === null}
          noDataFallback={<MissingOralSessionSummary />}
        >
          {summary => (
            <>
              <OralSessionResultCard summary={summary} />
              <OralSessionQuestionsCard sessionId={summary.id} />
              <OralSessionQuizCard />
              <OralSessionNextStepCard />
            </>
          )}
        </SuspenseQuery>
      </SuspenseQueryWrapper>
    </section>
  )
}

const MissingOralSessionSummary = () => (
  <Card>
    <CardContent>
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <IconWrapper>
              <FileQuestionMark />
            </IconWrapper>
          </EmptyMedia>
          <EmptyTitle>
            <h2>Brak podsumowania</h2>
          </EmptyTitle>
          <EmptyDescription>
            Podsumowanie jest dostępne po zakończeniu sesji nauki ustnej z Twojej ścieżki.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            nativeButton={false}
            render={<Link to="/ustny" />}
          >
            Wróć do nauki
          </Button>
        </EmptyContent>
      </Empty>
    </CardContent>
  </Card>
)
