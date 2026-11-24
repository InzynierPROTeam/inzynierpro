import { Button } from '@inzpro/ui/components/button'
import { toast } from '@inzpro/ui/components/toast'
import { useMutation } from '@tanstack/react-query'
import { constVoid } from 'effect/Function'
import { Download, LoaderCircle } from 'lucide-react'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

import { getPdfDownloadUrl } from '../actions'
import { referenceDocumentRouteApi } from '../utils'

export const DocumentPdfDownloadButton = () => {
  const { selectedPath } = onboardedRouteApi.useRouteContext()
  const { code } = referenceDocumentRouteApi.useParams()

  const mutation = useMutation({
    mutationFn: getPdfDownloadUrl,
    onSuccess: ({ url }) => window.location.assign(url),
  })

  const downloadPdf = () =>
    toast
      .promise(mutation.mutateAsync({ params: { qualificationPathId: selectedPath.id, code } }), {
        loading: { title: 'Przygotowywanie pliku…' },
        success: { title: 'Pobieranie rozpoczęte.' },
        error: () => ({ title: 'Nie udało się pobrać pliku. Spróbuj ponownie.' }),
      })
      .catch(constVoid)

  return (
    <Button
      variant="outline"
      disabled={mutation.isPending}
      onClick={downloadPdf}
    >
      {mutation.isPending ? (
        <LoaderCircle
          aria-hidden="true"
          className="animate-spin"
        />
      ) : (
        <Download aria-hidden="true" />
      )}
      Pobierz PDF
    </Button>
  )
}
