import { createFileRoute } from '@tanstack/react-router'
import { seo } from '~platform/config/app'
import { OralStudyPage } from '~platform/features/oral/OralStudyPage'

export const Route = createFileRoute('/(app)/_authenticated/_onboarded/_oralValid/ustny')({
  component: OralStudyPage,
  head: () => ({
    meta: seo({ title: 'Przygotowanie do egzaminu ustnego' }),
  }),
})
