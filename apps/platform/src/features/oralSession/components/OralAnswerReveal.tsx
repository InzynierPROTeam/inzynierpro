import type {
  QuestionReference,
  ResolvedRichContent,
} from '@inzpro/api-contracts/modules/learning-content/responses'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@inzpro/ui/components/accordion'
import { RichText } from '@inzpro/ui/components/rich-text'
import type React from 'react'
import { oralAnswerVisibilityStore } from '~platform/features/oralSession/stores'
import { QuestionReferences } from '~platform/features/sources/components/QuestionReferences'

import { useOralAnswerVisibility } from '../hooks/useOralAnswerVisibility'

const answerItem = 'answer'

type OralAnswerRevealProps = {
  answer: ResolvedRichContent
  references: ReadonlyArray<QuestionReference>
}

export const OralAnswerReveal: React.FC<OralAnswerRevealProps> = ({ answer, references }) => {
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
        <AccordionContent className="flex flex-col gap-4 pb-5">
          <RichText
            content={answer.content}
            assets={answer.assets}
          />
          <QuestionReferences references={references} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
