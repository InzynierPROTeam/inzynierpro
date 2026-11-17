import { mockExamPreviewQueryOptions } from '@inzpro/queries/modules/mock-exams/queries'
import { createFileRoute } from '@tanstack/react-router'
import { constVoid } from 'effect/Function'
import { seo } from '~platform/config/app'
import { MockExamPreviewPage } from '~platform/features/mockExam/MockExamPreviewPage'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute(
  '/(app)/_authenticated/_onboarded/_writtenValid/egzamin-probny/start',
)({
  loader: ({ context: { queryClient, session, selectedPath } }) => {
    void queryClient
      .query(
        mockExamPreviewQueryOptions(apiHttpClient, session.user.id, {
          params: { qualificationPathId: selectedPath.id },
        }),
      )
      .catch(constVoid)
  },
  component: MockExamPreviewPage,
  head: () => ({ meta: seo({ title: 'Zacznij egzamin próbny' }) }),
})
