import { StudySessionAlreadyStarted } from '@inzpro/api-contracts/modules/study/errors'
import type {
  QuestionCount,
  ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import type { SessionQuestionSelection } from '@inzpro/domain/modules/study/study-session'
import { Button } from '@inzpro/ui/components/button'
import { toast } from '@inzpro/ui/components/toast'
import { useNavigate } from '@tanstack/react-router'
import { Predicate, Schema } from 'effect'
import type React from 'react'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

import { useStartSession } from '../hooks/useStartSession'

type StartSessionButtonProps = {
  documentId: ReferenceDocumentId
  questionCount: QuestionCount
  questionSelection: SessionQuestionSelection
  disabled: boolean
}

export const StartSessionButton: React.FC<StartSessionButtonProps> = ({
  documentId,
  questionCount,
  questionSelection,
  disabled,
}) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const mutation = useStartSession(user.id)
  const navigate = useNavigate()

  const startSession = () =>
    toast.promise(
      mutation.mutateAsync({
        params: { qualificationPathId: selectedPath.id },
        payload: { documentId, questionCount, questionSelection },
      }),
      {
        loading: { title: 'Rozpoczynanie sesji…' },
        success: { title: 'Sesja nauki została rozpoczęta.' },
        error: error => {
          if (Schema.is(StudySessionAlreadyStarted)(error)) {
            return {
              title: 'Masz już rozpoczętą sesję z tej kategorii.',
              actionProps: {
                children: 'Przejdź do sesji',
                onClick: () =>
                  void navigate({
                    to: '/nauka/sesja/$sessionId/$questionNumber',
                    params: {
                      sessionId: error.sessionId,
                      questionNumber: error.currentPosition,
                    },
                    replace: true,
                  }),
              },
            }
          }

          return {
            title: Predicate.isTagged(error, 'StaleSessionPreview')
              ? 'Dostępne pytania zmieniły się. Sprawdź szczegóły sesji i spróbuj ponownie.'
              : 'Nie udało się rozpocząć sesji. Spróbuj ponownie.',
          }
        },
      },
    )

  return (
    <Button
      disabled={disabled || mutation.isPending}
      onClick={startSession}
    >
      Zacznij sesję
    </Button>
  )
}
