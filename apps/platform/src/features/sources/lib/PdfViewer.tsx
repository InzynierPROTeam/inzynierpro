import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import {
  DocumentPageCount,
  type DocumentPageNumber,
} from '@inzpro/domain/modules/learning-content/document-edition'
// oxlint-disable-next-line import/default
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { type ReactNode, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

type PdfViewerProps = {
  file: string
  pageNumber: DocumentPageNumber | null
  onLoad: (pageCount: DocumentPageCount) => void
  loading: ReactNode
  error: ReactNode
}

export const PdfViewer = ({ file, pageNumber, onLoad, loading, error }: PdfViewerProps) => {
  const [width, setWidth] = useState<number | null>(null)

  const observeWidth = (element: HTMLDivElement) => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? null))
    observer.observe(element)

    return () => observer.disconnect()
  }

  return (
    <div
      ref={observeWidth}
      className="w-full"
    >
      <Document
        file={file}
        onLoadSuccess={document => onLoad(DocumentPageCount.make(document.numPages))}
        loading={loading}
        error={error}
      >
        {width !== null && pageNumber !== null && (
          <Page
            pageNumber={pageNumber}
            width={width}
            loading={loading}
            className="overflow-hidden rounded-lg border shadow-sm"
          />
        )}
      </Document>
    </div>
  )
}
