import type { OralSessionQuiz } from '@inzpro/api-contracts/modules/study/responses'
import {
  oralQuizChecksInfiniteQueryOptions,
  oralSessionQuizQueryOptions,
} from '@inzpro/queries/modules/study'
import { Button } from '@inzpro/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@inzpro/ui/components/card'
import { TextSkeleton } from '@inzpro/ui/components/text-skeleton'
import { useQuery } from '@tanstack/react-query'
import { LoaderCircle } from 'lucide-react'
import type React from 'react'
import {
  SuspenseInfiniteQuery,
  SuspenseQueryWrapper,
} from '~platform/components/SuspenseQueryBoundary'
import { SessionAnswerFormSkeleton } from '~platform/features/learningSession/components/SessionAnswerForm'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { useStartOralSessionQuiz } from '../hooks/useStartOralSessionQuiz'
import { oralSessionSummaryRouteApi, supportedKnowledgeCheckFormats } from '../utils'
import { OralQuizCheckForm } from './OralQuizCheckForm'

export const OralSessionQuizCard = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { sessionId } = oralSessionSummaryRouteApi.useParams()

  const { data } = useQuery(
    oralSessionQuizQueryOptions(apiHttpClient, user.id, {
      params: { qualificationPathId: selectedPath.id, sessionId },
    }),
  )

  if (data === undefined || data === null) {
    return null
  }

  const { quiz, availableFormats } = data

  if (quiz !== null) {
    return <OralSessionQuizChecks quiz={quiz} />
  }

  if (!availableFormats.some(format => supportedKnowledgeCheckFormats.includes(format))) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Sprawdź swoją wiedzę</h2>
        </CardTitle>
        <CardDescription>
          Odpowiedz na kilka krótkich pytań z materiału tej sesji. To opcjonalne: sesja jest już
          zapisana.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <StartQuizButton />
      </CardContent>
    </Card>
  )
}

const StartQuizButton = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { sessionId } = oralSessionSummaryRouteApi.useParams()
  const mutation = useStartOralSessionQuiz(user.id)

  const startQuiz = () =>
    mutation.mutate({
      params: { qualificationPathId: selectedPath.id, sessionId },
      payload: { formats: supportedKnowledgeCheckFormats },
    })

  return (
    <Button
      type="button"
      disabled={mutation.isPending}
      onClick={startQuiz}
    >
      {mutation.isPending && <LoaderCircle className="animate-spin" />}
      Sprawdź wiedzę
    </Button>
  )
}

type OralSessionQuizChecksProps = { quiz: OralSessionQuiz }

const OralSessionQuizChecks: React.FC<OralSessionQuizChecksProps> = ({ quiz }) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  return (
    <section
      aria-labelledby="oral-session-quiz-title"
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="oral-session-quiz-title"
          className="text-xl font-semibold"
        >
          Sprawdź swoją wiedzę
        </h2>
        <p className="text-muted-foreground text-sm">
          Odpowiedziano {quiz.answeredCount} / {quiz.checkCount}
        </p>
      </div>
      <SuspenseQueryWrapper fallback={<OralQuizCheckSkeleton />}>
        <SuspenseInfiniteQuery
          options={oralQuizChecksInfiniteQueryOptions(apiHttpClient, user.id, {
            params: { qualificationPathId: selectedPath.id, sessionId: quiz.sessionId },
            query: {},
          })}
          isDataEmpty={data => data.pages.every(page => page.data.length === 0)}
          noDataFallback={null}
        >
          {({ data, hasNextPage, isFetchingNextPage, fetchNextPage }) => (
            <>
              {data.pages
                .flatMap(page => page.data)
                .map(check => (
                  <Card key={check.position}>
                    <CardHeader>
                      <CardDescription>
                        Pytanie {check.position} z {quiz.checkCount}
                      </CardDescription>
                      <CardTitle className="text-base leading-relaxed font-medium">
                        <h3>{check.prompt}</h3>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <OralQuizCheckForm
                        sessionId={quiz.sessionId}
                        check={check}
                      />
                    </CardContent>
                  </Card>
                ))}
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
            </>
          )}
        </SuspenseInfiniteQuery>
      </SuspenseQueryWrapper>
    </section>
  )
}

const OralQuizCheckSkeleton = () => (
  <Card>
    <CardHeader>
      <TextSkeleton className="max-w-96" />
    </CardHeader>
    <CardContent>
      <SessionAnswerFormSkeleton />
    </CardContent>
  </Card>
)
