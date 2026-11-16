import { oralSelfAssessmentValues } from '@inzpro/domain/modules/study/oral-study-session'
import { Button } from '@inzpro/ui/components/button'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from '@inzpro/ui/components/popover'
import { CircleQuestionMark } from 'lucide-react'

import { selfAssessmentLevels } from '../utils'

export const OralDifficultyScaleExplanation = () => (
  <div className="text-muted-foreground flex flex-col gap-2 text-sm">
    <ul className="flex flex-col gap-1">
      {oralSelfAssessmentValues.map(value => (
        <li key={value}>
          <span className="text-foreground font-medium">{selfAssessmentLevels[value].label}</span> –{' '}
          {selfAssessmentLevels[value].description}.
        </li>
      ))}
    </ul>
    <p>
      Oceniaj szczerze: im trudniejsze pytanie, tym szybciej wróci w powtórkach, a łatwe pojawią się
      rzadziej.
    </p>
  </div>
)

// A popover opens on tap as well as click, so the explanation stays reachable on touch screens.
export const OralDifficultyScaleHelp = () => (
  <Popover>
    <PopoverTrigger
      render={
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Jak działa skala trudności"
        />
      }
    >
      <CircleQuestionMark />
    </PopoverTrigger>
    <PopoverContent align="start">
      <PopoverTitle>Skala trudności</PopoverTitle>
      <PopoverDescription
        render={<div />}
        className="text-foreground"
      >
        <OralDifficultyScaleExplanation />
      </PopoverDescription>
    </PopoverContent>
  </Popover>
)
