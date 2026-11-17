import { mockExamHistoryInfiniteQueryOptions } from '@inzpro/queries/modules/mock-exams/queries'
import { createFileRoute } from '@tanstack/react-router'
import { constVoid } from 'effect/Function'
import { seo } from '~platform/config/app'
import { MockExamPage } from '~platform/features/mockExam/MockExamPage'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute(
  '/(app)/_authenticated/_onboarded/_writtenValid/egzamin-probny/',
)({
  loader: ({ context: { queryClient, session, selectedPath } }) => {
    void queryClient
      .infiniteQuery(
        mockExamHistoryInfiniteQueryOptions(apiHttpClient, session.user.id, {
          params: { qualificationPathId: selectedPath.id },
          query: {},
        }),
      )
      .catch(constVoid)
  },
  staticData: { backLabel: 'Egzamin próbny' },
  component: MockExamPage,
  head: () => ({ meta: seo({ title: 'Egzamin próbny' }) }),
})
