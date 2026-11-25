import type { DocumentPackageCandidate } from '@inzpro/api-contracts/modules/learning-content/responses'
import { Alert, AlertDescription, AlertTitle } from '@inzpro/ui/components/alert'
import { TriangleAlert } from 'lucide-react'
import type React from 'react'

import { formatFileSize, largePackagePageCount, packageTotals } from '../utils'

type PackageSummaryProps = { documents: ReadonlyArray<DocumentPackageCandidate> }

export const PackageSummary: React.FC<PackageSummaryProps> = ({ documents }) => {
  const { pageCount, size } = packageTotals(documents)

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">
        Dokumenty: {documents.length} · Liczba stron: {pageCount} · Rozmiar: {formatFileSize(size)}
      </p>
      {pageCount > largePackagePageCount && (
        <Alert>
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>Duży pakiet</AlertTitle>
          <AlertDescription>
            Pakiet ma ponad {largePackagePageCount} stron. Na słabszym urządzeniu jego przygotowanie
            może chwilę potrwać.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
