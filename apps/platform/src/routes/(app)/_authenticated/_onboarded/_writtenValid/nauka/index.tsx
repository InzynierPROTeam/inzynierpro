import { createFileRoute } from '@tanstack/react-router'
import { seo } from '~platform/config/app'
import { WrittenStudyPage } from '~platform/features/written/WrittenStudyPage'

export const Route = createFileRoute('/(app)/_authenticated/_onboarded/_writtenValid/nauka/')({
  component: WrittenStudyPage,
  head: () => ({ meta: seo({ title: 'Nauka' }) }),
})
