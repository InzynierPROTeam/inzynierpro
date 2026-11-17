import type { SessionQuestionResult } from '@inzpro/api-contracts/modules/written-study/responses'
import type { StudySessionId } from '@inzpro/domain/modules/learning/study-session'
import { sessionResultsInfiniteQueryOptions } from '@inzpro/queries/modules/written-study/queries'
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
import type React from 'react'
import { cx } from 'tailwind-variants'
import { InfiniteQueryFooter } from '~platform/components/InfiniteQueryFooter'
import {
  SuspenseInfiniteQuery,
  SuspenseQueryWrapper,
} from '~platform/components/SuspenseQueryBoundary'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

type SessionQuestionResultsCardProps = { sessionId: StudySessionId }

export const SessionQuestionResultsCard: React.FC<SessionQuestionResultsCardProps> = ({
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
          <h2>Pytania i Twoje odpowiedzi</h2>
        </CardTitle>
        <CardDescription>Wybierz pytanie, aby zobaczyć odpowiedź i wyjaśnienie.</CardDescription>
      </CardHeader>
      <CardContent>
        <SuspenseQueryWrapper fallback={<QuestionResultsSkeleton />}>
          <SuspenseInfiniteQuery
            options={sessionResultsInfiniteQueryOptions(apiHttpClient, user.id, {
              params: { qualificationPathId: selectedPath.id, sessionId },
              query: {},
            })}
            isDataEmpty={data => data.pages.every(page => page.data.length === 0)}
            noDataFallback={null}
          >
            {({ data, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage }) => (
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
  )
}

const resultLabel = (result: SessionQuestionResult) =>
  result.answer === null
    ? result.isWithdrawn
      ? 'pytanie wycofane'
      : 'bez odpowiedzi'
    : result.answer.isCorrect
      ? 'poprawna odpowiedź'
      : 'błędna odpowiedź'

type QuestionResultLinkProps = { sessionId: StudySessionId; result: SessionQuestionResult }

const QuestionResultLink: React.FC<QuestionResultLinkProps> = ({ sessionId, result }) => (
  <Link
    to="/nauka/sesja/$sessionId/$questionNumber"
    params={{ sessionId, questionNumber: result.position }}
    aria-label={`Pytanie ${result.position}: ${resultLabel(result)}`}
    className="group/result block rounded-full"
  >
    <IconWrapper
      className={cx(
        'border text-sm font-semibold transition-colors duration-150',
        result.answer === null &&
          'border-border bg-background/50 text-muted-foreground group-hover/result:bg-muted',
        result.answer?.isCorrect === true &&
          'border-success/50 bg-success/10 text-success group-hover/result:bg-success/20',
        result.answer?.isCorrect === false &&
          'border-destructive/50 bg-destructive/10 text-destructive group-hover/result:bg-destructive/20',
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
