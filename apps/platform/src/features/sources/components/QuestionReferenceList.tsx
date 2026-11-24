import type { QuestionReference } from '@inzpro/api-contracts/modules/learning-content/responses'
import { Sheet, SheetTrigger } from '@inzpro/ui/components/sheet'
import { Link } from '@tanstack/react-router'
import type React from 'react'

import { questionReferenceLabel, questionReferenceSearch } from '../utils'
import { DocumentFragmentPanel } from './DocumentFragmentPanel'

const linkClassName = 'text-primary underline-offset-4 hover:underline'

type QuestionReferenceListProps = {
  title: string
  references: ReadonlyArray<QuestionReference>
}

export const QuestionReferenceList: React.FC<QuestionReferenceListProps> = ({
  title,
  references,
}) => {
  if (references.length === 0) {
    return null
  }

  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-semibold">{title}</h3>
      <ul className="flex list-disc flex-col gap-1 ps-5">
        {references.map(reference => (
          <li key={`${reference.document.code}-${reference.address ?? reference.page ?? ''}`}>
            <QuestionReferenceItem reference={reference} />
          </li>
        ))}
      </ul>
    </section>
  )
}

type QuestionReferenceItemProps = { reference: QuestionReference }

const QuestionReferenceItem: React.FC<QuestionReferenceItemProps> = ({ reference }) => {
  const label = questionReferenceLabel(reference)

  if (!reference.isLinked) {
    return <span>{label}</span>
  }

  if (reference.address === null) {
    return (
      <Link
        to="/zrodla/$code"
        params={{ code: reference.document.code }}
        search={questionReferenceSearch(reference)}
        className={linkClassName}
      >
        {label}
      </Link>
    )
  }

  return (
    <Sheet>
      <SheetTrigger className={linkClassName}>{label}</SheetTrigger>
      <DocumentFragmentPanel
        code={reference.document.code}
        address={reference.address}
        label={label}
      />
    </Sheet>
  )
}
