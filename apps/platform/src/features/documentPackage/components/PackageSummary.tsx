import type { DocumentPackageCandidate } from '@inzpro/api-contracts/modules/learning-content/responses'
import { effectQueryOptions } from '@inzpro/queries/lib/effect-query-options'
import { Alert, AlertDescription, AlertTitle } from '@inzpro/ui/components/alert'
import { formatDate, getCurrentUtcIsoDateTime } from '@inzpro/utils/date'
import { ClientOnly } from '@tanstack/react-router'
import { TriangleAlert } from 'lucide-react'
import type React from 'react'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { countDocumentPackagePages } from '../actions'
import { largePackagePageCount, packagePathName } from '../utils'

type PackageSummaryProps = { documents: ReadonlyArray<DocumentPackageCandidate> }

export const PackageSummary: React.FC<PackageSummaryProps> = ({ documents }) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const details = {
    pathName: packagePathName(selectedPath),
    generationDate: formatDate(getCurrentUtcIsoDateTime()),
  }

  return (
    <ClientOnly fallback={<p className="text-sm">Obliczanie liczby stron…</p>}>
      <SuspenseQueryWrapper fallback={<p className="text-sm">Obliczanie liczby stron…</p>}>
        <SuspenseQuery
          options={effectQueryOptions(
            ['document-package', user.id, selectedPath.id, documents, details],
            countDocumentPackagePages({
              qualificationPathId: selectedPath.id,
              documents,
              ...details,
            }),
            apiHttpClient,
          )}
          isDataEmpty={() => false}
        >
          {pageCount => (
            <div className="flex flex-col gap-3">
              <p className="text-sm">
                Dokumenty: {documents.length} · Liczba stron: {pageCount}
              </p>
              {pageCount > largePackagePageCount && (
                <Alert>
                  <TriangleAlert aria-hidden="true" />
                  <AlertTitle>Duży pakiet</AlertTitle>
                  <AlertDescription>
                    Pakiet ma ponad {largePackagePageCount} stron. Na słabszym urządzeniu jego
                    przygotowanie może chwilę potrwać.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </SuspenseQuery>
      </SuspenseQueryWrapper>
    </ClientOnly>
  )
}
