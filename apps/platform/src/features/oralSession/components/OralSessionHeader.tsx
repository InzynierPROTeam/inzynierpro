import type { OralStudySession } from '@inzpro/api-contracts/modules/study/responses'
import type { OralStudySessionId } from '@inzpro/domain/modules/study/oral-study-session'
import { SessionQuestionPosition } from '@inzpro/domain/modules/study/study-session'
import { oralSessionQueryOptions } from '@inzpro/queries/modules/study'
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
import { SessionProgress } from '~platform/features/learningSession/components/SessionProgress'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { oralSessionQuestionRouteApi } from '../utils'

export const OralSessionHeader = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { sessionId } = oralSessionQuestionRouteApi.useParams()

  return (
    <SuspenseQueryWrapper fallback={<SessionHeaderSkeleton />}>
      <SuspenseQuery
        options={oralSessionQueryOptions(apiHttpClient, user.id, {
          params: { qualificationPathId: selectedPath.id, sessionId },
        })}
        isDataEmpty={session => session === null}
        // The question card explains a missing session.
        noDataFallback={null}
      >
        {session => <OralSessionHeaderContent session={session} />}
      </SuspenseQuery>
    </SuspenseQueryWrapper>
  )
}

type OralSessionHeaderContentProps = { session: OralStudySession }

const OralSessionHeaderContent: React.FC<OralSessionHeaderContentProps> = ({ session }) => {
  const { questionNumber } = oralSessionQuestionRouteApi.useParams()
  const { total } = session.progress

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
              questionNumber={SessionQuestionPosition.make(questionNumber - 1)}
            />
          )}
        </SessionHeaderPrevious>
        <SessionHeaderNext>
          {questionNumber < total && (
            <QuestionTraverseLink
              direction="next"
              sessionId={session.id}
              questionNumber={SessionQuestionPosition.make(questionNumber + 1)}
            />
          )}
        </SessionHeaderNext>
      </SessionHeaderNav>
      <SessionProgress progress={session.progress} />
    </SessionHeader>
  )
}

type QuestionTraverseLinkProps = {
  direction: 'previous' | 'next'
  sessionId: OralStudySessionId
  questionNumber: SessionQuestionPosition
}

const QuestionTraverseLink: React.FC<QuestionTraverseLinkProps> = ({
  direction,
  sessionId,
  questionNumber,
}) => (
  <SessionTraverseLink
    direction={direction}
    to="/ustny/sesja/$sessionId/$questionNumber"
    params={{ sessionId, questionNumber }}
    resetScroll={false}
    // Moving between questions does not add history entries to step through on the way back.
    replace
    // Loads the neighbouring question as soon as this one shows, so stepping to it is instant
    // without a hover first (touch screens).
    preload="render"
  />
)
