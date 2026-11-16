import type { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import type { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { Button } from '@inzpro/ui/components/button'
import { toast } from '@inzpro/ui/components/toast'
import { useNavigate } from '@tanstack/react-router'
import type React from 'react'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

import { useStartOralReviewSession } from '../hooks/useStartOralReviewSession'
import { getOralReviewStartError } from '../utils'

type StartOralReviewSessionButtonProps = {
  categoryId: OralQuestionCategoryId | undefined
  questionCount: QuestionCount
}

export const StartOralReviewSessionButton: React.FC<StartOralReviewSessionButtonProps> = ({
  categoryId,
  questionCount,
}) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const mutation = useStartOralReviewSession(user.id)
  const navigate = useNavigate()

  const startSession = () =>
    toast.promise(
      mutation.mutateAsync({
        params: { qualificationPathId: selectedPath.id },
        payload: { categoryId, questionCount },
      }),
      {
        loading: { title: 'Rozpoczynanie powtórki…' },
        success: { title: 'Powtórka została rozpoczęta.' },
        error: error => {
          const { title, continuation } = getOralReviewStartError(error)

          return {
            title,
            actionProps:
              continuation === null
                ? undefined
                : {
                    children: 'Przejdź do powtórki',
                    onClick: () =>
                      void navigate({
                        to: '/ustny/sesja/$sessionId/$questionNumber',
                        params: continuation,
                        replace: true,
                      }),
                  },
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
