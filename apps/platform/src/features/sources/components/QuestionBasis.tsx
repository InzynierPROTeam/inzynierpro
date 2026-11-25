import type { QuestionReference } from '@inzpro/api-contracts/modules/learning-content/responses'
import type React from 'react'

import { questionReferenceLabel } from '../utils'
import { DocumentFragmentText } from './DocumentFragmentText'
import { DocumentReferenceLink } from './DocumentReferenceLink'

type QuestionBasisProps = { reference: QuestionReference }

export const QuestionBasis: React.FC<QuestionBasisProps> = ({ reference }) => (
  <section
    aria-label={`Podstawa: ${questionReferenceLabel(reference)}`}
    className="flex flex-col gap-2"
  >
    <p className="font-semibold">
      Podstawa: <DocumentReferenceLink reference={reference} />
    </p>
    <p className="text-muted-foreground">{reference.document.title}</p>
    {reference.fragment !== null && <DocumentFragmentText sections={reference.fragment} />}
  </section>
)
