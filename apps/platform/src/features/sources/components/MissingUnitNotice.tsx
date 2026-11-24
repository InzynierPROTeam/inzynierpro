import type { DocumentSection } from '@inzpro/api-contracts/modules/learning-content/responses'
import { documentSectionLabel } from '@inzpro/domain/modules/learning-content/document-section-address'
import { Alert, AlertDescription, AlertTitle } from '@inzpro/ui/components/alert'
import { SearchX } from 'lucide-react'
import type React from 'react'

import { referenceDocumentRouteApi } from '../utils'

type MissingUnitNoticeProps = { sections: ReadonlyArray<DocumentSection> }

export const MissingUnitNotice: React.FC<MissingUnitNoticeProps> = ({ sections }) => {
  const { jednostka } = referenceDocumentRouteApi.useSearch()

  if (jednostka === undefined || sections.some(section => section.address === jednostka)) {
    return null
  }

  return (
    <Alert role="alert">
      <SearchX />
      <AlertTitle>Nie znaleziono jednostki</AlertTitle>
      <AlertDescription>
        W tym wydaniu nie ma jednostki {documentSectionLabel(jednostka)}.
      </AlertDescription>
    </Alert>
  )
}
