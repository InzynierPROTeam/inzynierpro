import { Button } from '@inzpro/ui/components/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type React from 'react'

import { maxOnboardingStep } from '../config'

type StepHeaderProps = {
  step: number
  onBack?: () => void
}

export const StepHeader: React.FC<StepHeaderProps> = ({ step, onBack }) => (
  <div className="text-muted-foreground flex items-center justify-center gap-4 text-center">
    <span className="size-8">
      {onBack && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Poprzedni krok"
          onClick={onBack}
        >
          <ChevronLeft />
        </Button>
      )}
    </span>
    <span className="text-sm tracking-wider uppercase">Krok {step}</span>
    <span className="size-8">
      {step < maxOnboardingStep && (
        <Button
          type="submit"
          variant="ghost"
          size="icon-sm"
          aria-label="Następny krok"
        >
          <ChevronRight />
        </Button>
      )}
    </span>
  </div>
)
