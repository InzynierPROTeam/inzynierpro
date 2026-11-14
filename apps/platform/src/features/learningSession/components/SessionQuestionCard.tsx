import { sessionQuestionQueryOptions } from '@inzpro/queries/modules/study'
import { Button } from '@inzpro/ui/components/button'
import { Card, CardContent, CardHeader } from '@inzpro/ui/components/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@inzpro/ui/components/empty'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import { TextSkeleton } from '@inzpro/ui/components/text-skeleton'
import { Link } from '@tanstack/react-router'
import { FileQuestionMark } from 'lucide-react'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { sessionQuestionRouteApi } from '../utils'
import { SessionAnswerForm, SessionAnswerFormSkeleton } from './SessionAnswerForm'

export const SessionQuestionCard = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { sessionId, questionNumber } = sessionQuestionRouteApi.useParams()

  return (
    <Card className="w-full max-w-3xl self-center">
      <SuspenseQueryWrapper fallback={<SessionQuestionContentSkeleton />}>
        <SuspenseQuery
          options={sessionQuestionQueryOptions(apiHttpClient, user.id, {
            params: { qualificationPathId: selectedPath.id, sessionId, position: questionNumber },
          })}
          isDataEmpty={question => question === null}
          noDataFallback={<MissingSessionQuestion />}
        >
          {question => (
            <>
              <CardHeader>
                <h2 className="text-base leading-relaxed font-medium">{question.body}</h2>
              </CardHeader>
              <CardContent>
                <SessionAnswerForm
                  // A new question starts without a selection.
                  key={question.position}
                  answers={question.answers}
                />
              </CardContent>
            </>
          )}
        </SuspenseQuery>
      </SuspenseQueryWrapper>
    </Card>
  )
}

const SessionQuestionContentSkeleton = () => (
  <>
    <CardHeader>
      <TextSkeleton
        size="base"
        leading="relaxed"
        lines={2}
        className="max-w-xl"
      />
    </CardHeader>
    <CardContent>
      <SessionAnswerFormSkeleton />
    </CardContent>
  </>
)

const MissingSessionQuestion = () => (
  <CardContent>
    <Empty>
      <EmptyHeader>
        <EmptyMedia>
          <IconWrapper>
            <FileQuestionMark />
          </IconWrapper>
        </EmptyMedia>
        <EmptyTitle>
          <h1>Nie znaleziono pytania</h1>
        </EmptyTitle>
        <EmptyDescription>
          Ta sesja nauki nie istnieje, należy do innej ścieżki lub nie ma pytania o tym numerze.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          nativeButton={false}
          render={<Link to="/nauka" />}
        >
          Wróć do kategorii
        </Button>
      </EmptyContent>
    </Empty>
  </CardContent>
)
