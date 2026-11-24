import type { QuestionReference } from '@inzpro/api-contracts/modules/learning-content/responses'
import { Link } from '@tanstack/react-router'
import { Link as LinkIcon } from 'lucide-react'
import type React from 'react'

import { questionReferenceLabel, questionReferenceSearch } from '../utils'
import { DocumentFragmentText } from './DocumentFragmentText'

type QuestionBasisProps = { reference: QuestionReference }

export const QuestionBasis: React.FC<QuestionBasisProps> = ({ reference }) => {
  const label = questionReferenceLabel(reference)

  return (
    <section
      aria-label={`Podstawa: ${label}`}
      className="flex flex-col gap-2"
    >
      <p className="font-semibold">
        Podstawa:{' '}
        {reference.isLinked ? (
          <Link
            to="/zrodla/$code"
            params={{ code: reference.document.code }}
            search={questionReferenceSearch(reference)}
            className="text-primary inline-flex items-center gap-1 underline-offset-4 hover:underline"
          >
            {label}
            <LinkIcon
              aria-hidden="true"
              className="size-4"
            />
          </Link>
        ) : (
          label
        )}
      </p>
      <p className="text-muted-foreground">{reference.document.title}</p>
      {reference.fragment !== null && <DocumentFragmentText sections={reference.fragment} />}
    </section>
  )
}
