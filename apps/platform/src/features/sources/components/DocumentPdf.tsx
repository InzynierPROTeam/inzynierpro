import { documentPdfQueryOptions } from '@inzpro/queries/modules/learning-content/queries'
import type React from 'react'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { referenceDocumentRouteApi } from '../utils'
import { DocumentPdfViewer, PdfPageSkeleton } from './DocumentPdfViewer'

type DocumentPdfProps = { downloadable: boolean }

export const DocumentPdf: React.FC<DocumentPdfProps> = ({ downloadable }) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { code } = referenceDocumentRouteApi.useParams()

  return (
    <SuspenseQueryWrapper fallback={<PdfPageSkeleton />}>
      <SuspenseQuery
        options={documentPdfQueryOptions(apiHttpClient, user.id, {
          params: { qualificationPathId: selectedPath.id, code },
        })}
        isDataEmpty={() => false}
      >
        {({ url }) => (
          <DocumentPdfViewer
            url={url}
            downloadable={downloadable}
          />
        )}
      </SuspenseQuery>
    </SuspenseQueryWrapper>
  )
}
