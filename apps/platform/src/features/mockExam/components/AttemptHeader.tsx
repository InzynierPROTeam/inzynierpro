import type { MockExamAttempt } from '@inzpro/api-contracts/modules/mock-exams/responses'
import type { MockExamAttemptId } from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { AttemptQuestionPosition } from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { mockExamAttemptQueryOptions } from '@inzpro/queries/modules/mock-exams/queries'
import type React from 'react'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import {
  SessionHeader,
  SessionHeaderNav,
  SessionHeaderNext,
  SessionHeaderPrevious,
  SessionHeaderSkeleton,
  SessionHeaderTitle,
  SessionTraverseLink,
} from '~platform/features/learningSession/components/SessionHeader'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { useLeaveEndedAttempt } from '../hooks/useLeaveEndedAttempt'
import { attemptQuestionRouteApi } from '../utils'
import { AttemptTimer, PausedAttemptTimer } from './AttemptTimer'
import { PauseAttemptButton } from './PauseAttemptButton'

export const AttemptHeader = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { attemptId } = attemptQuestionRouteApi.useParams()

  return (
    <SuspenseQueryWrapper fallback={<SessionHeaderSkeleton />}>
      <SuspenseQuery
        options={mockExamAttemptQueryOptions(apiHttpClient, user.id, {
          params: { qualificationPathId: selectedPath.id, attemptId },
        })}
        isDataEmpty={attempt => attempt === null}
        noDataFallback={null}
      >
        {attempt => <AttemptHeaderContent attempt={attempt} />}
      </SuspenseQuery>
    </SuspenseQueryWrapper>
  )
}

type AttemptHeaderContentProps = { attempt: MockExamAttempt }

const AttemptHeaderContent: React.FC<AttemptHeaderContentProps> = ({ attempt }) => {
  const { questionNumber } = attemptQuestionRouteApi.useParams()
  const total = attempt.questionCount

  useLeaveEndedAttempt(attempt)

  return (
    <SessionHeader>
      <SessionHeaderNav aria-label="Przechodzenie między pytaniami">
        <SessionHeaderTitle>
          Pytanie {questionNumber} <span className="text-muted-foreground">z {total}</span>
        </SessionHeaderTitle>
        <SessionHeaderPrevious>
          {questionNumber > 1 && (
            <AttemptTraverseLink
              direction="previous"
              attemptId={attempt.id}
              questionNumber={AttemptQuestionPosition.make(questionNumber - 1)}
            />
          )}
        </SessionHeaderPrevious>
        <SessionHeaderNext>
          {questionNumber < total && (
            <AttemptTraverseLink
              direction="next"
              attemptId={attempt.id}
              questionNumber={AttemptQuestionPosition.make(questionNumber + 1)}
            />
          )}
        </SessionHeaderNext>
      </SessionHeaderNav>
      {attempt.status === 'in-progress' && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <AttemptTimer attempt={attempt} />
          <PauseAttemptButton />
        </div>
      )}
      {attempt.status === 'paused' && <PausedAttemptTimer attempt={attempt} />}
      <p className="text-muted-foreground text-center text-sm">
        Czas: {attempt.durationMinutes} min • Próg zaliczenia: {attempt.passThreshold} z {total}
      </p>
    </SessionHeader>
  )
}

type AttemptTraverseLinkProps = {
  direction: 'previous' | 'next'
  attemptId: MockExamAttemptId
  questionNumber: AttemptQuestionPosition
}

const AttemptTraverseLink: React.FC<AttemptTraverseLinkProps> = ({
  direction,
  attemptId,
  questionNumber,
}) => (
  <SessionTraverseLink
    direction={direction}
    to="/egzamin-probny/podejscie/$attemptId/$questionNumber"
    params={{ attemptId, questionNumber }}
    resetScroll={false}
    replace
    preload="render"
  />
)
