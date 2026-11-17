import type { SessionQuestion } from '@inzpro/api-contracts/modules/written-study/responses'
import { nextQuestionPosition } from '@inzpro/domain/modules/learning/study-session'
import { sessionQueryOptions } from '@inzpro/queries/modules/written-study/queries'
import { Button } from '@inzpro/ui/components/button'
import { useIsMutating, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { LoaderCircle } from 'lucide-react'
import type React from 'react'
import { sessionNextStep } from '~platform/features/learningSession/utils/session'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { useEndSession } from '../hooks/useEndSession'
import { recordAssistanceMutationKey } from '../hooks/useRecordSessionAssistance'

type SessionAnswerActionsProps = {
  question: SessionQuestion
  isClosed: boolean
  isSubmitting: boolean
}

export const SessionAnswerActions: React.FC<SessionAnswerActionsProps> = ({
  question,
  isClosed,
  isSubmitting,
}) => {
  const { selectedPath } = onboardedRouteApi.useRouteContext()

  const isRecordingAssistance =
    useIsMutating({
      mutationKey: recordAssistanceMutationKey({
        params: {
          qualificationPathId: selectedPath.id,
          sessionId: question.sessionId,
          position: question.position,
        },
      }),
    }) > 0

  if (isClosed) {
    return <NextQuestionButton question={question} />
  }

  return (
    <Button
      type="submit"
      disabled={isSubmitting || isRecordingAssistance}
    >
      {isSubmitting && <LoaderCircle className="animate-spin" />}
      Sprawdź
    </Button>
  )
}

type NextQuestionButtonProps = { question: SessionQuestion }

const NextQuestionButton: React.FC<NextQuestionButtonProps> = ({ question }) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { data: session } = useQuery(
    sessionQueryOptions(apiHttpClient, user.id, {
      params: { qualificationPathId: selectedPath.id, sessionId: question.sessionId },
    }),
  )

  if (session === undefined || session === null) {
    return null
  }

  const step = sessionNextStep(question.position, session)

  if (step === 'summary') {
    return (
      <Button
        nativeButton={false}
        render={
          <Link
            to="/nauka/sesja/$sessionId/podsumowanie"
            params={{ sessionId: question.sessionId }}
            replace
          />
        }
      >
        Zobacz podsumowanie
      </Button>
    )
  }

  if (step === 'end') {
    return <EndSessionButton sessionId={question.sessionId} />
  }

  return (
    <Button
      nativeButton={false}
      render={
        <Link
          to="/nauka/sesja/$sessionId/$questionNumber"
          params={{
            sessionId: question.sessionId,
            questionNumber: nextQuestionPosition(question.position, session.progress.total),
          }}
          resetScroll={false}
          replace
        />
      }
    >
      Następne pytanie
    </Button>
  )
}

type EndSessionButtonProps = { sessionId: SessionQuestion['sessionId'] }

const EndSessionButton: React.FC<EndSessionButtonProps> = ({ sessionId }) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const mutation = useEndSession(user.id)

  return (
    <Button
      type="button"
      disabled={mutation.isPending}
      onClick={() =>
        mutation.mutate({ params: { qualificationPathId: selectedPath.id, sessionId } })
      }
    >
      {mutation.isPending && <LoaderCircle className="animate-spin" />}
      Zobacz podsumowanie
    </Button>
  )
}
