import { PageLimit } from '@inzpro/domain/common/pagination'
import { maxUserQualificationPaths } from '@inzpro/domain/modules/preparation/config'
import { pathsQueryOptions } from '@inzpro/queries/modules/preparation'
import { createFileRoute } from '@tanstack/react-router'
import { constVoid } from 'effect/Function'
import { seo } from '~platform/config/app'
import { ProfilePage } from '~platform/features/profile/ProfilePage'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute('/(app)/_authenticated/profil')({
  loader: ({ context: { queryClient, session } }) => {
    void queryClient
      .query(
        pathsQueryOptions(apiHttpClient, session.user.id, {
          query: { limit: PageLimit.make(maxUserQualificationPaths) },
        }),
      )
      .catch(constVoid)
  },
  staticData: { backLabel: 'Konto' },
  component: ProfilePage,
  head: () => ({
    meta: seo({ title: 'Profil' }),
  }),
})
