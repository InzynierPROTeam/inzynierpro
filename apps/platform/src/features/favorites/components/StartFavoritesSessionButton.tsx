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

import { useStartFavoritesSession } from '../hooks/useStartFavoritesSession'

type StartFavoritesSessionButtonProps = {
  documentId: ReferenceDocumentId | undefined
  questionCount: QuestionCount
}

export const StartFavoritesSessionButton: React.FC<StartFavoritesSessionButtonProps> = ({
  documentId,
  questionCount,
}) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const mutation = useStartFavoritesSession(user.id)
  const navigate = useNavigate()

  const startSession = () =>
    toast.promise(
      mutation.mutateAsync({
        params: { qualificationPathId: selectedPath.id },
        payload: { documentId, questionCount },
      }),
      {
        loading: { title: 'Rozpoczynanie sesji ulubionych…' },
        success: { title: 'Sesja ulubionych została rozpoczęta.' },
        error: error => {
          if (Schema.is(StudySessionAlreadyStarted)(error)) {
            return {
              title: 'Masz już rozpoczętą sesję ulubionych w tym zakresie.',
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
              ? 'Twoje ulubione pytania zmieniły się. Sprawdź szczegóły i spróbuj ponownie.'
              : 'Nie udało się rozpocząć sesji ulubionych. Spróbuj ponownie.',
          }
        },
      },
    )

  return (
    <Button
      disabled={mutation.isPending}
      onClick={startSession}
    >
      Zacznij sesję ulubionych
    </Button>
  )
}
