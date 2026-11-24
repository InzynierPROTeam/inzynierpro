import type { QuestionReference } from '@inzpro/api-contracts/modules/learning-content/responses'
import {
  aidReference,
  directBasisReference,
  topicReference,
} from '@inzpro/domain/modules/learning-content/question-reference'
import type React from 'react'

import { QuestionBasis } from './QuestionBasis'
import { QuestionReferenceList } from './QuestionReferenceList'

type QuestionReferencesProps = { references: ReadonlyArray<QuestionReference> }

export const QuestionReferences: React.FC<QuestionReferencesProps> = ({ references }) => {
  if (references.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-6">
      {references
        .filter(reference => reference.kind === directBasisReference)
        .map(reference => (
          <QuestionBasis
            key={`${reference.document.code}-${reference.address ?? reference.page ?? ''}`}
            reference={reference}
          />
        ))}
      <QuestionReferenceList
        title="Materiały pomocnicze"
        references={references.filter(reference => reference.kind === aidReference)}
      />
      <QuestionReferenceList
        title="Powiązane materiały"
        references={references.filter(reference => reference.kind === topicReference)}
      />
    </div>
  )
}
