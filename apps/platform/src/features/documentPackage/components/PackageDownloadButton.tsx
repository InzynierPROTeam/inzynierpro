import type { ReferenceDocumentCode } from '@inzpro/domain/modules/learning-content/reference-document'
import { Button } from '@inzpro/ui/components/button'
import { toast } from '@inzpro/ui/components/toast'
import { getCurrentUtcIsoDateTime } from '@inzpro/utils/date'
import { useMutation } from '@tanstack/react-query'
import { constVoid } from 'effect/Function'
import { Download, LoaderCircle } from 'lucide-react'
import type React from 'react'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

import { downloadDocumentPackage } from '../actions'
import { packageFileName } from '../utils'

type PackageDownloadButtonProps = { codes: ReadonlyArray<ReferenceDocumentCode> }

export const PackageDownloadButton: React.FC<PackageDownloadButtonProps> = ({ codes }) => {
  const { selectedPath } = onboardedRouteApi.useRouteContext()
  const mutation = useMutation({ mutationFn: downloadDocumentPackage })

  const downloadPackage = () =>
    toast
      .promise(
        mutation.mutateAsync({
          qualificationPathId: selectedPath.id,
          codes,
          fileName: packageFileName(selectedPath, getCurrentUtcIsoDateTime()),
        }),
        {
          loading: { title: 'Przygotowywanie pakietu…' },
          success: { title: 'Pakiet PDF został pobrany.' },
          error: () => ({ title: 'Nie udało się przygotować pakietu. Spróbuj ponownie.' }),
        },
      )
      .catch(constVoid)

  return (
    <Button
      className="self-start"
      disabled={codes.length === 0 || mutation.isPending}
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
  )
}
