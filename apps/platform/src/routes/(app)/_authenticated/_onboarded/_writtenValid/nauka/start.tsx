import { createFileRoute } from '@tanstack/react-router'
import { Schema } from 'effect'
import { seo } from '~platform/config/app'
import { StartLearningSessionPage } from '~platform/features/learningSession/StartLearningSessionPage'
import { LearningPreviewSearch } from '~platform/features/learningSession/validation'

export const Route = createFileRoute('/(app)/_authenticated/_onboarded/_writtenValid/nauka/start')({
  validateSearch: Schema.toStandardSchemaV1(LearningPreviewSearch),
  component: StartLearningSessionPage,
  head: () => ({ meta: seo({ title: 'Zacznij sesję nauki' }) }),
})
