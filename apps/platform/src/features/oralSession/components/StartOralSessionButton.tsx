import { OralSessionAlreadyStarted } from '@inzpro/api-contracts/modules/oral-study/errors'
import type { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import type { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { Button } from '@inzpro/ui/components/button'
import { toast } from '@inzpro/ui/components/toast'
import { useNavigate } from '@tanstack/react-router'
import { Predicate, Schema } from 'effect'
import type React from 'react'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

import { useStartOralSession } from '../hooks/useStartOralSession'

type StartOralSessionButtonProps = {
  categoryId: OralQuestionCategoryId
  questionCount: QuestionCount
}

export const StartOralSessionButton: React.FC<StartOralSessionButtonProps> = ({
  categoryId,
  questionCount,
}) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const mutation = useStartOralSession(user.id)
  const navigate = useNavigate()

  const startSession = () =>
    toast.promise(
      mutation.mutateAsync({
        params: { qualificationPathId: selectedPath.id },
        payload: { categoryId, questionCount },
      }),
      {
        loading: { title: 'Rozpoczynanie sesji…' },
        success: { title: 'Sesja nauki ustnej została rozpoczęta.' },
        error: error => {
          if (Schema.is(OralSessionAlreadyStarted)(error)) {
            return {
              title: 'Masz już rozpoczętą sesję z tej kategorii.',
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
              ? 'Dostępne pytania zmieniły się. Sprawdź szczegóły sesji i spróbuj ponownie.'
              : 'Nie udało się rozpocząć sesji. Spróbuj ponownie.',
          }
        },
      },
    )

  return (
    <Button
      disabled={mutation.isPending}
      onClick={startSession}
    >
      Zacznij sesję
    </Button>
  )
}
