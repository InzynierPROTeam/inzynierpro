import { myChamberQueryOptions } from '@inzpro/queries/modules/preparation/queries'
import { createFileRoute } from '@tanstack/react-router'
import { constVoid } from 'effect/Function'
import { seo } from '~platform/config/app'
import { ChambersPage } from '~platform/features/chambers/ChambersPage'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute('/(app)/_authenticated/_onboarded/moja-izba')({
  loader: ({ context: { queryClient, session, selectedPath } }) => {
    void queryClient
      .query(
        myChamberQueryOptions(apiHttpClient, session.user.id, {
          params: { qualificationPathId: selectedPath.id },
        }),
      )
      .catch(constVoid)
  },
  staticData: { backLabel: 'Moja izba' },
  component: ChambersPage,
  head: () => ({ meta: seo({ title: 'Moja izba' }) }),
})
