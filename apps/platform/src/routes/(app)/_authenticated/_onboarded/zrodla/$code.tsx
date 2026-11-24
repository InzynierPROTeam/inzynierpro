import { fullContentAvailability } from '@inzpro/domain/modules/learning-content/document-edition'
import { ReferenceDocumentCode } from '@inzpro/domain/modules/learning-content/reference-document'
import {
  documentSectionsQueryOptions,
  referenceDocumentQueryOptions,
} from '@inzpro/queries/modules/learning-content/queries'
import { createFileRoute } from '@tanstack/react-router'
import { Schema } from 'effect'
import { constVoid } from 'effect/Function'
import { seo } from '~platform/config/app'
import { ReferenceDocumentPage } from '~platform/features/sources/ReferenceDocumentPage'
import { ReferenceDocumentSearch } from '~platform/features/sources/validation'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute('/(app)/_authenticated/_onboarded/zrodla/$code')({
  params: {
    parse: params => ({ code: Schema.decodeSync(ReferenceDocumentCode)(params.code) }),
  },
  validateSearch: Schema.toStandardSchemaV1(ReferenceDocumentSearch),
  loader: ({ context: { queryClient, session, selectedPath }, params }) => {
    const req = { params: { qualificationPathId: selectedPath.id, code: params.code } }

    void queryClient
      .query(referenceDocumentQueryOptions(apiHttpClient, session.user.id, req))
      .then(({ document }) =>
        document.edition.availability === fullContentAvailability
          ? queryClient.query(documentSectionsQueryOptions(apiHttpClient, session.user.id, req))
          : undefined,
      )
      .catch(constVoid)
  },
  staticData: { backLabel: 'Dokument' },
  component: ReferenceDocumentPage,
  head: () => ({ meta: seo({ title: 'Dokument źródłowy' }) }),
})
