import { createFileRoute } from '@tanstack/react-router'
import { seo } from '~platform/config/app'
import { ProfilePage } from '~platform/features/profile/ProfilePage'

export const Route = createFileRoute('/_maybeauthenticated/(app)/_authenticated/profil')({
  component: ProfilePage,
  head: () => ({
    meta: [...seo({ title: 'Profil i ścieżki nauki' }), { name: 'robots', content: 'noindex' }],
  }),
})
