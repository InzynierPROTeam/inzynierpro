import { createFileRoute } from '@tanstack/react-router'
import { seo } from '~platform/config/app'
import { OralStudyPage } from '~platform/features/learning/OralStudyPage'

export const Route = createFileRoute('/_maybeauthenticated/(app)/_authenticated/ustny')({
  component: OralStudyPage,
  head: () => ({
    meta: [
      ...seo({ title: 'Przygotowanie do egzaminu ustnego' }),
      { name: 'robots', content: 'noindex' },
    ],
  }),
})
