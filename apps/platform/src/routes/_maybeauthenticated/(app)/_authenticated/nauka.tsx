import { createFileRoute } from '@tanstack/react-router'
import { seo } from '~platform/config/app'
import { WrittenStudyPage } from '~platform/features/learning/WrittenStudyPage'

export const Route = createFileRoute('/_maybeauthenticated/(app)/_authenticated/nauka')({
  component: WrittenStudyPage,
  head: () => ({
    meta: [
      ...seo({ title: 'Nauka do egzaminu pisemnego' }),
      { name: 'robots', content: 'noindex' },
    ],
  }),
})
