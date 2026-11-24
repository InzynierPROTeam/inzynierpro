import { ReferenceDocumentCode } from '@inzpro/domain/modules/learning-content/reference-document'
import { referenceDocumentQueryOptions } from '@inzpro/queries/modules/learning-content/queries'
import { createFileRoute } from '@tanstack/react-router'
import { Schema } from 'effect'
import { constVoid } from 'effect/Function'
import { seo } from '~platform/config/app'
import { ReferenceDocumentPage } from '~platform/features/sources/ReferenceDocumentPage'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute('/(app)/_authenticated/_onboarded/zrodla/$code')({
  params: {
    parse: params => ({ code: Schema.decodeSync(ReferenceDocumentCode)(params.code) }),
  },
  loader: ({ context: { queryClient, session, selectedPath }, params }) => {
    void queryClient
      .query(
        referenceDocumentQueryOptions(apiHttpClient, session.user.id, {
          params: { qualificationPathId: selectedPath.id, code: params.code },
        }),
      )
      .catch(constVoid)
  },
  staticData: { backLabel: 'Dokument' },
  component: ReferenceDocumentPage,
  head: () => ({ meta: seo({ title: 'Dokument źródłowy' }) }),
})
