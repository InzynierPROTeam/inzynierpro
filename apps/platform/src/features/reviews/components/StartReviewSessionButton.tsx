import { StudySessionAlreadyStarted } from '@inzpro/api-contracts/modules/study/errors'
import type {
  QuestionCount,
  ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import { Button } from '@inzpro/ui/components/button'
import { toast } from '@inzpro/ui/components/toast'
import { useNavigate } from '@tanstack/react-router'
import { Predicate, Schema } from 'effect'
import type React from 'react'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

import { useStartReviewSession } from '../hooks/useStartReviewSession'

type StartReviewSessionButtonProps = {
  documentId: ReferenceDocumentId | undefined
  questionCount: QuestionCount
}

export const StartReviewSessionButton: React.FC<StartReviewSessionButtonProps> = ({
  documentId,
  questionCount,
}) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const mutation = useStartReviewSession(user.id)
  const navigate = useNavigate()

  const startSession = () =>
    toast.promise(
      mutation.mutateAsync({
        params: { qualificationPathId: selectedPath.id },
        payload: { documentId, questionCount },
      }),
      {
        loading: { title: 'Rozpoczynanie powtórki…' },
        success: { title: 'Powtórka została rozpoczęta.' },
        error: error => {
          if (Schema.is(StudySessionAlreadyStarted)(error)) {
            return {
              title: 'Masz już rozpoczętą powtórkę w tym zakresie.',
              actionProps: {
                children: 'Przejdź do powtórki',
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
              ? 'Pytania do powtórki zmieniły się. Sprawdź szczegóły i spróbuj ponownie.'
              : 'Nie udało się rozpocząć powtórki. Spróbuj ponownie.',
          }
        },
      },
    )

  return (
    <Button
      disabled={mutation.isPending}
      onClick={startSession}
    >
      Zacznij powtórkę
    </Button>
  )
}
