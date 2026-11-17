import { OralSessionAlreadyStarted } from '@inzpro/api-contracts/modules/oral-study/errors'
import type { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { Button } from '@inzpro/ui/components/button'
import { toast } from '@inzpro/ui/components/toast'
import { useNavigate } from '@tanstack/react-router'
import { Predicate, Schema } from 'effect'
import type React from 'react'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

import { useStartOralFavoritesSession } from '../hooks/useStartOralFavoritesSession'

type StartOralFavoritesSessionButtonProps = {
  questionCount: QuestionCount
}

export const StartOralFavoritesSessionButton: React.FC<StartOralFavoritesSessionButtonProps> = ({
  questionCount,
}) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const mutation = useStartOralFavoritesSession(user.id)
  const navigate = useNavigate()

  const startSession = () =>
    toast.promise(
      mutation.mutateAsync({
        params: { qualificationPathId: selectedPath.id },
        payload: { questionCount },
      }),
      {
        loading: { title: 'Rozpoczynanie sesji ulubionych…' },
        success: { title: 'Sesja ulubionych została rozpoczęta.' },
        error: error => {
          if (Schema.is(OralSessionAlreadyStarted)(error)) {
            return {
              title: 'Masz już rozpoczętą sesję ulubionych w tym zakresie.',
              actionProps: {
                children: 'Przejdź do sesji',
                onClick: () =>
                  void navigate({
                    to: '/ustny/sesja/$sessionId/$questionNumber',
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
