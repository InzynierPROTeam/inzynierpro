import type { AttemptQuestion } from '@inzpro/api-contracts/modules/mock-exams/responses'
import {
  attemptQuestionQueryOptions,
  mockExamAttemptQueryOptions,
} from '@inzpro/queries/modules/mock-exams/queries'
import { Button } from '@inzpro/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader } from '@inzpro/ui/components/card'
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
import type React from 'react'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { SessionAnswerFormSkeleton } from '~platform/features/learningSession/components/SessionAnswerFormSkeleton'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { attemptQuestionRouteApi } from '../utils'
import { AttemptAnswerForm } from './AttemptAnswerForm'

export const AttemptQuestionCard = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { attemptId, questionNumber } = attemptQuestionRouteApi.useParams()

  return (
    <Card className="w-full max-w-3xl self-center">
      <SuspenseQueryWrapper fallback={<AttemptQuestionSkeleton />}>
        <SuspenseQuery
          options={attemptQuestionQueryOptions(apiHttpClient, user.id, {
            params: { qualificationPathId: selectedPath.id, attemptId, position: questionNumber },
          })}
          isDataEmpty={question => question === null}
          noDataFallback={<MissingAttemptQuestion />}
        >
          {question => <AttemptQuestionContent question={question} />}
        </SuspenseQuery>
      </SuspenseQueryWrapper>
    </Card>
  )
}

type AttemptQuestionContentProps = { question: AttemptQuestion }

const AttemptQuestionContent: React.FC<AttemptQuestionContentProps> = ({ question }) => (
  <>
    <CardHeader>
      <AttemptSectionName section={question.section} />
      <h2 className="text-base leading-relaxed font-medium">{question.body}</h2>
    </CardHeader>
    <CardContent>
      <AttemptAnswerForm
        key={question.position}
        question={question}
      />
    </CardContent>
  </>
)

type AttemptSectionNameProps = { section: AttemptQuestion['section'] }

const AttemptSectionName: React.FC<AttemptSectionNameProps> = ({ section }) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { attemptId } = attemptQuestionRouteApi.useParams()

  return (
    <SuspenseQueryWrapper fallback={null}>
      <SuspenseQuery
        options={mockExamAttemptQueryOptions(apiHttpClient, user.id, {
          params: { qualificationPathId: selectedPath.id, attemptId },
        })}
        isDataEmpty={attempt => attempt === null}
        noDataFallback={null}
      >
        {attempt => (
          <CardDescription>
            {attempt.sections.find(({ position }) => position === section)?.name}
          </CardDescription>
        )}
      </SuspenseQuery>
    </SuspenseQueryWrapper>
  )
}

const AttemptQuestionSkeleton = () => (
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

const MissingAttemptQuestion = () => (
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
          To podejście nie istnieje, należy do innej ścieżki lub nie ma pytania o tym numerze.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          nativeButton={false}
          render={<Link to="/egzamin-probny" />}
        >
          Wróć do egzaminu próbnego
        </Button>
      </EmptyContent>
    </Empty>
  </CardContent>
)
