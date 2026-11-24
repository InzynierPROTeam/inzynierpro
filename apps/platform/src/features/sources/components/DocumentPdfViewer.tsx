import type { DocumentPageCount } from '@inzpro/domain/modules/learning-content/document-edition'
import { Alert, AlertDescription, AlertTitle } from '@inzpro/ui/components/alert'
import { Skeleton } from '@inzpro/ui/components/skeleton'
import { ClientOnly } from '@tanstack/react-router'
import { FileWarning } from 'lucide-react'
import type React from 'react'
import { lazy, Suspense, useState } from 'react'

import { referenceDocumentRouteApi, viewerPageNumber } from '../utils'
import { DocumentPdfToolbar } from './DocumentPdfToolbar'

const PdfViewer = lazy(() =>
  import('../lib/PdfViewer').then(module => ({ default: module.PdfViewer })),
)

type DocumentPdfViewerProps = { url: string; downloadable: boolean }

export const DocumentPdfViewer: React.FC<DocumentPdfViewerProps> = ({ url, downloadable }) => {
  const { strona } = referenceDocumentRouteApi.useSearch()
  const [pageCount, setPageCount] = useState<DocumentPageCount | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <DocumentPdfToolbar
        pageCount={pageCount}
        downloadable={downloadable}
      />
      <ClientOnly fallback={<PdfPageSkeleton />}>
        <Suspense fallback={<PdfPageSkeleton />}>
          <PdfViewer
            file={url}
            pageNumber={pageCount === null ? null : viewerPageNumber(strona, pageCount)}
            onLoad={setPageCount}
            loading={<PdfPageSkeleton />}
            error={<PdfUnavailable />}
          />
        </Suspense>
      </ClientOnly>
    </div>
  )
}

export const PdfPageSkeleton = () => <Skeleton className="aspect-[1/1.414] w-full rounded-lg" />

const PdfUnavailable = () => (
  <Alert role="alert">
    <FileWarning />
    <AlertTitle>Nie udało się otworzyć pliku PDF</AlertTitle>
    <AlertDescription>Odśwież stronę, aby spróbować ponownie.</AlertDescription>
  </Alert>
)
