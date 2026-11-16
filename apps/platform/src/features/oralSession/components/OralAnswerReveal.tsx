import type { ResolvedRichContent } from '@inzpro/api-contracts/modules/learning-content/responses'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@inzpro/ui/components/accordion'
import { RichText } from '@inzpro/ui/components/rich-text'
import type React from 'react'

import { useOralAnswerVisibility } from '../hooks/useOralAnswerVisibility'
import { oralAnswerVisibilityStore } from '../store'

const answerItem = 'answer'

type OralAnswerRevealProps = { answer: ResolvedRichContent }

export const OralAnswerReveal: React.FC<OralAnswerRevealProps> = ({ answer }) => {
  const isVisible = useOralAnswerVisibility()

  return (
    <Accordion
      value={isVisible ? [answerItem] : []}
      onValueChange={value => oralAnswerVisibilityStore.set(value.includes(answerItem))}
    >
      <AccordionItem
        value={answerItem}
        className="border-border bg-background rounded-3xl border px-6"
      >
        <AccordionTrigger className="py-5">
          <span>
            Odpowiedź{' '}
            {!isVisible && (
              <span className="text-muted-foreground font-normal">(kliknij, aby rozwinąć)</span>
            )}
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-5">
          <RichText
            content={answer.content}
            assets={answer.assets}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
