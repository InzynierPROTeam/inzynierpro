import type { OralSessionQuestionResult } from '@inzpro/api-contracts/modules/study/responses'
import type { OralStudySessionId } from '@inzpro/domain/modules/study/oral-study-session'
import { oralSessionResultsInfiniteQueryOptions } from '@inzpro/queries/modules/study'
import { Button } from '@inzpro/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@inzpro/ui/components/card'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import { Skeleton } from '@inzpro/ui/components/skeleton'
import { Link } from '@tanstack/react-router'
import { LoaderCircle } from 'lucide-react'
import type React from 'react'
import { cx } from 'tailwind-variants'
import {
  SuspenseInfiniteQuery,
  SuspenseQueryWrapper,
} from '~platform/components/SuspenseQueryBoundary'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { selfAssessmentLevels } from '../utils'

type OralSessionQuestionsCardProps = { sessionId: OralStudySessionId }

export const OralSessionQuestionsCard: React.FC<OralSessionQuestionsCardProps> = ({
  sessionId,
}) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Pytania i Twoja samoocena</h2>
        </CardTitle>
        <CardDescription>Wybierz pytanie, aby wrócić do jego opracowania.</CardDescription>
      </CardHeader>
      <CardContent>
        <SuspenseQueryWrapper fallback={<QuestionResultsSkeleton />}>
          <SuspenseInfiniteQuery
            options={oralSessionResultsInfiniteQueryOptions(apiHttpClient, user.id, {
              params: { qualificationPathId: selectedPath.id, sessionId },
              query: {},
            })}
            // A missing, foreign or unfinished session has no results; the summary above already says so.
            isDataEmpty={data => data.pages.every(page => page.data.length === 0)}
            noDataFallback={null}
          >
            {({ data, hasNextPage, isFetchingNextPage, fetchNextPage }) => (
              <div className="flex flex-col gap-4">
                <ol
                  aria-label="Pytania sesji"
                  className="flex flex-wrap gap-3"
                >
                  {data.pages
                    .flatMap(page => page.data)
                    .map(result => (
                      <li key={result.position}>
                        <QuestionResultLink
                          sessionId={sessionId}
                          result={result}
                        />
                      </li>
                    ))}
                </ol>
                {hasNextPage && (
                  <Button
                    variant="outline"
                    className="self-center"
                    disabled={isFetchingNextPage}
                    onClick={() => void fetchNextPage()}
                  >
                    {isFetchingNextPage && <LoaderCircle className="animate-spin" />}
                    Pokaż kolejne pytania
                  </Button>
                )}
              </div>
            )}
          </SuspenseInfiniteQuery>
        </SuspenseQueryWrapper>
      </CardContent>
    </Card>
  )
}

const resultLabel = (result: OralSessionQuestionResult) =>
  result.selfAssessment === null
    ? result.isWithdrawn
      ? 'pytanie wycofane'
      : 'bez samooceny'
    : selfAssessmentLevels[result.selfAssessment].label

type QuestionResultLinkProps = {
  sessionId: OralStudySessionId
  result: OralSessionQuestionResult
}

const QuestionResultLink: React.FC<QuestionResultLinkProps> = ({ sessionId, result }) => (
  <Link
    to="/ustny/sesja/$sessionId/$questionNumber"
    params={{ sessionId, questionNumber: result.position }}
    aria-label={`Pytanie ${result.position}: ${resultLabel(result)}`}
    className="group/result block rounded-full"
  >
    <IconWrapper
      className={cx(
        'border text-sm font-semibold transition-colors duration-150',
        result.selfAssessment === null
          ? 'border-border bg-background/50 text-muted-foreground group-hover/result:bg-muted'
          : selfAssessmentLevels[result.selfAssessment].linkClassName,
      )}
    >
      {result.position}
    </IconWrapper>
  </Link>
)

const QuestionResultsSkeleton = () => (
  <div className="flex flex-wrap gap-3">
    {Array.from({ length: 10 }, (_, index) => (
      <Skeleton
        key={index}
        className="size-10 rounded-full"
      />
    ))}
  </div>
)
