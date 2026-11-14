import type { GetSessionRes } from '@inzpro/api-client/modules/study'
import { SessionQuestionPosition } from '@inzpro/domain/modules/study/study-session'
import { sessionQueryOptions } from '@inzpro/queries/modules/study'
import { Progress, ProgressLabel, ProgressValue } from '@inzpro/ui/components/progress'
import type React from 'react'
import {
  SessionHeader,
  SessionHeaderNav,
  SessionHeaderNext,
  SessionHeaderPrevious,
  SessionHeaderSkeleton,
  SessionHeaderTitle,
  SessionTraverseLink,
} from '~platform/components/session/SessionHeader'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { sessionQuestionRouteApi } from '../utils'

export const WrittenSessionHeader = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { sessionId } = sessionQuestionRouteApi.useParams()

  return (
    <SuspenseQueryWrapper fallback={<SessionHeaderSkeleton />}>
      <SuspenseQuery
        options={sessionQueryOptions(apiHttpClient, user.id, {
          params: { qualificationPathId: selectedPath.id, sessionId },
        })}
        isDataEmpty={session => session === null}
        // The question card explains a missing session.
        noDataFallback={null}
      >
        {session => <WrittenSessionHeaderContent session={session} />}
      </SuspenseQuery>
    </SuspenseQueryWrapper>
  )
}

type WrittenSessionHeaderContentProps = { session: NonNullable<GetSessionRes> }

const WrittenSessionHeaderContent: React.FC<WrittenSessionHeaderContentProps> = ({ session }) => {
  const { questionNumber } = sessionQuestionRouteApi.useParams()
  const { total, answered, percent } = session.progress

  return (
    <SessionHeader>
      <SessionHeaderNav aria-label="Pytania sesji">
        <SessionHeaderTitle>
          Pytanie {questionNumber} <span className="text-muted-foreground">z {total}</span>
        </SessionHeaderTitle>
        <SessionHeaderPrevious>
          {questionNumber > 1 && (
            <QuestionTraverseLink
              direction="previous"
              sessionId={session.id}
              questionNumber={questionNumber - 1}
            />
          )}
        </SessionHeaderPrevious>
        <SessionHeaderNext>
          {questionNumber < total && (
            <QuestionTraverseLink
              direction="next"
              sessionId={session.id}
              questionNumber={questionNumber + 1}
            />
          )}
        </SessionHeaderNext>
      </SessionHeaderNav>
      <Progress
        value={percent}
        size="sm"
      >
        <ProgressLabel>
          Odpowiedziano {answered} / {total}
        </ProgressLabel>
        <ProgressValue />
      </Progress>
    </SessionHeader>
  )
}

type QuestionTraverseLinkProps = {
  direction: 'previous' | 'next'
  sessionId: NonNullable<GetSessionRes>['id']
  questionNumber: number
}

const QuestionTraverseLink: React.FC<QuestionTraverseLinkProps> = ({
  direction,
  sessionId,
  questionNumber,
}) => (
  <SessionTraverseLink
    direction={direction}
    to="/nauka/sesja/$sessionId/$questionNumber"
    params={{ sessionId, questionNumber: SessionQuestionPosition.make(questionNumber) }}
    resetScroll={false}
    // Moving between questions does not add history entries to step through on the way back.
    replace
    // Loads the neighbouring question as soon as this one shows, so stepping to it is instant
    // without a hover first (touch screens).
    preload="render"
  />
)
