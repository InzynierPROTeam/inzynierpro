import { sessionSummaryQueryOptions } from '@inzpro/queries/modules/study'
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
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { sessionSummaryRouteApi } from '../utils'
import { SessionNextStepCard } from './SessionNextStepCard'
import { SessionQuestionResultsCard } from './SessionQuestionResultsCard'
import { SessionResultCard, SessionResultCardSkeleton } from './SessionResultCard'

/** The result of a session, then its questions, then one step further (V1's session summary). */
export const SessionSummarySection = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { sessionId } = sessionSummaryRouteApi.useParams()

  return (
    <section className="app-layout-section @container gap-8">
      <div className="flex flex-col gap-6">
        <BackLink fallback={{ to: '/nauka' }} />
        <SectionHeader>
          <SectionHeaderContent>
            <SectionHeaderTitle render={<h1 />}>Podsumowanie sesji</SectionHeaderTitle>
            <SectionHeaderDescription>
              Zobacz, jak poszło Ci w tej sesji nauki.
            </SectionHeaderDescription>
          </SectionHeaderContent>
        </SectionHeader>
      </div>
      <SuspenseQueryWrapper fallback={<SessionResultCardSkeleton />}>
        <SuspenseQuery
          options={sessionSummaryQueryOptions(apiHttpClient, user.id, {
            params: { qualificationPathId: selectedPath.id, sessionId },
          })}
          isDataEmpty={summary => summary === null}
          noDataFallback={<MissingSessionSummary />}
        >
          {summary => (
            <>
              <SessionResultCard summary={summary} />
              <SessionQuestionResultsCard sessionId={summary.id} />
              <SessionNextStepCard summary={summary} />
            </>
          )}
        </SuspenseQuery>
      </SuspenseQueryWrapper>
    </section>
  )
}

const MissingSessionSummary = () => (
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
            Podsumowanie jest dostępne po zakończeniu sesji nauki z Twojej ścieżki.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            nativeButton={false}
            render={<Link to="/nauka" />}
          >
            Wróć do nauki
          </Button>
        </EmptyContent>
      </Empty>
    </CardContent>
  </Card>
)
