import type {
  OralSessionQuestion,
  OralStudySession,
} from '@inzpro/api-contracts/modules/study/responses'
import {
  type OralSelfAssessment,
  oralSelfAssessmentValues,
} from '@inzpro/domain/modules/study/oral-study-session'
import { endedStudySession, hasOpenQuestions } from '@inzpro/domain/modules/study/study-session'
import { oralSessionQueryOptions } from '@inzpro/queries/modules/study'
import { Button } from '@inzpro/ui/components/button'
import { Item, ItemContent } from '@inzpro/ui/components/item'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { LoaderCircle } from 'lucide-react'
import type React from 'react'
import { useId } from 'react'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { useEndOralSession } from '../hooks/useEndOralSession'
import { useOralScaleExplained } from '../hooks/useOralScaleExplained'
import { useSubmitOralSelfAssessment } from '../hooks/useSubmitOralSelfAssessment'
import { oralScaleExplainedStore } from '../store'
import { selfAssessmentLevels } from '../utils'
import { OralDifficultyScaleExplanation, OralDifficultyScaleHelp } from './OralDifficultyScale'

type OralSelfAssessmentActionsProps = { question: OralSessionQuestion }

export const OralSelfAssessmentActions: React.FC<OralSelfAssessmentActionsProps> = ({
  question,
}) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const navigate = useNavigate()
  const submission = useSubmitOralSelfAssessment(user.id)
  const ending = useEndOralSession(user.id)

  const params = {
    qualificationPathId: selectedPath.id,
    sessionId: question.sessionId,
    position: question.position,
  }

  const moveOn = (session: OralStudySession) =>
    hasOpenQuestions(session.progress)
      ? void navigate({
          to: '/ustny/sesja/$sessionId/$questionNumber',
          params: { sessionId: session.id, questionNumber: session.progress.currentQuestion },
          resetScroll: false,
          replace: true,
        })
      : ending.mutate({
          params: { qualificationPathId: selectedPath.id, sessionId: session.id },
        })

  const assess = (selfAssessment: OralSelfAssessment) => {
    oralScaleExplainedStore.markExplained()
    submission.mutate(
      { params, payload: { oralRevisionId: question.oralRevisionId, selfAssessment } },
      { onSuccess: result => moveOn(result.session) },
    )
  }

  const stored = question.selfAssessment?.value
  const isPending = submission.isPending || ending.isPending
  const isScaleExplained = useOralScaleExplained()
  const headingId = useId()

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center gap-2">
        <h3
          id={headingId}
          className="font-medium"
        >
          Oceń trudność pytania, aby przejść dalej
        </h3>
        <OralDifficultyScaleHelp />
      </div>
      <div
        role="group"
        aria-labelledby={headingId}
        className="flex flex-wrap gap-2"
      >
        {oralSelfAssessmentValues.map(value => (
          <Button
            key={value}
            variant={stored === value ? 'primary' : 'outline'}
            className="max-sm:flex-1"
            aria-pressed={stored === value}
            disabled={stored !== undefined || question.isWithdrawn || isPending}
            onClick={() => assess(value)}
          >
            {submission.isPending && submission.variables.payload.selfAssessment === value && (
              <LoaderCircle className="animate-spin" />
            )}
            {selfAssessmentLevels[value].label}
          </Button>
        ))}
      </div>
      {!isScaleExplained && (
        <Item
          variant="outline"
          role="note"
          aria-label="Jak działa skala trudności"
        >
          <ItemContent>
            <OralDifficultyScaleExplanation />
          </ItemContent>
        </Item>
      )}
      {(stored !== undefined || question.isWithdrawn) && (
        <ClosedQuestionAction sessionId={question.sessionId} />
      )}
    </div>
  )
}

type ClosedQuestionActionProps = { sessionId: OralSessionQuestion['sessionId'] }

const ClosedQuestionAction: React.FC<ClosedQuestionActionProps> = ({ sessionId }) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const ending = useEndOralSession(user.id)

  const { data: session } = useQuery(
    oralSessionQueryOptions(apiHttpClient, user.id, {
      params: { qualificationPathId: selectedPath.id, sessionId },
    }),
  )

  if (session === undefined || session === null) {
    return null
  }

  if (session.status === endedStudySession) {
    return (
      <Button
        className="self-start"
        nativeButton={false}
        render={
          <Link
            to="/ustny/sesja/$sessionId/podsumowanie"
            params={{ sessionId }}
            replace
          />
        }
      >
        Zobacz podsumowanie
      </Button>
    )
  }

  if (!hasOpenQuestions(session.progress)) {
    return (
      <Button
        className="self-start"
        disabled={ending.isPending}
        onClick={() =>
          ending.mutate({ params: { qualificationPathId: selectedPath.id, sessionId } })
        }
      >
        {ending.isPending && <LoaderCircle className="animate-spin" />}
        Zobacz podsumowanie
      </Button>
    )
  }

  return (
    <Button
      className="self-start"
      nativeButton={false}
      render={
        <Link
          to="/ustny/sesja/$sessionId/$questionNumber"
          params={{ sessionId, questionNumber: session.progress.currentQuestion }}
          resetScroll={false}
          replace
        />
      }
    >
      Następne pytanie
    </Button>
  )
}
