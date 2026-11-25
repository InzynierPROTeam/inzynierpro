import type { QuestionReference } from '@inzpro/api-contracts/modules/learning-content/responses'
import type React from 'react'
import { useId } from 'react'

import { DocumentReferenceLink } from './DocumentReferenceLink'

type QuestionReferenceListProps = {
  title: string
  references: ReadonlyArray<QuestionReference>
}

export const QuestionReferenceList: React.FC<QuestionReferenceListProps> = ({
  title,
  references,
}) => {
  const headingId = useId()

  if (references.length === 0) {
    return null
  }

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-2"
    >
      <h3
        id={headingId}
        className="font-semibold"
      >
        {title}
      </h3>
      <ul className="flex list-disc flex-col gap-1 ps-5">
        {references.map(reference => (
          <li key={`${reference.document.code}-${reference.address ?? reference.page ?? ''}`}>
            <DocumentReferenceLink reference={reference} />
          </li>
        ))}
      </ul>
    </section>
  )
}
