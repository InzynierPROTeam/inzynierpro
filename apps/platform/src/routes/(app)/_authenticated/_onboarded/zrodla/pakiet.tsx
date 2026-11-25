import { documentPackageCandidatesQueryOptions } from '@inzpro/queries/modules/learning-content/queries'
import { createFileRoute } from '@tanstack/react-router'
import { constVoid } from 'effect/Function'
import { seo } from '~platform/config/app'
import { DocumentPackagePage } from '~platform/features/documentPackage/DocumentPackagePage'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute('/(app)/_authenticated/_onboarded/zrodla/pakiet')({
  loader: ({ context: { queryClient, session, selectedPath } }) => {
    void queryClient
      .query(
        documentPackageCandidatesQueryOptions(apiHttpClient, session.user.id, {
          params: { qualificationPathId: selectedPath.id },
        }),
      )
      .catch(constVoid)
  },
  staticData: { backLabel: 'Pakiet PDF' },
  component: DocumentPackagePage,
  head: () => ({ meta: seo({ title: 'Pakiet PDF' }) }),
})
