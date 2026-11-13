import { Button } from '@inzpro/ui/components/button'
import { Array } from 'effect'
import type React from 'react'
import { cx } from 'tailwind-variants'

import { maxOnboardingStep } from '../config'

type StepsProps = { current: number; onSelect: (step: number) => void }

export const Steps: React.FC<StepsProps> = ({ current, onSelect }) => (
  <nav
    aria-label="Kroki wyboru ścieżki"
    className="self-center"
  >
    <ol className="flex items-center gap-8 max-sm:gap-4">
      {Array.range(1, maxOnboardingStep).map(number => (
        <li key={number}>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={`Krok ${number}`}
            aria-current={current === number ? 'step' : undefined}
            disabled={number > current}
            onClick={() => onSelect(number)}
            className={cx(
              current === number && 'border-primary',
              number < current && 'border-primary bg-primary text-primary-foreground',
              number > current && 'border-border text-muted-foreground',
            )}
          >
            {number}
          </Button>
        </li>
      ))}
    </ol>
  </nav>
)
