import type { AttemptQuestion } from '@inzpro/api-contracts/modules/mock-exams/responses'
import { Button } from '@inzpro/ui/components/button'
import { Clock } from 'lucide-react'
import type React from 'react'
import { cx } from 'tailwind-variants'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

import { useFlagAttemptQuestion } from '../hooks/useFlagAttemptQuestion'
import { attemptQuestionRouteApi } from '../utils'

type AttemptFlagButtonProps = { question: AttemptQuestion }

export const AttemptFlagButton: React.FC<AttemptFlagButtonProps> = ({ question }) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { attemptId } = attemptQuestionRouteApi.useParams()

  const mutation = useFlagAttemptQuestion(user.id, {
    qualificationPathId: selectedPath.id,
    attemptId,
  })

  const toggleFlag = () =>
    mutation.mutate({
      params: { qualificationPathId: selectedPath.id, attemptId, position: question.position },
      payload: { isFlagged: !question.isFlagged, expectedVersion: question.version },
    })

  return (
    <Button
      variant="outline"
      size="icon-md"
      aria-pressed={question.isFlagged}
      disabled={mutation.isPending}
      onClick={toggleFlag}
    >
      <Clock className={cx(question.isFlagged && 'text-primary')} />
      <span className="sr-only">Wróć do tego pytania później</span>
    </Button>
  )
}
