import type { SessionQuestion } from '@inzpro/api-contracts/modules/study/responses'
import { Button } from '@inzpro/ui/components/button'
import { Star } from 'lucide-react'
import type React from 'react'
import { cx } from 'tailwind-variants'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

import { useToggleFavorite } from '../hooks/useToggleFavorite'

type FavoriteToggleButtonProps = { question: SessionQuestion }

export const FavoriteToggleButton: React.FC<FavoriteToggleButtonProps> = ({ question }) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const mutation = useToggleFavorite(user.id, {
    params: {
      qualificationPathId: selectedPath.id,
      sessionId: question.sessionId,
      position: question.position,
    },
  })

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
