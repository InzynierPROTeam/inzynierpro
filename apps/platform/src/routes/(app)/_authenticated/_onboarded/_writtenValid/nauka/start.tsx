import { sessionPreviewQueryOptions } from '@inzpro/queries/modules/study'
import { createFileRoute } from '@tanstack/react-router'
import { Schema } from 'effect'
import { constVoid } from 'effect/Function'
import { seo } from '~platform/config/app'
import { StartLearningSessionPage } from '~platform/features/learningSession/StartLearningSessionPage'
import { LearningPreviewSearch } from '~platform/features/learningSession/validation'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute('/(app)/_authenticated/_onboarded/_writtenValid/nauka/start')({
  validateSearch: Schema.toStandardSchemaV1(LearningPreviewSearch),
  loaderDeps: ({ search }) => ({
    documentId: search['akt-prawny'],
    afterDocumentId: search['obecny-akt-prawny'],
  }),
  loader: ({ context: { queryClient, session, selectedPath }, deps }) => {
    void queryClient
      .query(
        sessionPreviewQueryOptions(apiHttpClient, session.user.id, {
          params: { qualificationPathId: selectedPath.id },
          query: deps,
        }),
      )
      .catch(constVoid)
  },
  staticData: { backLabel: 'Sesja nauki' },
  component: StartLearningSessionPage,
  head: () => ({ meta: seo({ title: 'Zacznij sesję nauki' }) }),
})
