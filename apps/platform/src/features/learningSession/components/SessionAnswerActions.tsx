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

import { recordAssistanceMutationKey } from '../hooks/useRecordSessionAssistance'

type SessionAnswerActionsProps = { question: SessionQuestion; isSubmitting: boolean }

/** Checks an unanswered question; once answered or withdrawn, moves on to the next one. */
export const SessionAnswerActions: React.FC<SessionAnswerActionsProps> = ({
  question,
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
  if (question.answer !== null || question.isWithdrawn) {
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

  // Completing a session belongs to a later ticket; after the last question the user goes back.
  const next = nextQuestionPosition(question.position, session.progress.total)

  if (next === question.position) {
    return (
      <Button
        nativeButton={false}
        render={<Link to="/nauka" />}
      >
        Wróć do kategorii
      </Button>
    )
  }

  return (
    <Button
      nativeButton={false}
      render={
        <Link
          to="/nauka/sesja/$sessionId/$questionNumber"
          params={{
            sessionId: question.sessionId,
            questionNumber: next,
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
