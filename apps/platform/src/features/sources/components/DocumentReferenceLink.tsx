import type { QuestionReference } from '@inzpro/api-contracts/modules/learning-content/responses'
import { Link } from '@tanstack/react-router'
import type React from 'react'

import { questionReferenceLabel, questionReferenceSearch } from '../utils'

type DocumentReferenceLinkProps = { reference: QuestionReference }

export const DocumentReferenceLink: React.FC<DocumentReferenceLinkProps> = ({ reference }) => {
  const label = questionReferenceLabel(reference)

  if (!reference.isLinked) {
    return <span>{label}</span>
  }

  return (
    <Link
      to="/zrodla/$code"
      params={{ code: reference.document.code }}
      search={questionReferenceSearch(reference)}
      resetScroll={reference.address === null}
      className="text-primary underline-offset-4 hover:underline"
    >
      {label}
    </Link>
  )
}
