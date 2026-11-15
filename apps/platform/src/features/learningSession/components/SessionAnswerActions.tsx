import type { SessionQuestion } from '@inzpro/api-contracts/modules/study/responses'
import { nextQuestionPosition } from '@inzpro/domain/modules/study/study-session'
import { sessionQueryOptions } from '@inzpro/queries/modules/study'
import { Button } from '@inzpro/ui/components/button'
import { useIsMutating, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { LoaderCircle } from 'lucide-react'
import type React from 'react'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { useEndSession } from '../hooks/useEndSession'
import { recordAssistanceMutationKey } from '../hooks/useRecordSessionAssistance'
import { sessionNextStep } from '../utils'

type SessionAnswerActionsProps = {
  question: SessionQuestion
  // Answered, withdrawn or in an ended session: nothing to check, only to move on.
  isClosed: boolean
  isSubmitting: boolean
}

/** Checks an unanswered question; once answered or withdrawn, moves on to the next one or the summary. */
export const SessionAnswerActions: React.FC<SessionAnswerActionsProps> = ({
  question,
  isClosed,
  isSubmitting,
}) => {
  const { selectedPath } = onboardedRouteApi.useRouteContext()

  // Checking waits for a pending hint record so the answer is stored as assisted.
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

  // A withdrawn question is skipped rather than answered.
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

  // As in V1, the last question ends the session on the way to its summary; so does a session whose
  // remaining questions were all withdrawn.
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
          // Moving between questions does not add history entries to step through on the way back.
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
