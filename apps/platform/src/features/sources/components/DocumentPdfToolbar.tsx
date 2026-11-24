import {
  type DocumentPageCount,
  DocumentPageNumber,
} from '@inzpro/domain/modules/learning-content/document-edition'
import { Button } from '@inzpro/ui/components/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type React from 'react'

import { referenceDocumentRouteApi, viewerPageNumber } from '../utils'
import { DocumentPdfDownloadButton } from './DocumentPdfDownloadButton'

type DocumentPdfToolbarProps = { pageCount: DocumentPageCount | null; downloadable: boolean }

export const DocumentPdfToolbar: React.FC<DocumentPdfToolbarProps> = ({
  pageCount,
  downloadable,
}) => {
  const { strona } = referenceDocumentRouteApi.useSearch()
  const navigate = referenceDocumentRouteApi.useNavigate()
  const pageNumber = viewerPageNumber(strona, pageCount)

  const showPage = (page: number) =>
    navigate({
      search: search => ({ ...search, strona: DocumentPageNumber.make(page) }),
      replace: true,
    })

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon-lg"
          aria-label="Poprzednia strona"
          disabled={pageNumber <= 1}
          onClick={() => void showPage(pageNumber - 1)}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <p
          aria-live="polite"
          className="min-w-28 text-center text-sm tabular-nums"
        >
          {pageCount === null ? `Strona ${pageNumber}` : `Strona ${pageNumber} z ${pageCount}`}
        </p>
        <Button
          variant="outline"
          size="icon-lg"
          aria-label="Następna strona"
          disabled={pageCount === null || pageNumber >= pageCount}
          onClick={() => void showPage(pageNumber + 1)}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
      {downloadable && <DocumentPdfDownloadButton />}
    </div>
  )
}
