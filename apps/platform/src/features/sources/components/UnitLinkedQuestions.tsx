import type { DocumentUnitQuestionCount } from '@inzpro/api-contracts/modules/learning-content/responses'
import { documentSectionLabel } from '@inzpro/domain/modules/learning-content/document-section-address'
import { Button } from '@inzpro/ui/components/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@inzpro/ui/components/sheet'
import { MessageCircleQuestion } from 'lucide-react'
import type React from 'react'
import { useId } from 'react'

import { linkedQuestionsTitle } from '../utils'
import { LinkedOralQuestionList } from './LinkedOralQuestionList'
import { LinkedWrittenQuestionList } from './LinkedWrittenQuestionList'

type UnitLinkedQuestionsProps = { unit: DocumentUnitQuestionCount }

export const UnitLinkedQuestions: React.FC<UnitLinkedQuestionsProps> = ({ unit }) => {
  const title = linkedQuestionsTitle(unit.writtenQuestionCount + unit.oralQuestionCount)
  const label = documentSectionLabel(unit.address)

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="self-start"
          />
        }
      >
        <MessageCircleQuestion aria-hidden="true" />
        {title}
        <span className="sr-only">: {label}</span>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{label}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-8 overflow-y-auto px-6 pb-6">
          {unit.writtenQuestionCount > 0 && (
            <LinkedQuestionGroup title={`Pytania pisemne (${unit.writtenQuestionCount})`}>
              <LinkedWrittenQuestionList address={unit.address} />
            </LinkedQuestionGroup>
          )}
          {unit.oralQuestionCount > 0 && (
            <LinkedQuestionGroup title={`Pytania ustne (${unit.oralQuestionCount})`}>
              <LinkedOralQuestionList address={unit.address} />
            </LinkedQuestionGroup>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

type LinkedQuestionGroupProps = { title: string; children: React.ReactNode }

const LinkedQuestionGroup: React.FC<LinkedQuestionGroupProps> = ({ title, children }) => {
  const headingId = useId()

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-3"
    >
      <h3
        id={headingId}
        className="font-semibold"
      >
        {title}
      </h3>
      {children}
    </section>
  )
}
