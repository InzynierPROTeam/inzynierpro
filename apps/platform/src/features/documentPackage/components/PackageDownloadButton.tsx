import type { DocumentPackageCandidate } from '@inzpro/api-contracts/modules/learning-content/responses'
import type { ReferenceDocumentCode } from '@inzpro/domain/modules/learning-content/reference-document'
import { Alert, AlertDescription, AlertTitle } from '@inzpro/ui/components/alert'
import { Button } from '@inzpro/ui/components/button'
import { toast } from '@inzpro/ui/components/toast'
import { formatDate, getCurrentUtcIsoDateTime } from '@inzpro/utils/date'
import { useMutation } from '@tanstack/react-query'
import { Download, LoaderCircle } from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

import { downloadDocumentPackage } from '../actions'
import { PackageError } from '../lib/package-error'
import { packageFileName, packagePathName } from '../utils'

type PackageDownloadButtonProps = {
  documents: ReadonlyArray<DocumentPackageCandidate>
  onRemove: (code: ReferenceDocumentCode) => void
}

export const PackageDownloadButton: React.FC<PackageDownloadButtonProps> = ({
  documents,
  onRemove,
}) => {
  const { selectedPath } = onboardedRouteApi.useRouteContext()
  const controller = useRef<AbortController | null>(null)
  const [cancelled, setCancelled] = useState(false)
  const [attemptDocuments, setAttemptDocuments] = useState(documents)

  const mutation = useMutation({
    mutationFn: downloadDocumentPackage,
    onSuccess: () => toast.add({ type: 'success', title: 'Pakiet PDF został pobrany.' }),
  })

  useEffect(() => () => controller.current?.abort(), [])

  const downloadPackage = () => {
    const generatedAt = getCurrentUtcIsoDateTime()
    controller.current = new AbortController()
    setCancelled(false)
    setAttemptDocuments(documents)
    mutation.mutate({
      qualificationPathId: selectedPath.id,
      codes: documents.map(document => document.code),
      fileName: packageFileName(selectedPath, generatedAt),
      pathName: packagePathName(selectedPath),
      generationDate: formatDate(generatedAt),
      signal: controller.current.signal,
    })
  }

  const cancel = () => {
    controller.current?.abort()
    setCancelled(true)
  }

  const failedDocument =
    mutation.error instanceof PackageError && mutation.error.documentIndex !== undefined
      ? attemptDocuments[mutation.error.documentIndex]
      : undefined

  const removeFailedDocument = () => {
    if (failedDocument) {
      onRemove(failedDocument.code)
    }

    mutation.reset()
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button
          className="self-start"
          disabled={documents.length === 0 || mutation.isPending}
          onClick={downloadPackage}
        >
          {mutation.isPending ? (
            <LoaderCircle
              aria-hidden="true"
              className="animate-spin"
            />
          ) : (
            <Download aria-hidden="true" />
          )}
          Pobierz pakiet PDF
        </Button>
        {mutation.isPending && (
          <Button
            variant="outline"
            onClick={cancel}
          >
            Anuluj przygotowanie
          </Button>
        )}
      </div>
      {cancelled && <p role="status">Przygotowanie pakietu zostało anulowane.</p>}
      {mutation.isError && !cancelled && (
        <Alert>
          <AlertTitle>Nie udało się przygotować pakietu</AlertTitle>
          <AlertDescription>
            <p>
              {failedDocument?.title ?? 'Pakiet PDF'}: przygotowanie zostało przerwane. Nie zapisano
              pliku.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={documents.length === 0}
                onClick={downloadPackage}
              >
                Spróbuj ponownie
              </Button>
              {failedDocument && (
                <Button
                  variant="outline"
                  onClick={removeFailedDocument}
                >
                  Usuń z pakietu
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
