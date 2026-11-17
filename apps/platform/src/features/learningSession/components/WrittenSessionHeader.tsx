import type { GetSessionRes } from '@inzpro/api-client/modules/written-study'
import { SessionQuestionPosition } from '@inzpro/domain/modules/learning/study-session'
import { sessionQueryOptions } from '@inzpro/queries/modules/written-study/queries'
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
import { sessionQuestionRouteApi } from '~platform/features/learningSession/utils/session'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { SessionProgress } from './SessionProgress'

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
  sessionId: NonNullable<GetSessionRes>['id']
  questionNumber: SessionQuestionPosition
}

const QuestionTraverseLink: React.FC<QuestionTraverseLinkProps> = ({
  direction,
  sessionId,
  questionNumber,
}) => (
  <SessionTraverseLink
    direction={direction}
    to="/nauka/sesja/$sessionId/$questionNumber"
    params={{ sessionId, questionNumber }}
    resetScroll={false}
    replace
    preload="render"
  />
)
