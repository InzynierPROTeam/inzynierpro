import type { AttemptReviewQuestion } from '@inzpro/api-contracts/modules/mock-exams/responses'
import { Button } from '@inzpro/ui/components/button'
import { Star } from 'lucide-react'
import type React from 'react'
import { cx } from 'tailwind-variants'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

import { useToggleAttemptFavorite } from '../hooks/useToggleAttemptFavorite'

type AttemptFavoriteButtonProps = { question: AttemptReviewQuestion }

export const AttemptFavoriteButton: React.FC<AttemptFavoriteButtonProps> = ({ question }) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const mutation = useToggleAttemptFavorite(user.id, selectedPath.id)

  return (
    <Button
      variant="outline"
      size="icon-md"
      aria-pressed={question.isFavorite}
      disabled={mutation.isPending}
      onClick={() =>
        mutation.mutate({ questionId: question.questionId, isFavorite: !question.isFavorite })
      }
    >
      <Star className={cx(question.isFavorite && 'text-primary fill-current')} />
      <span className="sr-only">
        {question.isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
      </span>
    </Button>
  )
}
