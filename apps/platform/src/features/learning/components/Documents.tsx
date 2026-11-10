import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { documentsQueryOptions } from '@inzpro/queries/modules/study'
import { Button } from '@inzpro/ui/components/button'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { apiHttpClient } from '~platform/lib/api-client'

import { Preview } from './Preview'
import { RequestFailure } from './RequestFailure'

export const Documents = ({
  pathId,
  userId,
  disabled,
}: {
  pathId: QualificationPathId
  userId: UserId
  disabled: boolean
}) => {
  const documents = useInfiniteQuery(
    documentsQueryOptions(apiHttpClient, userId, {
      query: {},
      params: { qualificationPathId: pathId },
    }),
  )

  const [documentId, setDocumentId] = useState<ReferenceDocumentId>()

  if (documents.isPending) {
    return <p role="status">Wczytywanie dokumentów…</p>
  }

  if (documents.isError) {
    return (
      <RequestFailure
        error={documents.error}
        retry={() => {
          void documents.refetch()
        }}
      />
    )
  }

  return (
    <div
      className="space-y-6"
      aria-busy={disabled}
    >
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Dokumenty</h2>
        {documents.data.pages.flatMap(page => page.data).length === 0 && (
          <p>Brak dokumentów dla tej ścieżki.</p>
        )}
        <div className="flex flex-col items-start gap-3">
          {documents.data.pages
            .flatMap(page => page.data)
            .map(document => (
              <Button
                key={document.id}
                className="h-auto text-left whitespace-normal"
                variant="outline"
                disabled={disabled}
                aria-pressed={documentId === document.id}
                onClick={() => setDocumentId(document.id)}
              >
                {document.title} — {document.availableQuestionCount} pytań • ukończono:{' '}
                {document.completedQuestionCount}
              </Button>
            ))}
        </div>
      </div>
      {documentId !== undefined && !disabled && (
        <Preview
          key={documentId}
          pathId={pathId}
          documentId={documentId}

          userId={userId}
        />
      )}
      {documents.hasNextPage && (
        <Button
          type="button"
          disabled={documents.isFetchingNextPage}
          onClick={() => {
            void documents.fetchNextPage()
          }}
        >
          Wczytaj więcej dokumentów
        </Button>
      )}
    </div>
  )
}
