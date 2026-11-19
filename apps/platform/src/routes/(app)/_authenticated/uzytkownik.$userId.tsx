import { UserId } from '@inzpro/domain/modules/identity/user'
import { publicProfileQueryOptions } from '@inzpro/queries/modules/profiles/queries'
import { createFileRoute } from '@tanstack/react-router'
import { Schema } from 'effect'
import { constVoid } from 'effect/Function'
import { seo } from '~platform/config/app'
import { PublicProfilePage } from '~platform/features/profile/PublicProfilePage'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute('/(app)/_authenticated/uzytkownik/$userId')({
  params: {
    parse: params => ({ userId: Schema.decodeSync(UserId)(params.userId) }),
  },
  loader: ({ context: { queryClient, session }, params }) => {
    void queryClient
      .query(
        publicProfileQueryOptions(apiHttpClient, session.user.id, {
          params: { userId: params.userId },
        }),
      )
      .catch(constVoid)
  },
  staticData: { backLabel: 'Profil użytkownika' },
  component: PublicProfilePage,
  head: () => ({
    meta: seo({ title: 'Profil użytkownika' }),
  }),
})
