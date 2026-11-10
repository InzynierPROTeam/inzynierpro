import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { sessionPreviewQueryOptions } from '@inzpro/queries/modules/study'
import { Card, CardHeader, CardTitle, CardContent } from '@inzpro/ui/components/card'
import { useQuery } from '@tanstack/react-query'
import { apiHttpClient } from '~platform/lib/api-client'

import { PreviewSettings } from './PreviewSettings'
import { RequestFailure } from './RequestFailure'

export const Preview = ({
  pathId,
  documentId,
  userId,
}: {
  pathId: QualificationPathId
  documentId: ReferenceDocumentId
  userId: UserId
}) => {
  const preview = useQuery(
    sessionPreviewQueryOptions(apiHttpClient, userId, {
      params: { qualificationPathId: pathId, documentId },
    }),
  )

  if (preview.isPending) {
    return <p role="status">Wczytywanie podglądu…</p>
  }

  if (preview.isError) {
    return (
      <RequestFailure
        error={preview.error}
        retry={() => {
          void preview.refetch()
        }}
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Podgląd sesji nauki</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p>{preview.data.document.title}</p>
        <p>Egzamin pisemny • Dostępne pytania: {preview.data.availableQuestionCount}</p>
        {preview.data.availableQuestionCount === 0 ? (
          <p>Brak pytań dla tego dokumentu.</p>
        ) : (
          <PreviewSettings
            key={preview.data.availableQuestionCount}
            settings={preview.data.settings}
          />
        )}
        <p className="text-muted-foreground text-sm">
          To podgląd zakresu nauki. Sesja nie została jeszcze rozpoczęta.
        </p>
      </CardContent>
    </Card>
  )
}
