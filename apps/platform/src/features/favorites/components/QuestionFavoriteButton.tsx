import { Button } from '@inzpro/ui/components/button'
import { Star } from 'lucide-react'
import type React from 'react'
import { cx } from 'tailwind-variants'

type QuestionFavoriteButtonProps = {
  isFavorite: boolean
  disabled: boolean
  onToggle: (isFavorite: boolean) => void
}

export const QuestionFavoriteButton: React.FC<QuestionFavoriteButtonProps> = ({
  isFavorite,
  disabled,
  onToggle,
}) => (
  <Button
    variant="outline"
    size="icon-md"
    aria-pressed={isFavorite}
    disabled={disabled}
    onClick={() => onToggle(!isFavorite)}
  >
    <Star className={cx(isFavorite && 'text-primary fill-current')} />
    <span className="sr-only">{isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}</span>
  </Button>
)
